// server/src/controllers/order-history.controller.js
import { listMyOrders } from "../services/order.service.js";

/**
 * Handler HTTP que devolve o histórico do utilizador autenticado.
 * @param {import("express").Request} req - Pedido Express com sessão em `req.user`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function listMyOrdersController(req, res, next) {
    try {
        const orders = await listMyOrders(req.user.id);
        return res.status(200).json({ orders });
    } catch (err) {
        return next(err);
    }
}