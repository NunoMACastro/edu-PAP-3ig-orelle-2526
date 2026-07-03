/**
 * Controllers de recompra.
 */
import { reorderFromOrder } from "../services/reorder.service.js";
import { validateOrderIdParam } from "../validators/checkout.validator.js";

/**
 * Adiciona produtos de uma encomenda anterior ao carrinho.
 *
 * @async
 * @function reorderController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function reorderController(req, res, next) {
    try {
        const { orderId } = validateOrderIdParam(req.params);
        const result = await reorderFromOrder(req.user.id, orderId);

        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
