/**
 * Controllers de recomendacoes personalizadas da MF2.
 */
import {
    generateRecommendationsForUser,
    listRecommendationsForUser,
    submitRecommendationFeedback,
} from "../services/recommendation.service.js";
import { validateRecommendationFeedbackInput } from "../validators/recommendation-feedback.validator.js";

/**
 * Gera recomendacoes para o utilizador autenticado.
 */
export async function generateRecommendationsController(req, res, next) {
    try {
        const recommendations = await generateRecommendationsForUser(req.user.id);
        return res.status(201).json({ recommendations });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista recomendacoes do utilizador autenticado.
 */
export async function listRecommendationsController(req, res, next) {
    try {
        const recommendations = await listRecommendationsForUser(req.user.id);
        return res.status(200).json({ recommendations });
    } catch (err) {
        return next(err);
    }
}

/**
 * Regista feedback do cliente sobre uma recomendacao.
 */
export async function submitRecommendationFeedbackController(req, res, next) {
    try {
        const input = validateRecommendationFeedbackInput(req.params, req.body);
        const recommendation = await submitRecommendationFeedback(req.user.id, input);
        return res.status(200).json({ recommendation });
    } catch (err) {
        return next(err);
    }
}
