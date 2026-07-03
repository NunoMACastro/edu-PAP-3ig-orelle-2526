/**
 * Validadores da comparacao temporal de pele.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para criar uma comparacao entre duas analises.
 *
 * @function validateSkinComparisonPayload
 * @param {Record<string, unknown>} body - Corpo recebido no pedido HTTP.
 * @returns {{baselineAnalysisId: string, followUpAnalysisId: string}} IDs normalizados.
 * @throws {AppError} Quando algum ID e invalido ou repetido.
 */
export function validateSkinComparisonPayload(body) {
    const baselineAnalysisId = String(body?.baselineAnalysisId ?? "").trim();
    const followUpAnalysisId = String(body?.followUpAnalysisId ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(baselineAnalysisId)) {
        throw new AppError(400, "Analise inicial invalida");
    }

    if (!mongoose.Types.ObjectId.isValid(followUpAnalysisId)) {
        throw new AppError(400, "Analise final invalida");
    }

    if (baselineAnalysisId === followUpAnalysisId) {
        throw new AppError(400, "Escolhe duas analises diferentes");
    }

    return { baselineAnalysisId, followUpAnalysisId };
}
