/**
 * Validador partilhado para IDs de produto em rotas publicas da MF1.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o parametro `productId` como ObjectId MongoDB.
 *
 * @function validateProductIdParam
 * @param {{productId?: unknown}} params - Parametros de rota Express.
 * @returns {string} Product ID seguro.
 * @throws {AppError} Quando o ID tem formato invalido.
 */
export function validateProductIdParam(params) {
    const productId = String(params.productId ?? "").trim();

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return productId;
}
