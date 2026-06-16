/**
 * Validadores de checkout e historico de encomendas.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { PAYMENT_GATEWAYS } from "../models/order.model.js";

/**
 * Valida gateway de checkout.
 *
 * @function validateCheckoutPayload
 * @param {Record<string, unknown>} body - Corpo HTTP.
 * @returns {{gateway: string}} Gateway normalizado.
 * @throws {AppError} Quando o gateway nao e suportado.
 */
export function validateCheckoutPayload(body) {
    const gateway = String(body?.gateway ?? PAYMENT_GATEWAYS.STRIPE)
        .trim()
        .toLowerCase();

    if (!Object.values(PAYMENT_GATEWAYS).includes(gateway)) {
        throw new AppError(400, "Gateway de pagamento invalido");
    }

    return { gateway };
}

/**
 * Valida parametro `orderId`.
 *
 * @function validateOrderIdParam
 * @param {Record<string, unknown>} params - Params Express.
 * @returns {{orderId: string}} ID normalizado.
 * @throws {AppError} Quando o ID e invalido.
 */
export function validateOrderIdParam(params) {
    const orderId = String(params?.orderId ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError(400, "Encomenda invalida");
    }

    return { orderId };
}
