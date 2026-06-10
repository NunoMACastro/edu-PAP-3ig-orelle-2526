import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUSES = new Set(["approved", "adjusted", "rejected"]);

export function validateRecommendationReviewParams(params) {
    if (!mongoose.isValidObjectId(params.recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    return { recommendationId: params.recommendationId };
}

export function validateRecommendationReviewInput(body) {
    const status = String(body?.status ?? "");
    const note = String(body?.note ?? "").trim();
    const adjustedExplanation = body?.adjustedExplanation
        ? String(body.adjustedExplanation).trim()
        : null;

    if (!REVIEW_STATUSES.has(status)) {
        throw new AppError(400, "Estado de revisão inválido");
    }

    if (note.length < 5 || note.length > 500) {
        throw new AppError(400, "Nota deve ter entre 5 e 500 caracteres");
    }

    if (status === "adjusted" && (!adjustedExplanation || adjustedExplanation.length < 20)) {
        throw new AppError(400, "Ajuste exige explicação com pelo menos 20 caracteres");
    }

    return { status, note, adjustedExplanation };
}