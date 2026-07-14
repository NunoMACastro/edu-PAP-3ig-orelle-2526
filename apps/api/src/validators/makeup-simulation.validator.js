/**
 * Validador de simulação de maquilhagem.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { GENERATIVE_MAKEUP_NOTICE_VERSION } from "../constants/purpose-grants.js";

/**
 * Valida o body usado para criar uma simulação de maquilhagem.
 *
 * @function validateMakeupSimulationInput
 * @param {object} body - Body recebido do pedido HTTP.
 * @returns {{productId: string}} Dados normalizados para o service.
 * @throws {AppError} Quando o ID do produto não é um ObjectId válido.
 */
export function validateMakeupSimulationInput(body) {
    const reportId = String(body?.reportId ?? "").trim();
    if (!mongoose.isValidObjectId(reportId)) {
        throw new AppError(400, "ID de relatório inválido");
    }
    if (
        body?.generativeEditAccepted !== true ||
        String(body?.generativeEditNoticeVersion ?? "").trim() !==
            GENERATIVE_MAKEUP_NOTICE_VERSION
    ) {
        throw new AppError(400, "Consentimento generativo pontual obrigatório");
    }
    return {
        reportId,
        generativeEditAccepted: true,
        generativeEditNoticeVersion: GENERATIVE_MAKEUP_NOTICE_VERSION,
    };
}

/** Valida um ID de simulação nos params. */
export function validateMakeupSimulationId(params) {
    const simulationId = String(params?.simulationId ?? "").trim();
    if (!mongoose.isValidObjectId(simulationId)) {
        throw new AppError(400, "ID de simulação inválido");
    }
    return simulationId;
}
