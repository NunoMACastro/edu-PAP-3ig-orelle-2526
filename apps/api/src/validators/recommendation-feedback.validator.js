/**
 * Validadores de feedback de recomendacao da MF2.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const FEEDBACK_VALUES = new Set(["util", "nao_relevante"]);

/**
 * Valida ID e valor de feedback recebido do cliente.
 *
 * @function validateRecommendationFeedbackInput
 * @param {object} params - Parametros da rota.
 * @param {object} body - Corpo do pedido.
 * @returns {{recommendationId: string, feedback: "util"|"nao_relevante"}} Dados normalizados.
 */
export function validateRecommendationFeedbackInput(params, body) {
    const recommendationId = String(params?.recommendationId ?? "");
    const feedback = String(body?.value ?? body?.feedback ?? "");

    if (!mongoose.isValidObjectId(recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    if (!FEEDBACK_VALUES.has(feedback)) {
        throw new AppError(400, "Feedback inválido");
    }

    return { recommendationId, feedback };
}
