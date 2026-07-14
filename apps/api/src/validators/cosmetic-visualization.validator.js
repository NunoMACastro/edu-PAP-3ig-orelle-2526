/** Validação HTTP fechada da pré-visualização cosmética e do feedback visual. */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { COSMETIC_VISUAL_INTENSITIES } from "../constants/cosmetic-visualization.js";
import { GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION } from "../constants/purpose-grants.js";

const FEEDBACK_VALUES = new Set(["fiel", "pouco_fiel"]);
const FEEDBACK_REASONS = new Set([
    "identity_or_geometry_changed",
    "wrong_area",
    "effect_too_weak",
    "effect_too_strong",
    "wrong_color_or_finish",
    "lost_skin_texture",
    "other",
]);

function validObjectId(value, message) {
    const normalized = String(value ?? "").trim();
    if (!mongoose.isValidObjectId(normalized)) throw new AppError(400, message);
    return normalized;
}

/** Valida criação, incluindo confirmação exata das variantes necessárias. */
export function validateCosmeticVisualizationInput(params, body) {
    const reportId = validObjectId(params?.reportId, "ID de relatório inválido");
    if (
        body?.generativeEditAccepted !== true ||
        String(body?.generativeEditNoticeVersion ?? "") !==
            GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION
    ) {
        throw new AppError(400, "Consentimento generativo pontual obrigatório");
    }
    const intensity = String(body?.intensity ?? "");
    if (!COSMETIC_VISUAL_INTENSITIES.includes(intensity)) {
        throw new AppError(400, "Intensidade visual inválida");
    }
    if (!Array.isArray(body?.variantSelections)) {
        throw new AppError(400, "Seleções de variante inválidas");
    }
    const variantSelections = body.variantSelections.map((item) => ({
        recommendationId: validObjectId(
            item?.recommendationId,
            "ID de recomendação inválido",
        ),
        variantId: String(item?.variantId ?? "").trim().toLowerCase(),
    }));
    if (
        variantSelections.some(
            ({ variantId }) =>
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(variantId),
        ) ||
        new Set(variantSelections.map(({ recommendationId }) => recommendationId))
            .size !== variantSelections.length
    ) {
        throw new AppError(400, "Seleções de variante repetidas ou inválidas");
    }
    return {
        reportId,
        generativeEditAccepted: true,
        generativeEditNoticeVersion:
            GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
        intensity,
        variantSelections,
    };
}

/** Valida o identificador genérico usado em estado, imagem e revogação. */
export function validateCosmeticVisualizationId(params) {
    return validObjectId(
        params?.visualizationId,
        "ID de pré-visualização inválido",
    );
}

/** Valida feedback sem texto livre e com no máximo três razões fechadas. */
export function validateCosmeticVisualizationFeedback(params, body) {
    const visualizationId = validateCosmeticVisualizationId(params);
    const value = String(body?.value ?? "");
    const reasons = Array.isArray(body?.reasons)
        ? [...new Set(body.reasons.map(String))]
        : [];
    if (
        !FEEDBACK_VALUES.has(value) ||
        reasons.length > 3 ||
        reasons.some((reason) => !FEEDBACK_REASONS.has(reason)) ||
        (value === "fiel" && reasons.length !== 0) ||
        (value === "pouco_fiel" && reasons.length === 0)
    ) {
        throw new AppError(400, "Feedback visual inválido");
    }
    return { visualizationId, value, reasons };
}
