import {
    generateRecommendationsForUser,
    listMyRecommendations,
} from "../services/recommendation.service.js";
import { submitRecommendationFeedback } from "../services/recommendation.service.js";
import {
    validateRecommendationFeedbackInput,
    validateRecommendationFeedbackParams,
} from "../validators/recommendation-feedback.validator.js";

export async function submitRecommendationFeedbackController(req, res, next) {
    try {
        const params = validateRecommendationFeedbackParams(req.params);
        const input = validateRecommendationFeedbackInput(req.body);
        const result = await submitRecommendationFeedback(
            req.user.id,
            params.recommendationId,
            input,
        );

        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function generateRecommendationsController(req, res, next) {
    try {
        const result = await generateRecommendationsForUser(req.user.id);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function listMyRecommendationsController(req, res, next) {
    try {
        const result = await listMyRecommendations(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}