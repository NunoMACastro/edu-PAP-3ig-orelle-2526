/**
 * Controllers de encomendas.
 */
import {
    checkoutMyCart,
    listMyOrders,
} from "../services/order.service.js";
import { validateCheckoutPayload } from "../validators/checkout.validator.js";

/**
 * Cria encomenda e inicia pagamento a partir do carrinho.
 *
 * @async
 * @function checkoutController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function checkoutController(req, res, next) {
    try {
        const input = validateCheckoutPayload(req.body);
        const order = await checkoutMyCart(req.user.id, input);

        return res.status(201).json({ order });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista historico de encomendas do cliente autenticado.
 *
 * @async
 * @function listMyOrdersController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listMyOrdersController(req, res, next) {
    try {
        const orders = await listMyOrders(req.user.id);
        return res.status(200).json({ orders });
    } catch (err) {
        return next(err);
    }
}
