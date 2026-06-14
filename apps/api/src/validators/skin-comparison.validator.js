import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para pedir uma comparação entre duas análises.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ baselineAnalysisId: string, followUpAnalysisId: string }} IDs normalizados.
 * @throws {AppError} Quando algum ID é inválido ou quando os dois IDs são iguais.
 */
export function validateSkinComparisonPayload(body) {
    const baselineAnalysisId = String(body?.baselineAnalysisId || "").trim();
    const followUpAnalysisId = String(body?.followUpAnalysisId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(baselineAnalysisId)) {
        throw new AppError(400, "Análise inicial inválida");
    }

    if (!mongoose.Types.ObjectId.isValid(followUpAnalysisId)) {
        throw new AppError(400, "Análise final inválida");
    }

    if (baselineAnalysisId === followUpAnalysisId) {
        throw new AppError(400, "Escolhe duas análises diferentes");
    }

    return { baselineAnalysisId, followUpAnalysisId };
}