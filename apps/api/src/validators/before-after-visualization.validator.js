/**
 * Validador de visualização antes/depois.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o body usado para criar uma visualização antes/depois.
 *
 * @function validateBeforeAfterVisualizationInput
 * @param {object} body - Body recebido do pedido HTTP.
 * @returns {{simulationId: string}} Dados normalizados para o service.
 * @throws {AppError} Quando o ID da simulação não é um ObjectId válido.
 */
export function validateBeforeAfterVisualizationInput(body) {
    const simulationId = String(body?.simulationId ?? "");

    if (!mongoose.isValidObjectId(simulationId)) {
        throw new AppError(400, "ID de simulação inválido");
    }

    return { simulationId };
}
