import {
    createProductReview,
    listProductReviews,
} from "../services/review.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";
import { validateReviewInput } from "../validators/review.validator.js";

export async function createProductReviewController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const input = validateReviewInput(req.body);
        const review = await createProductReview(productId, req.user.id, input);

        return res.status(201).json({ review });
    } catch (err) {
        return next(err);
    }
}

export async function listProductReviewsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const reviews = await listProductReviews(productId);

        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}
