import { AppError } from "../middlewares/error.middleware.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

function toReviewDto(review) {
    return {
        id: review._id.toString(),
        status: review.status,
        note: review.note,
        adjustedExplanation: review.adjustedExplanation,
        reviewedAt: review.reviewedAt,
    };
}

function toRecommendationReviewDto(recommendation) {
    return {
        id: recommendation._id.toString(),
        clientUserId: recommendation.userId.toString(),
        product: toProductDto(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        status: recommendation.status,
    };
}

export async function reviewRecommendation(consultantId, recommendationId, input) {
    const recommendation = await ProductRecommendation.findById(recommendationId)
        .select("_id userId productId score reasonCodes explanation status")
        .populate("productId", "name brandName imageUrl priceCents stock");

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    const review = await RecommendationReview.create({
        recommendationId: recommendation._id,
        clientUserId: recommendation.userId,
        consultantId,
        status: input.status,
        note: input.note,
        adjustedExplanation: input.adjustedExplanation,
    });

    if (input.status === "rejected") {
        recommendation.status = "dismissed";
    }

    if (input.status === "approved") {
        recommendation.status = "active";
    }

    if (input.status === "adjusted") {
        recommendation.status = "active";
        recommendation.explanation = input.adjustedExplanation;
    }

    await recommendation.save();

    return {
        review: toReviewDto(review),
        recommendation: toRecommendationReviewDto(recommendation),
    };
}