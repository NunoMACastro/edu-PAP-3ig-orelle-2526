// apps/api/src/validators/admin-review.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUSES = ["published", "hidden"];

/**
 * Valida params e body de moderação de review.
 *
 * @function validateReviewModerationInput
 * @param {Record<string, string>} params - Params da route.
 * @param {Record<string, unknown>} body - Body recebido.
 * @returns {{reviewId: string, status: "published"|"hidden", moderationReason: string}} Dados normalizados.
 * @throws {AppError} Quando o ID, status ou motivo são inválidos.
 */
export function validateReviewModerationInput(params, body) {
    const reviewId = String(params.reviewId ?? "");
    const status = String(body.status ?? "").trim();
    const moderationReason = String(body.moderationReason ?? "").trim();

    if (!mongoose.isValidObjectId(reviewId)) {
        throw new AppError(400, "ID de review invalido");
    }

    if (!REVIEW_STATUSES.includes(status)) {
        throw new AppError(400, "Estado de moderação invalido");
    }

    if (status === "hidden" && moderationReason.length < 3) {
        throw new AppError(400, "Motivo obrigatório para ocultar review");
    }

    if (moderationReason.length > 240) {
        throw new AppError(400, "Motivo demasiado longo");
    }

    return { reviewId, status, moderationReason };
}