/**
 * Service administrativo de moderacao de reviews.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Review } from "../models/review.model.js";

const REVIEW_STATUSES = Object.freeze({
    PUBLISHED: "published",
    HIDDEN: "hidden",
});

/**
 * Converte review para DTO admin seguro.
 *
 * @function toAdminReviewDto
 * @param {object} review - Documento Mongoose ou mock equivalente.
 * @returns {object} Review sem dados sensiveis.
 */
function toAdminReviewDto(review) {
    return {
        id: review._id.toString(),
        productId: review.productId.toString(),
        userId: review.userId.toString(),
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        moderationReason: review.moderationReason ?? null,
        moderatedBy: review.moderatedBy?.toString?.() ?? null,
        moderatedAt: review.moderatedAt ?? null,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}

/**
 * Lista reviews para painel admin.
 *
 * @async
 * @function listAdminReviews
 * @returns {Promise<object[]>} Reviews recentes.
 */
export async function listAdminReviews() {
    const reviews = await Review.find({})
        .sort({ createdAt: -1 })
        .limit(100);

    return reviews.map(toAdminReviewDto);
}

/**
 * Modera visibilidade de uma review sem editar conteudo do cliente.
 *
 * @async
 * @function moderateReview
 * @param {{reviewId: string, status: string, moderationReason: string|null, actorUserId: string}} input - Acao admin.
 * @returns {Promise<object>} Review moderada.
 * @throws {AppError} Quando a review nao existe.
 */
export async function moderateReview({
    reviewId,
    status,
    moderationReason,
    actorUserId,
}) {
    const update =
        status === REVIEW_STATUSES.PUBLISHED
            ? {
                  status,
                  moderationReason: null,
                  moderatedBy: actorUserId,
                  moderatedAt: new Date(),
              }
            : {
                  status,
                  moderationReason,
                  moderatedBy: actorUserId,
                  moderatedAt: new Date(),
              };

    const review = await Review.findByIdAndUpdate(reviewId, update, {
        new: true,
        runValidators: true,
    });

    if (!review) {
        throw new AppError(404, "Review não encontrada");
    }

    return toAdminReviewDto(review);
}
