/**
 * Controller de revisão manual de recomendações.
 */
import { createRecommendationReview } from "../services/recommendation-review.service.js";
import { validateRecommendationReviewInput } from "../validators/recommendation-review.validator.js";

/**
 * Regista a revisão de uma recomendação feita por consultor ou administrador.
 *
 * @async
 * @function createRecommendationReviewController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado com params e body da revisão.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com a revisão pública.
 */
export async function createRecommendationReviewController(req, res, next) {
    try {
        const input = validateRecommendationReviewInput(req.params, req.body);
        const review = await createRecommendationReview(req.user.id, input);
        return res.status(201).json({ review });
    } catch (err) {
        return next(err);
    }
}
