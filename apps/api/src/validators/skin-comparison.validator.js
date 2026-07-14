/**
 * Validadores da comparacao temporal de pele.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida as chaves das opções datadas escolhidas na UI.
 *
 * @function validateSkinComparisonPayload
 * @param {Record<string, unknown>} body - Corpo recebido no pedido HTTP.
 * @returns {{baselineSelection: string, followUpSelection: string}} Chaves normalizadas.
 * @throws {AppError} Quando alguma opção é inválida ou repetida.
 */
export function validateSkinComparisonPayload(body) {
    const baselineSelection = String(body?.baselineSelection ?? "").trim();
    const followUpSelection = String(body?.followUpSelection ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(baselineSelection)) {
        throw new AppError(400, "Momento inicial inválido");
    }

    if (!mongoose.Types.ObjectId.isValid(followUpSelection)) {
        throw new AppError(400, "Momento final inválido");
    }

    if (baselineSelection === followUpSelection) {
        throw new AppError(400, "Escolhe duas analises diferentes");
    }

    return { baselineSelection, followUpSelection };
}

/**
 * Valida o identificador interno presente no URL de leitura de imagem.
 *
 * O utilizador nunca introduz este valor na UI; o endpoint continua a
 * validá-lo porque qualquer URL pode ser alterado manualmente.
 *
 * @function validateSkinAnalysisImageParams
 * @param {Record<string, unknown>} params - Parâmetros da rota.
 * @returns {{analysisId: string, kind: "frontal"|"perfil"}} Identificador e vista normalizados.
 * @throws {AppError} Quando o identificador não é um ObjectId válido.
 */
export function validateSkinAnalysisImageParams(params) {
    const analysisId = String(params?.analysisId ?? "").trim();
    const kind = String(params?.kind ?? "frontal").trim();

    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        throw new AppError(400, "Análise inválida");
    }

    if (!new Set(["frontal", "perfil"]).has(kind)) {
        throw new AppError(400, "Vista da fotografia inválida");
    }

    return { analysisId, kind };
}
