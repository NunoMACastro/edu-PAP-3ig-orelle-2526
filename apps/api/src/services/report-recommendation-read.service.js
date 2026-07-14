/**
 * Projeção pública partilhada das recomendações de um relatório v2.
 *
 * Este é o único boundary que combina o snapshot histórico congelado com a
 * disponibilidade atual do catálogo. Cliente e consultor recebem a mesma base
 * cosmética, sem ownership, análise, paths privados ou metadata do provider.
 */
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { resolveEffectiveRecommendationGuidance } from "../utils/recommendation-presentation.util.js";
import { buildPublicSourceLabels } from "./recommendation-reason.service.js";
import { buildRoutineSlotCodesForProduct } from "./report-routine-slots.service.js";
import {
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";

function toId(value) {
    return value?.toString?.() ?? String(value);
}

/**
 * Converte as fontes estruturadas do relatório através de uma allowlist
 * fechada. Valores desconhecidos são omitidos, nunca refletidos para a UI.
 *
 * @param {unknown} sources - Fontes persistidas no relatório.
 * @returns {string[]} Labels humanas controladas.
 */
export function buildPublicReportSourceLabels(sources) {
    const allowed = new Map([
        ["fotografia_frontal", "Fotografia frontal autorizada"],
        ["fotografia_perfil", "Fotografia de perfil autorizada"],
    ]);

    return [
        ...new Set(
            (Array.isArray(sources) ? sources : [])
                .map((source) => allowed.get(String(source ?? "").trim()))
                .filter(Boolean),
        ),
    ];
}

/**
 * Lista recomendações pela seleção final do relatório, preservando a ordem
 * congelada e calculando separadamente a disponibilidade atual.
 *
 * @param {object} report - FaceReport v2 já autorizado pelo caller.
 * @param {string|object} userId - Titular usado apenas no filtro interno.
 * @param {{session?: import("mongoose").ClientSession|null, includeClientOnlyFields?: boolean}} [options]
 * @returns {Promise<object[]>} Projeção segura partilhada.
 */
export async function listReportRecommendationDtos(
    report,
    userId,
    { session = null, includeClientOnlyFields = false } = {},
) {
    const frozenIds = (report.finalRecommendationIds ?? []).map(toId);
    let recommendationsQuery = ProductRecommendation.find({
        userId,
        reportId: report._id,
        schemaVersion: 2,
        _id: { $in: frozenIds },
        status: { $ne: "dismissed" },
    });
    if (session) recommendationsQuery = recommendationsQuery.session(session);
    const recommendations = await recommendationsQuery;
    const frozenOrder = new Map(
        frozenIds.map((recommendationId, index) => [recommendationId, index]),
    );
    recommendations.sort(
        (left, right) =>
            (frozenOrder.get(toId(left._id)) ?? Number.MAX_SAFE_INTEGER) -
            (frozenOrder.get(toId(right._id)) ?? Number.MAX_SAFE_INTEGER),
    );

    let productsQuery = Product.find({
        _id: { $in: recommendations.map(({ productId }) => productId) },
    }).select(
        "priceCents stock variants routineSteps concernTags attributes makeup",
    );
    if (session) productsQuery = productsQuery.session(session);
    const products = await productsQuery;
    const productsById = new Map(
        products.map((product) => [toId(product._id), product]),
    );

    return recommendations.map((recommendation) => {
        const product = productsById.get(toId(recommendation.productId));
        const guidance = resolveEffectiveRecommendationGuidance(recommendation);
        let currentAvailability = {
            available: false,
            stock: 0,
            priceCents: recommendation.productSnapshot?.priceCents ?? 0,
        };
        if (product) {
            try {
                const variant = resolveProductVariant(
                    product,
                    recommendation.variantId,
                );
                currentAvailability = {
                    available: resolveVariantStock(product, variant) > 0,
                    stock: resolveVariantStock(product, variant),
                    priceCents: resolveVariantPriceCents(product, variant),
                };
            } catch {
                // O snapshot histórico continua legível sem CTA comercial.
            }
        }

        const availableVariants = (product?.variants ?? [])
            .filter(({ stock }) => stock > 0)
            .map((variant) => ({
                variantId: variant.variantId,
                label: variant.label,
                colorHex: variant.colorHex ?? null,
                finish: variant.finish ?? null,
                coverage: variant.coverage ?? null,
                priceCents: resolveVariantPriceCents(product, variant),
                stock: variant.stock,
                available: true,
            }));
        const visualRoles = [
            ...new Set([
                ...(product?.makeup?.regions ?? []),
                ...(product?.routineSteps ?? []),
            ]),
        ].filter((step) =>
            ["complexion", "cheeks", "eyes", "brows", "lips"].includes(
                step,
            ),
        );
        if (
            product?.concernTags?.includes("sun_protection") &&
            !visualRoles.includes("complexion")
        ) {
            visualRoles.push("complexion");
        }

        return {
            id: toId(recommendation._id),
            rank: recommendation.selectionRank,
            score: recommendation.score,
            product: recommendation.productSnapshot,
            explanation: guidance.explanation,
            usage: guidance.usage,
            cautions: guidance.cautions,
            limitations: recommendation.limitations,
            reasonCodes: recommendation.reasonCodes,
            sourceLabels: buildPublicSourceLabels(
                recommendation.sourceSignals,
            ),
            status: recommendation.status,
            variantId: recommendation.variantId,
            visualRoles,
            visualFunctions: product?.makeup?.functions ?? [],
            routineSlotCodes: buildRoutineSlotCodesForProduct(
                recommendation.productSnapshot ?? {},
            ),
            currentAvailability,
            ...(includeClientOnlyFields
                ? {
                      feedback: recommendation.feedback,
                      availableVariants,
                  }
                : {}),
        };
    });
}
