/**
 * Controllers de recomendacoes personalizadas da MF2.
 */
import {
    listRecommendationsForUser,
    submitRecommendationFeedback,
} from "../services/recommendation.service.js";
import { validateRecommendationFeedbackInput } from "../validators/recommendation-feedback.validator.js";

/**
 * Lista recomendacoes do utilizador autenticado.
 *
 * @async
 * @function listRecommendationsController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado do cliente.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware para erros.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com recomendacoes existentes.
 */
export async function listRecommendationsController(req, res, next) {
    try {
        const result = await listRecommendationsForUser(req.user.id);
        const payload = Array.isArray(result) ? { recommendations: result } : result;

        return res.status(200).json(payload);
    } catch (err) {
        return next(err);
    }
}

/**
 * Regista feedback do cliente sobre uma recomendacao.
 *
 * @async
 * @function submitRecommendationFeedbackController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado com ID da recomendacao e feedback.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware para erros.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a recomendacao atualizada.
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
