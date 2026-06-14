import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para adicionar um produto ao carrinho.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ productId: string, quantity: number }} Produto e quantidade normalizados.
 * @throws {AppError} Quando o produto ou a quantidade não são válidos.
 */
export function validateCartItemPayload(body) {
    const productId = String(body?.productId || "").trim();
    const quantity = Number(body?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new AppError(400, "Quantidade deve ser um número inteiro entre 1 e 99");
    }

    return { productId, quantity };
}

/**
 * Valida o payload usado para alterar a quantidade de um item existente.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ quantity: number }} Quantidade validada.
 * @throws {AppError} Quando a quantidade não é um inteiro entre 1 e 99.
 */
export function validateCartQuantityPayload(body) {
    const quantity = Number(body?.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new AppError(400, "Quantidade deve ser um número inteiro entre 1 e 99");
    }

    return { quantity };
}

/**
 * Valida o productId recebido nos params das routes PATCH e DELETE.
 * @param {unknown} params - Parâmetros da route Express.
 * @returns {{ productId: string }} ID do produto validado.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateCartProductParam(params) {
    const productId = String(params?.productId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    return { productId };
}