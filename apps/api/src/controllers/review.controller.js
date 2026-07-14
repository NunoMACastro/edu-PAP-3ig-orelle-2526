/**
 * Controllers de reviews de produto.
 */
import {
    createProductReview,
    listProductReviews,
} from "../services/review.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";
import { validateReviewInput } from "../validators/review.validator.js";

/**
 * Cria uma review de cliente autenticado.
 *
 * @async
 * @function createProductReviewController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
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

/**
 * Lista reviews publicadas de um produto.
 *
 * @async
 * @function listProductReviewsController
 * @param {import("express").Request} req - Pedido com `productId`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listProductReviewsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const reviews = await listProductReviews(productId);

        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}
