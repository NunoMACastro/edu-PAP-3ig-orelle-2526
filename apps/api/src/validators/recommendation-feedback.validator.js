import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const FEEDBACK_VALUES = new Set(["util", "nao_relevante"]);

export function validateRecommendationFeedbackParams(params) {
    if (!mongoose.isValidObjectId(params.recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    return {
        recommendationId: params.recommendationId,
    };
}

export function validateRecommendationFeedbackInput(body) {
    const value = String(body?.value ?? "");

    if (!FEEDBACK_VALUES.has(value)) {
        throw new AppError(400, "Feedback deve ser util ou nao_relevante");
    }

    return { value };
}