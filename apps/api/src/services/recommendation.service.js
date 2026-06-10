import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { buildRecommendationReason } from "./recommendation-reason.service.js";

const POSITIVE_STOCK_LIMIT = 50;
const MAX_RECOMMENDATIONS = 5;
const MIN_RECOMMENDATIONS = 3;
const CONCERN_TERMS = {
    acne: ["acne", "imperfeic", "borbulh", "salicilico", "niacinamida"],
    manchas: ["mancha", "uniform", "vitamina c", "despigment", "luminos"],
    rugas: ["ruga", "anti-idade", "retinol", "peptid", "firmeza"],
    oleosidade: ["oleosidade", "sebo", "matificante", "oil-free", "niacinamida"],
};

function normalizeLabel(value) {
    return String(value ?? "nao_conclusivo")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function getFindingLabel(analysis, key) {
    return normalizeLabel(analysis.findings?.[key]?.label);
}

function productSupportsSkinType(product, skinType) {
    const allowedSkinTypes = (product.skinTypes ?? []).map(normalizeLabel);
    return allowedSkinTypes.includes(skinType) || allowedSkinTypes.includes("todos");
}

function searchableProductText(product) {
    return [
        product.name,
        product.brandName,
        product.description,
        ...(product.ingredients ?? []),
    ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function productMatchesConcern(product, key) {
    const productText = searchableProductText(product);
    return (CONCERN_TERMS[key] ?? []).some((term) => productText.includes(term));
}

function calculateProductScore(product, analysis) {
    const skinType = getFindingLabel(analysis, "skinType");
    let score = 0;
    const reasonCodes = new Set();
    const sourceSignals = new Set();

    if (skinType !== "nao_conclusivo" && productSupportsSkinType(product, skinType)) {
        score += 0.45;
        reasonCodes.add(`skin_type_${skinType}`);
        sourceSignals.add("skinType");
    }

    for (const key of ["acne", "manchas", "rugas", "oleosidade"]) {
        const label = getFindingLabel(analysis, key);

        if (label !== "nao_conclusivo" && productMatchesConcern(product, key)) {
            score += 0.15;
            reasonCodes.add(`${key}_${label}`);
            sourceSignals.add(key);
        }
    }

    const hasCosmeticReason = reasonCodes.size > 0;
    const normalizedScore = hasCosmeticReason ? Math.min(Number(score.toFixed(2)), 0.98) : 0;

    return {
        score: normalizedScore,
        reasonCodes: Array.from(reasonCodes),
        sourceSignals: Array.from(sourceSignals),
    };
}

function buildExplanation(product, analysis, reasonCodes) {
    const skinType = getFindingLabel(analysis, "skinType");
    const cosmeticReasons = reasonCodes.join(", ");

    return [
        `${product.name} foi recomendado porque existe compatibilidade verificável entre o produto e a análise facial.`,
        `A análise indica pele ${skinType}; a disponibilidade em stock permite apresentar o produto, mas não é usada como motivo cosmético.`,
        `Motivos técnicos: ${cosmeticReasons}.`,
    ].join(" ");
}

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredients: product.ingredients,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

function toRecommendationDto(recommendation, product) {
    return {
        id: recommendation._id.toString(),
        product: toProductDto(product),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        status: recommendation.status,
        feedback: recommendation.feedback,
        createdAt: recommendation.createdAt,
    };
}

async function getLatestInputs(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída e relatório são obrigatórios");
    }

    const report = await FaceReport.findOne({
        userId,
        analysisId: analysis._id,
    }).sort({ createdAt: -1 });

    if (!report) {
        throw new AppError(400, "Relatório da análise facial mais recente é obrigatório");
    }

    return { analysis, report };
}

export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestInputs(userId);

    const products = await Product.find({ stock: { $gt: 0 } })
        .select("name brandName description ingredients skinTypes imageUrl priceCents stock")
        .limit(POSITIVE_STOCK_LIMIT);

    const rankedProducts = products
        .map((product) => ({
            product,
            ranking: calculateProductScore(product, analysis),
        }))
        .filter(({ ranking }) => ranking.reasonCodes.length > 0 && ranking.sourceSignals.length > 0)
        .sort((a, b) => b.ranking.score - a.ranking.score)
        .slice(0, MAX_RECOMMENDATIONS);

    if (rankedProducts.length < MIN_RECOMMENDATIONS) {
        throw new AppError(404, "Não existem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, ranking }) => {
            const reason = buildRecommendationReason({ analysis, product, ranking });

            return ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        reportId: report._id,
                        score: ranking.score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        status: "active",
                    },
                    $setOnInsert: {
                        feedback: { value: null, submittedAt: null },
                    },
                },
                { upsert: true, new: true, runValidators: true },
            );
        }),
    );

    return {
        recommendations: recommendations.map((recommendation, index) =>
            toRecommendationDto(recommendation, rankedProducts[index].product),
        ),
        limitations: [
            ...(analysis.limitations ?? []),
            ...(report.limitations ?? []),
            "Recomendação cosmética baseada em análise e catálogo; não cria compra automática.",
        ],
    };
}

export async function listMyRecommendations(userId) {
    const recommendations = await ProductRecommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("productId", "name brandName description ingredients skinTypes imageUrl priceCents stock");

    return {
        recommendations: recommendations.map((recommendation) =>
            toRecommendationDto(recommendation, recommendation.productId),
        ),
    };
}

export async function submitRecommendationFeedback(userId, recommendationId, input) {
    const recommendation = await ProductRecommendation.findOne({
        _id: recommendationId,
        userId,
    }).populate("productId", "name brandName imageUrl priceCents stock");

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    recommendation.feedback = {
        value: input.value,
        submittedAt: new Date(),
    };

    recommendation.status = input.value === "util" ? "accepted" : "dismissed";
    await recommendation.save();

    return {
        recommendation: toRecommendationDto(recommendation, recommendation.productId),
    };
}