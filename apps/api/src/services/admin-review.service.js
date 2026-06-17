// apps/api/src/services/admin-review.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { Review } from "../models/review.model.js";

/**
 * Converte review para DTO administrativo sem dados sensíveis.
 *
 * @function toAdminReviewDto
 * @param {object} review - Documento Mongoose populado.
 * @returns {object} Review segura para admin.
 */
function toAdminReviewDto(review) {
    return {
        id: review._id.toString(),
        productId: review.productId?._id?.toString() ?? review.productId.toString(),
        productName: review.productId?.name ?? "",
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        moderationReason: review.moderationReason,
        moderatedAt: review.moderatedAt,
        createdAt: review.createdAt,
    };
}

/**
 * Lista reviews para moderação administrativa.
 *
 * @async
 * @function listAdminReviews
 * @returns {Promise<object[]>} Reviews ordenadas por data.
 */
export async function listAdminReviews() {
    const reviews = await Review.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("productId", "name");

    return reviews.map(toAdminReviewDto);
}

/**
 * Atualiza visibilidade de uma review.
 *
 * @async
 * @function moderateReview
 * @param {{reviewId: string, status: "published"|"hidden", moderationReason: string, adminUserId: string}} input - Ação validada.
 * @returns {Promise<object>} Review moderada.
 */
export async function moderateReview(input) {
    const review = await Review.findByIdAndUpdate(
        input.reviewId,
        {
            status: input.status,
            moderationReason: input.moderationReason,
            moderatedBy: input.adminUserId,
            moderatedAt: new Date(),
        },
        { new: true, runValidators: true },
    ).populate("productId", "name");

    if (!review) {
        throw new AppError(404, "Review não encontrada");
    }

    return toAdminReviewDto(review);
}
