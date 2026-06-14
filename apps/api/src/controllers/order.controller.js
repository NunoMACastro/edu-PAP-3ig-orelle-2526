import { checkoutMyCart } from "../services/order.service.js";
import { validateCheckoutPayload } from "../validators/checkout.validator.js";

/**
 * Handler HTTP que cria uma encomenda e inicia o fluxo de pagamento.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function checkoutController(req, res, next) {
    try {
        const payload = validateCheckoutPayload(req.body);
        const order = await checkoutMyCart(req.user.id, payload);
        return res.status(201).json({ order });
    } catch (err) {
        return next(err);
    }
}