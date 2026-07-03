/**
 * Validadores de revisão manual de recomendações.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUSES = new Set(["approved", "adjusted", "rejected"]);

/**
 * Valida params e body da revisão manual de uma recomendação.
 *
 * @function validateRecommendationReviewInput
 * @param {object} params - Parâmetros da rota com o ID da recomendação.
 * @param {object} body - Body com estado, nota e possível explicação ajustada.
 * @returns {{recommendationId: string, status: string, note: string, adjustedExplanation: string|null}} Dados normalizados.
 * @throws {AppError} Quando algum campo não cumpre o contrato da revisão.
 */
export function validateRecommendationReviewInput(params, body) {
    const recommendationId = String(params?.recommendationId ?? "");
    const status = String(body?.status ?? "");
    const note = String(body?.note ?? "").trim();
    const adjustedExplanation = body?.adjustedExplanation
        ? String(body.adjustedExplanation).trim()
        : null;

    if (!mongoose.isValidObjectId(recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    if (!REVIEW_STATUSES.has(status)) {
        throw new AppError(400, "Estado de revisão inválido");
    }

    if (note.length < 3 || note.length > 600) {
        throw new AppError(400, "Nota de revisão inválida");
    }

    if (status === "adjusted" && !adjustedExplanation) {
        throw new AppError(400, "Explicação ajustada obrigatória");
    }

    return { recommendationId, status, note, adjustedExplanation };
}
