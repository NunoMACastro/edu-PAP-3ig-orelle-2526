import { reorderFromOrder } from "../services/reorder.service.js";
import { validateReorderParams } from "../validators/reorder.validator.js";

/**
 * Handler HTTP que adiciona ao carrinho os produtos disponíveis de uma encomenda anterior.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function reorderController(req, res, next) {
    try {
        const { orderId } = validateReorderParams(req.params);
        const result = await reorderFromOrder(req.user.id, orderId);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}