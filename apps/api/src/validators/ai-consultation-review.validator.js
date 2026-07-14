/**
 * Validadores das rotas de revisão humana de sessões IA.
 */
import mongoose from "mongoose";
import { REPORT_ROUTINE_SLOT_CODES } from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    assertSafeCosmeticPublicCopy,
    assertSafeCosmeticPublicStrings,
} from "../utils/cosmetic-public-copy.util.js";

const ROUTINE_SLOT_SET = new Set(REPORT_ROUTINE_SLOT_CODES);
const ROUTINE_PRIORITIES = new Set(["essential", "recommended", "optional"]);

const REVIEW_DECISIONS = new Set([
    "approved",
    "adjusted",
    "needs_clarification",
]);
const DECISION_FIELDS = new Set([
    "decision",
    "publicNote",
    "internalNote",
    "adjustedRecommendationIds",
    "adjustedContent",
]);
const ADJUSTED_CONTENT_FIELDS = new Set([
    "assessment",
    "routine",
    "recommendations",
]);
const ROUTINE_FIELDS = new Set([
    "routineSlotCode",
    "period",
    "priority",
    "title",
    "reason",
    "instructions",
    "cautions",
]);
const RECOMMENDATION_GUIDANCE_FIELDS = new Set([
    "recommendationId",
    "explanation",
    "usage",
    "cautions",
]);

/** Recusa propriedades não documentadas nos contratos de escrita. */
function assertAllowedKeys(value, allowedKeys, message) {
    if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
        throw new AppError(400, message);
    }
}

/**
 * Normaliza texto opcional ou obrigatório.
 *
 * @function normalizeTextField
 * @param {unknown} value - Valor recebido do body.
 * @param {{fieldName: string, min: number, max: number, required: boolean}} options - Regras do campo.
 * @returns {string|null} Texto normalizado ou null.
 * @throws {AppError} Quando o texto viola tamanho ou obrigatoriedade.
 */
function normalizeTextField(value, options) {
    const text = value === undefined || value === null ? "" : String(value).trim();

    if (!text && !options.required) return null;

    if (!text || text.length < options.min || text.length > options.max) {
        throw new AppError(400, `${options.fieldName} inválida`);
    }

    return text;
}

/**
 * Normaliza lista de recomendações ajustadas.
 *
 * @function normalizeRecommendationIds
 * @param {unknown} value - Valor recebido do body.
 * @returns {string[]} Lista segura de ObjectIds.
 * @throws {AppError} Quando o campo não é lista ou contém ID inválido.
 */
function normalizeRecommendationIds(value) {
    if (value === undefined || value === null) return [];

    if (!Array.isArray(value)) {
        throw new AppError(400, "Lista de recomendações ajustadas inválida");
    }

    const normalizedIds = value.map((item) => {
        const id = String(item ?? "").trim();

        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(400, "ID de recomendação ajustada inválido");
        }

        return id;
    });

    if (new Set(normalizedIds).size !== normalizedIds.length) {
        throw new AppError(400, "Lista de recomendações ajustadas contém duplicados");
    }

    return normalizedIds;
}

/** Normaliza cautelas públicas com limites comuns à rotina e ao produto. */
function normalizeCautions(value, fieldName) {
    if (!Array.isArray(value) || value.length > 5) {
        throw new AppError(400, `${fieldName} inválidas`);
    }

    return value.map((caution) =>
        normalizeTextField(caution, {
            fieldName: fieldName.slice(0, -1),
            min: 1,
            max: 300,
            required: true,
        }),
    );
}

/** Normaliza a orientação editável de cada produto mantido. */
function normalizeAdjustedRecommendations(value) {
    if (value === undefined) return null;
    if (!Array.isArray(value) || value.length > 30) {
        throw new AppError(400, "Orientação ajustada dos produtos inválida");
    }

    const recommendations = value.map((recommendation) => {
        if (
            recommendation === null ||
            typeof recommendation !== "object" ||
            Array.isArray(recommendation)
        ) {
            throw new AppError(400, "Orientação ajustada do produto inválida");
        }
        assertAllowedKeys(
            recommendation,
            RECOMMENDATION_GUIDANCE_FIELDS,
            "Orientação ajustada do produto contém propriedades inesperadas",
        );
        const recommendationId = String(
            recommendation.recommendationId ?? "",
        ).trim();
        if (!mongoose.isValidObjectId(recommendationId)) {
            throw new AppError(400, "ID da orientação ajustada inválido");
        }

        return {
            recommendationId,
            explanation: normalizeTextField(recommendation.explanation, {
                fieldName: "Explicação ajustada",
                min: 8,
                max: 500,
                required: true,
            }),
            usage: normalizeTextField(recommendation.usage, {
                fieldName: "Utilização ajustada",
                min: 4,
                max: 600,
                required: true,
            }),
            cautions: normalizeCautions(
                recommendation.cautions,
                "Cautelas ajustadas",
            ),
        };
    });
    const ids = recommendations.map(({ recommendationId }) => recommendationId);
    if (new Set(ids).size !== ids.length) {
        throw new AppError(400, "Orientação ajustada contém produtos duplicados");
    }
    return recommendations;
}

function normalizeAdjustedContent(value) {
    if (value === undefined || value === null) {
        return { assessment: null, routine: null, recommendations: null };
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        throw new AppError(400, "Conteúdo ajustado inválido");
    }
    assertAllowedKeys(
        value,
        ADJUSTED_CONTENT_FIELDS,
        "Conteúdo ajustado contém propriedades inesperadas",
    );
    const assessment = normalizeTextField(value.assessment, {
        fieldName: "Avaliação ajustada",
        min: 20,
        max: 2400,
        required: false,
    });
    let routine = null;
    if (value.routine !== undefined) {
        if (!Array.isArray(value.routine) || value.routine.length < 1 || value.routine.length > 30) {
            throw new AppError(400, "Rotina ajustada inválida");
        }
        routine = value.routine.map((step) => {
            if (
                step === null ||
                typeof step !== "object" ||
                Array.isArray(step)
            ) {
                throw new AppError(400, "Passo da rotina ajustada inválido");
            }
            assertAllowedKeys(
                step,
                ROUTINE_FIELDS,
                "Passo da rotina ajustada contém propriedades inesperadas",
            );
            const period = String(step?.period ?? "");
            if (!new Set(["manha", "noite", "ocasional"]).has(period)) {
                throw new AppError(400, "Período da rotina ajustada inválido");
            }
            const routineSlotCode =
                step?.routineSlotCode === undefined ||
                step?.routineSlotCode === null
                    ? null
                    : String(step.routineSlotCode);
            if (
                routineSlotCode !== null &&
                !ROUTINE_SLOT_SET.has(routineSlotCode)
            ) {
                throw new AppError(400, "Slot da rotina ajustada inválido");
            }
            const priority =
                step?.priority === undefined || step?.priority === null
                    ? null
                    : String(step.priority);
            if (priority !== null && !ROUTINE_PRIORITIES.has(priority)) {
                throw new AppError(400, "Prioridade da rotina ajustada inválida");
            }
            const cautions = normalizeCautions(
                step.cautions,
                "Cautelas da rotina ajustada",
            );
            return {
                ...(routineSlotCode ? { routineSlotCode } : {}),
                period,
                ...(priority ? { priority } : {}),
                title: normalizeTextField(step?.title, {
                    fieldName: "Título da rotina",
                    min: 2,
                    max: 120,
                    required: true,
                }),
                reason: normalizeTextField(step?.reason, {
                    fieldName: "Motivo da rotina",
                    min: 8,
                    max: 500,
                    required: true,
                }),
                instructions: normalizeTextField(step?.instructions, {
                    fieldName: "Instruções da rotina",
                    min: 4,
                    max: 600,
                    required: true,
                }),
                cautions,
            };
        });
    }
    const recommendations = normalizeAdjustedRecommendations(
        value.recommendations,
    );
    return { assessment, routine, recommendations };
}

/**
 * Valida o identificador da revisão recebido nos params.
 *
 * @function validateReviewId
 * @param {object} params - Parâmetros da rota.
 * @returns {string} ID da revisão.
 * @throws {AppError} Quando o ID não é ObjectId.
 */
export function validateReviewId(params) {
    const reviewId = String(params?.reviewId ?? "").trim();

    if (!mongoose.isValidObjectId(reviewId)) {
        throw new AppError(400, "ID de revisão inválido");
    }

    return reviewId;
}

/**
 * Valida o pedido de decisão de revisão humana.
 *
 * @function validateReviewDecisionInput
 * @param {object} params - Parâmetros da rota.
 * @param {object} body - Body enviado pelo consultor.
 * @returns {{reviewId: string, decision: string, publicNote: string|null, internalNote: string|null, adjustedRecommendationIds: string[]}} Dados normalizados.
 * @throws {AppError} Quando a decisão não cumpre o contrato.
 */
export function validateReviewDecisionInput(params, body) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError(400, "Pedido de revisão inválido");
    }
    assertAllowedKeys(
        body,
        DECISION_FIELDS,
        "Pedido de revisão contém propriedades inesperadas",
    );

    const reviewId = validateReviewId(params);
    const decision = String(body?.decision ?? "").trim();

    if (!REVIEW_DECISIONS.has(decision)) {
        throw new AppError(400, "Decisão de revisão inválida");
    }

    const publicNote = normalizeTextField(body.publicNote, {
        fieldName: "Nota pública",
        min: 8,
        max: 800,
        required:
            decision === "approved" ||
            decision === "adjusted" ||
            decision === "needs_clarification",
    });
    const internalNote = normalizeTextField(body.internalNote, {
        fieldName: "Nota interna",
        min: 8,
        max: 1000,
        required: false,
    });
    const adjustedRecommendationIds = normalizeRecommendationIds(
        body.adjustedRecommendationIds,
    );
    const adjustedContent = normalizeAdjustedContent(body.adjustedContent);

    try {
        assertSafeCosmeticPublicStrings([publicNote]);
    } catch (error) {
        throw new AppError(400, error.message, {
            code: "UNSAFE_PUBLIC_NOTE",
        });
    }

    if (
        decision !== "adjusted" &&
        (Object.hasOwn(body, "adjustedRecommendationIds") ||
            Object.hasOwn(body, "adjustedContent"))
    ) {
        throw new AppError(
            400,
            "Campos de ajuste só são permitidos numa decisão ajustada",
        );
    }
    if (decision === "adjusted") {
        try {
            assertSafeCosmeticPublicCopy(adjustedContent);
        } catch (error) {
            throw new AppError(400, error.message, {
                code: "UNSAFE_ADJUSTED_COPY",
            });
        }
    }

    return {
        reviewId,
        decision,
        publicNote,
        internalNote,
        adjustedRecommendationIds,
        adjustedContent,
    };
}
