/**
 * Service de recomendacoes personalizadas da MF2.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Profile } from "../models/profile.model.js";
import { buildRecommendationReason } from "./recommendation-reason.service.js";
import { filterProductsBlockedByProfile } from "./recommendation-restrictions.service.js";

const SIGNAL_LABELS = Object.freeze(["moderado", "moderada", "alto", "alta"]);
const PRODUCT_SELECT = "name brandName description ingredientNames skinTypes imageUrl priceCents stock";

/**
 * Converte produto populado para DTO publico.
 *
 * @function toProductSnapshot
 * @param {object} product - Produto Mongoose ou mock equivalente.
 * @returns {object} Produto publico.
 */
function toProductSnapshot(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

/**
 * Converte recomendacao para DTO publico.
 *
 * @function toRecommendationDto
 * @param {object} recommendation - Documento populado.
 * @returns {object} Recomendacao publica.
 */
function toRecommendationDto(recommendation) {
    return {
        id: recommendation._id.toString(),
        product: toProductSnapshot(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        limitations: recommendation.limitations,
        status: recommendation.status,
        feedback: recommendation.feedback,
        consultantNote: recommendation.consultantNote,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt,
    };
}

/**
 * Avalia compatibilidade cosmetica entre produto e analise.
 *
 * @function scoreProductForAnalysis
 * @param {object} product - Produto candidato.
 * @param {object} analysis - Analise facial concluida.
 * @returns {{score: number, reasonCodes: string[], sourceSignals: string[]}|null} Ranking ou null.
 */
function scoreProductForAnalysis(product, analysis) {
    const reasonCodes = [];
    const sourceSignals = [];
    let score = 0;
    const findings = analysis.findings;
    const productText = [
        product.name,
        product.description,
        ...(product.ingredientNames ?? []),
    ]
        .join(" ")
        .toLowerCase();
    const skinType = findings.skinType?.label;

    if (skinType && product.skinTypes.includes(skinType)) {
        score += 0.45;
        reasonCodes.push("skin_type_match");
        sourceSignals.push(`skinType:${skinType}`);
    }

    if (
        SIGNAL_LABELS.includes(findings.oleosidade?.label) &&
        (product.skinTypes.includes("oleosa") || product.skinTypes.includes("mista"))
    ) {
        score += 0.25;
        reasonCodes.push("oiliness_support");
        sourceSignals.push(`oleosidade:${findings.oleosidade.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.acne?.label) && productText.includes("acne")) {
        score += 0.15;
        reasonCodes.push("acne_support");
        sourceSignals.push(`acne:${findings.acne.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.manchas?.label) && productText.includes("mancha")) {
        score += 0.1;
        reasonCodes.push("spots_support");
        sourceSignals.push(`manchas:${findings.manchas.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.rugas?.label) && productText.includes("ruga")) {
        score += 0.1;
        reasonCodes.push("wrinkles_support");
        sourceSignals.push(`rugas:${findings.rugas.label}`);
    }

    if (reasonCodes.length === 0) return null;

    return {
        score: Math.min(Number(score.toFixed(2)), 1),
        reasonCodes,
        sourceSignals,
    };
}

/**
 * Obtem a ultima analise concluida e relatorio correspondente.
 *
 * @async
 * @function getLatestAnalysisAndReport
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<{analysis: object, report: object}>} Contrato de recomendacao.
 */
async function getLatestAnalysisAndReport(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.findOne({
        userId,
        analysisId: analysis._id,
    }).sort({ createdAt: -1 });

    if (!report) {
        throw new AppError(400, "Relatório da análise mais recente obrigatório");
    }

    return { analysis, report };
}

/**
 * Gera recomendacoes personalizadas do utilizador autenticado.
 *
 * @async
 * @function generateRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Recomendacoes geradas.
 */
export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestAnalysisAndReport(userId);
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(400, "Perfil cosmético obrigatório");
    }

    const products = await Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);
    const allowedProducts = filterProductsBlockedByProfile(products, profile);

    const rankedProducts = allowedProducts
        .map((product) => {
            const ranking = scoreProductForAnalysis(product, analysis);
            if (!ranking) return null;

            return { product, ...ranking };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (rankedProducts.length < 3) {
        throw new AppError(404, "Catálogo sem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, score, reasonCodes, sourceSignals }) => {
            const reason = buildRecommendationReason({
                reasonCodes,
                sourceSignals,
                product,
            });

            return ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        reportId: report._id,
                        score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        limitations: [
                            ...new Set([
                                ...(report.limitations ?? []),
                                ...(profile.lightMedicalRestrictions ?? []).map(
                                    (restriction) =>
                                        `Restrição declarada respeitada: ${restriction}.`,
                                ),
                                "Recomendação cosmética; não substitui avaliação médica.",
                                "Produtos não são adicionados automaticamente ao carrinho.",
                            ]),
                        ],
                        status: "active",
                        feedback: null,
                        consultantNote: null,
                    },
                },
                { upsert: true, new: true, runValidators: true },
            ).populate("productId", PRODUCT_SELECT);
        }),
    );

    return recommendations.map(toRecommendationDto);
}

/**
 * Lista recomendacoes do proprio utilizador.
 *
 * @async
 * @function listRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Recomendacoes publicas.
 */
export async function listRecommendationsForUser(userId) {
    const recommendations = await ProductRecommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("productId", PRODUCT_SELECT);

    return recommendations.map(toRecommendationDto);
}

/**
 * Regista feedback do cliente numa recomendacao.
 *
 * @async
 * @function submitRecommendationFeedback
 * @param {string} userId - Utilizador autenticado.
 * @param {{recommendationId: string, feedback: "util"|"nao_relevante"}} input - Feedback validado.
 * @returns {Promise<object>} Recomendacao atualizada.
 */
export async function submitRecommendationFeedback(userId, input) {
    const nextStatus = input.feedback === "util" ? "accepted" : "dismissed";
    const recommendation = await ProductRecommendation.findOneAndUpdate(
        { _id: input.recommendationId, userId },
        {
            $set: {
                status: nextStatus,
                feedback: {
                    value: input.feedback,
                    submittedAt: new Date(),
                },
            },
        },
        { new: true, runValidators: true },
    ).populate("productId", PRODUCT_SELECT);

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    return toRecommendationDto(recommendation);
}
