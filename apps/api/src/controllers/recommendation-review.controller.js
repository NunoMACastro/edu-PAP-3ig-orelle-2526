/**
 * Controller de revisao manual de recomendacoes.
 */
import { createRecommendationReview } from "../services/recommendation-review.service.js";
import { validateRecommendationReviewInput } from "../validators/recommendation-review.validator.js";

export async function createRecommendationReviewController(req, res, next) {
    try {
        const input = validateRecommendationReviewInput(req.params, req.body);
        const review = await createRecommendationReview(req.user.id, input);
        return res.status(201).json({ review });
    } catch (err) {
        return next(err);
    }
}
