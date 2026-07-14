/**
 * Controllers administrativos de moderacao de reviews.
 */
import {
    listAdminReviews,
    moderateReview,
} from "../services/admin-review.service.js";
import { validateReviewModerationInput } from "../validators/admin-review.validator.js";

/**
 * Lista reviews para moderacao.
 *
 * @async
 * @function listAdminReviewsController
 * @param {import("express").Request} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware para erros.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com reviews pendentes ou moderadas.
 */
export async function listAdminReviewsController(req, res, next) {
    try {
        const reviews = await listAdminReviews();
        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza estado de moderacao de uma review.
 *
 * @async
 * @function moderateReviewController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido admin com review alvo e decisao.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware para erros.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a review atualizada.
 */
export async function moderateReviewController(req, res, next) {
    try {
        const input = validateReviewModerationInput(req.params, req.body);
        const review = await moderateReview({
            ...input,
            actorUserId: req.user.id,
        });

        return res.status(200).json({ review });
    } catch (err) {
        return next(err);
    }
}
