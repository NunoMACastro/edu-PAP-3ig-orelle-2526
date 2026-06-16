/**
 * Service de revisão manual de recomendações da MF2.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";

const PRODUCT_SELECT = "name brandName imageUrl priceCents stock";

/**
 * Converte a revisão e a recomendação atualizada para DTO público.
 *
 * @function toReviewDto
 * @param {object} review - Revisão manual persistida.
 * @param {object} recommendation - Recomendação revista e populada com produto.
 * @returns {object} Revisão segura para resposta HTTP.
 */
function toReviewDto(review, recommendation) {
    return {
        id: review._id.toString(),
        recommendation: {
            id: recommendation._id.toString(),
            product: {
                id: recommendation.productId._id.toString(),
                name: recommendation.productId.name,
                brandName: recommendation.productId.brandName,
                imageUrl: recommendation.productId.imageUrl,
                priceCents: recommendation.productId.priceCents,
                stock: recommendation.productId.stock,
            },
            score: recommendation.score,
            status: recommendation.status,
            explanation: recommendation.explanation,
            reasonCodes: recommendation.reasonCodes,
        },
        status: review.status,
        note: review.note,
        adjustedExplanation: review.adjustedExplanation,
        createdAt: review.createdAt,
    };
}

/**
 * Regista revisão manual por consultor/admin.
 *
 * @async
 * @function createRecommendationReview
 * @param {string} consultantId - Utilizador consultor/admin autenticado.
 * @param {object} input - Dados validados.
 * @returns {Promise<object>} Revisão pública.
 */
export async function createRecommendationReview(consultantId, input) {
    const recommendation = await ProductRecommendation.findById(input.recommendationId)
        .select("userId productId score status explanation reasonCodes")
        .populate("productId", PRODUCT_SELECT);

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    const nextStatus =
        input.status === "rejected"
            ? "dismissed"
            : input.status === "adjusted"
              ? "adjusted"
              : "accepted";
    const nextExplanation =
        input.status === "adjusted"
            ? input.adjustedExplanation
            : recommendation.explanation;

    recommendation.status = nextStatus;
    recommendation.explanation = nextExplanation;
    recommendation.consultantNote = input.note;
    await recommendation.save();

    const review = await RecommendationReview.create({
        recommendationId: recommendation._id,
        clientUserId: recommendation.userId,
        consultantId,
        status: input.status,
        note: input.note,
        adjustedExplanation: input.adjustedExplanation,
    });

    return toReviewDto(review, recommendation);
}
