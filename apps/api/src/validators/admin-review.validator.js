/**
 * Validadores de moderacao administrativa de reviews.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUS_VALUES = Object.freeze(["published", "hidden"]);

/**
 * Valida o pedido de moderacao de uma review.
 *
 * @function validateReviewModerationInput
 * @param {Record<string, unknown>} params - Parametros da rota.
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{reviewId: string, status: string, moderationReason: string|null}} Dados normalizados.
 * @throws {AppError} Quando o ID, estado ou motivo sao invalidos.
 */
export function validateReviewModerationInput(params, body) {
    const reviewId = String(params?.reviewId ?? "");
    const status = String(body?.status ?? "").trim();
    const moderationReason = String(body?.moderationReason ?? "").trim();
    const errors = {};

    if (!mongoose.isValidObjectId(reviewId)) {
        errors.reviewId = "ID de review invalido";
    }

    if (!REVIEW_STATUS_VALUES.includes(status)) {
        errors.status = `Estado deve ser um destes: ${REVIEW_STATUS_VALUES.join(", ")}`;
    }

    if (status === "hidden" && moderationReason.length < 3) {
        errors.moderationReason = "Motivo deve ter pelo menos 3 caracteres";
    }

    if (moderationReason.length > 300) {
        errors.moderationReason = "Motivo deve ter no maximo 300 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de moderacao invalidos", errors);
    }

    return {
        reviewId,
        status,
        moderationReason: moderationReason || null,
    };
}
