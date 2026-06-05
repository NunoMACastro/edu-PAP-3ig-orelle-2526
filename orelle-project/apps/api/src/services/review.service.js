import { AppError } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

function toReviewResponse(review) {
    return {
        id: review._id.toString(),
        productId: review.productId.toString(),
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
    };
}

function isDuplicateReviewError(err) {
    return err?.code === 11000;
}

export async function createProductReview(productId, userId, input) {
    const exists = await Product.exists({ _id: productId });

    if (!exists) {
        throw new AppError(404, "Produto não encontrado");
    }

    try {
        const review = await Review.create({
            productId,
            userId,
            rating: input.rating,
            comment: input.comment,
        });

        return toReviewResponse(review);
    } catch (err) {
        if (isDuplicateReviewError(err)) {
            throw new AppError(409, "Já avaliaste este produto");
        }

        throw err;
    }
}

export async function listProductReviews(productId) {
    const reviews = await Review.find({ productId, status: "published" })
        .sort({ createdAt: -1 })
        .limit(30);

    return reviews.map(toReviewResponse);
}