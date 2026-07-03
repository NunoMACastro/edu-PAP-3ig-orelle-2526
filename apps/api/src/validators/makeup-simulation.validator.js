/**
 * Validador de simulação de maquilhagem.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o body usado para criar uma simulação de maquilhagem.
 *
 * @function validateMakeupSimulationInput
 * @param {object} body - Body recebido do pedido HTTP.
 * @returns {{productId: string}} Dados normalizados para o service.
 * @throws {AppError} Quando o ID do produto não é um ObjectId válido.
 */
export function validateMakeupSimulationInput(body) {
    const productId = String(body?.productId ?? "");

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "ID de produto inválido");
    }

    return { productId };
}
