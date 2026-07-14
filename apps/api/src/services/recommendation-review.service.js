/**
 * Service de revisão manual de recomendações da MF2.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";
import { resolveEffectiveRecommendationExplanation } from "../utils/recommendation-presentation.util.js";

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
            explanation: resolveEffectiveRecommendationExplanation(recommendation),
            machineExplanation: recommendation.explanation,
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
 * @throws {AppError} Quando a recomendacao alvo nao existe.
 */
export async function createRecommendationReview(consultantId, input) {
    const session =
        mongoose.connection.readyState === 1
            ? await mongoose.startSession()
            : null;
    let recommendation;
    let review;

    const persistDecision = async () => {
        let initialQuery = ProductRecommendation.findById(input.recommendationId)
            .select(
                "userId productId score status explanation reasonCodes humanOverride",
            )
            .populate("productId", PRODUCT_SELECT);
        if (session) initialQuery = initialQuery.session(session);
        const currentRecommendation = await initialQuery;

        if (!currentRecommendation) {
            throw new AppError(404, "Recomendação não encontrada");
        }
        if (currentRecommendation.humanOverride) {
            throw new AppError(409, "Recomendação já revista");
        }

        const nextStatus =
            input.status === "rejected"
                ? "dismissed"
                : input.status === "adjusted"
                  ? "adjusted"
                  : "accepted";
        const reviewedAt = new Date();
        const reviewId = new mongoose.Types.ObjectId();
        recommendation = await ProductRecommendation.findOneAndUpdate(
            {
                _id: currentRecommendation._id,
                userId: currentRecommendation.userId,
                status: currentRecommendation.status,
                humanOverride: null,
            },
            {
                $set: {
                    status: nextStatus,
                    consultantNote: input.note,
                    humanOverride: {
                        decision: input.status,
                        note: input.note,
                        adjustedExplanation: input.adjustedExplanation,
                        reviewId,
                        reviewedAt,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
                ...(session ? { session } : {}),
            },
        ).populate("productId", PRODUCT_SELECT);

        if (!recommendation) {
            throw new AppError(409, "Recomendação já revista");
        }

        const reviewPayload = {
            _id: reviewId,
            recommendationId: recommendation._id,
            clientUserId: recommendation.userId,
            consultantId,
            status: input.status,
            note: input.note,
            adjustedExplanation: input.adjustedExplanation,
        };
        review = session
            ? (await RecommendationReview.create([reviewPayload], { session }))[0]
            : await RecommendationReview.create(reviewPayload);
    };

    try {
        if (session) await session.withTransaction(persistDecision);
        else await persistDecision();
        return toReviewDto(review, recommendation);
    } finally {
        await session?.endSession();
    }
}
