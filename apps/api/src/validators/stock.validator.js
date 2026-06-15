// server/src/validators/stock.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o productId recebido nas routes administrativas de stock.
 * @param {unknown} params - Parâmetros Express.
 * @returns {{ productId: string }} ID do produto validado.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateProductStockParams(params) {
    const productId = String(params?.productId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    return { productId };
}

/**
 * Valida o payload de alteração manual de stock.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ stock: number }} Stock validado.
 * @throws {AppError} Quando o stock não é inteiro ou é negativo.
 */
export function validateStockPayload(body) {
    const stock = Number(body?.stock);

    if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError(400, "Stock deve ser um número inteiro não negativo");
    }

    return { stock };
}