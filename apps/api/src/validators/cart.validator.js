/**
 * Validadores do carrinho de compras.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida ID de produto vindo de params ou payload.
 *
 * @function validateProductId
 * @param {unknown} value - Valor recebido.
 * @returns {string} ID normalizado.
 * @throws {AppError} Quando o ID e invalido.
 */
function validateProductId(value) {
    const productId = String(value ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return productId;
}

/**
 * Valida quantidade de carrinho.
 *
 * @function validateQuantity
 * @param {unknown} value - Valor recebido.
 * @returns {number} Quantidade inteira.
 * @throws {AppError} Quando a quantidade e invalida.
 */
function validateQuantity(value) {
    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new AppError(400, "Quantidade deve ser inteira entre 1 e 99");
    }

    return quantity;
}

/**
 * Valida payload de adicionar item ao carrinho.
 *
 * @function validateCartItemPayload
 * @param {Record<string, unknown>} body - Corpo HTTP.
 * @returns {{productId: string, quantity: number}} Dados normalizados.
 */
export function validateCartItemPayload(body) {
    return {
        productId: validateProductId(body?.productId),
        quantity: validateQuantity(body?.quantity ?? 1),
    };
}

/**
 * Valida payload de atualizacao de quantidade.
 *
 * @function validateCartQuantityPayload
 * @param {Record<string, unknown>} body - Corpo HTTP.
 * @returns {{quantity: number}} Quantidade normalizada.
 */
export function validateCartQuantityPayload(body) {
    return { quantity: validateQuantity(body?.quantity) };
}

/**
 * Valida parametro `productId` das rotas de carrinho.
 *
 * @function validateCartProductParam
 * @param {Record<string, unknown>} params - Params Express.
 * @returns {{productId: string}} ID normalizado.
 */
export function validateCartProductParam(params) {
    return { productId: validateProductId(params?.productId) };
}
