/**
 * Validadores de checkout e historico de encomendas.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida que o checkout não tenta escolher gateways ou alterar totais.
 *
 * @function validateCheckoutPayload
 * @param {Record<string, unknown>} body - Corpo HTTP.
 * @returns {{voucherCode?: string}} Preferência comercial normalizada.
 * @throws {AppError} Quando o cliente tenta alargar o contrato.
 */
export function validateCheckoutPayload(body) {
    if (body === undefined || body === null) return {};

    if (
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((key) => key !== "voucherCode")
    ) {
        throw new AppError(
            400,
            "O checkout não aceita método, preço ou dados de pagamento.",
        );
    }

    if (!Object.hasOwn(body, "voucherCode")) return {};

    const voucherCode = String(body.voucherCode ?? "").trim().toUpperCase();
    if (
        voucherCode.length < 6 ||
        voucherCode.length > 64 ||
        !/^[A-Z0-9-]+$/.test(voucherCode)
    ) {
        throw new AppError(400, "O código do voucher é inválido.");
    }

    return { voucherCode };
}

/**
 * Valida a chave idempotente obrigatória da simulação.
 *
 * @param {import("express").Request["headers"]} headers - Headers normalizados pelo Express.
 * @returns {string} Chave segura para hashing interno.
 */
export function validatePaymentIdempotencyKey(headers) {
    const rawKey = headers?.["idempotency-key"];
    const key = Array.isArray(rawKey) ? "" : String(rawKey ?? "").trim();

    if (
        key.length < 8 ||
        key.length > 128 ||
        !/^[A-Za-z0-9._:-]+$/.test(key)
    ) {
        throw new AppError(
            400,
            "Header Idempotency-Key obrigatório e inválido.",
        );
    }

    return key;
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
