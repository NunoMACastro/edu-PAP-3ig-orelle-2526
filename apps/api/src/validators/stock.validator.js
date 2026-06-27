/**
 * Validadores de gestao de stock.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida parametro de produto em rotas admin de stock.
 *
 * @function validateProductStockParams
 * @param {Record<string, unknown>} params - Params Express.
 * @returns {{productId: string}} ID validado.
 * @throws {AppError} Quando ID e invalido.
 */
export function validateProductStockParams(params) {
    const productId = String(params?.productId ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return { productId };
}

/**
 * Valida payload de ajuste manual de stock.
 *
 * @function validateStockPayload
 * @param {Record<string, unknown>} body - Corpo HTTP.
 * @returns {{stock: number}} Stock normalizado.
 * @throws {AppError} Quando stock e negativo, decimal ou ausente.
 */
export function validateStockPayload(body) {
    const stock = Number(body?.stock);

    if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError(400, "Stock deve ser um inteiro nao negativo");
    }

    return { stock };
}
