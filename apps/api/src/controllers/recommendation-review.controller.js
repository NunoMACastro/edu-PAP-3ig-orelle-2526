import { reviewRecommendation } from "../services/recommendation-review.service.js";
import {
    validateRecommendationReviewInput,
    validateRecommendationReviewParams,
} from "../validators/recommendation-review.validator.js";

export async function reviewRecommendationController(req, res, next) {
    try {
        const params = validateRecommendationReviewParams(req.params);
        const input = validateRecommendationReviewInput(req.body);
        const result = await reviewRecommendation(req.user.id, params.recommendationId, input);

        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}