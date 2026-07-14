/** Validadores fechados da consulta cosmética conversacional v2. */
import { isValidObjectId } from "mongoose";
import {
    AI_CONSULTATION_GOALS,
    getAiConsultationGoal,
} from "../constants/ai-consultation-goals.js";
import { AppError } from "../middlewares/error.middleware.js";

const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous/i,
    /system\s+prompt/i,
    /developer\s+message/i,
    /jailbreak/i,
    /revela(r)?\s+(as\s+)?instru/i,
];

/** Compatibilidade de leitura: devolve apenas o catálogo público de objetivos. */
export function getGuidedConsultationScript() {
    return AI_CONSULTATION_GOALS.map(({ code, label, description }) => ({
        id: code,
        label,
        description,
        type: "goal",
    }));
}

/**
 * Valida o identificador de consulta recebido na rota.
 * @param {Record<string, unknown>} params - Parâmetros Express.
 * @returns {string} ObjectId normalizado.
 */
export function validateSessionIdParam(params) {
    const sessionId = String(params?.sessionId ?? "").trim();
    if (!isValidObjectId(sessionId)) {
        throw new AppError(400, "Identificador de consulta inválido");
    }
    return sessionId;
}

/** Um objetivo principal e até dois secundários, sem duplicados. */
export function validateGoalSelection(body) {
    const primaryGoal = String(body?.primaryGoal ?? "").trim();
    const secondaryGoals = Array.isArray(body?.secondaryGoals)
        ? body.secondaryGoals.map((value) => String(value ?? "").trim())
        : [];

    if (!getAiConsultationGoal(primaryGoal)) {
        throw new AppError(400, "Objetivo principal inválido");
    }
    if (
        secondaryGoals.length > 2 ||
        secondaryGoals.some((code) => !getAiConsultationGoal(code)) ||
        new Set([primaryGoal, ...secondaryGoals]).size !== secondaryGoals.length + 1
    ) {
        throw new AppError(400, "Objetivos secundários inválidos");
    }
    return { primaryGoal, secondaryGoals };
}

/** Estrutura mínima da resposta; conteúdo é validado contra a pergunta guardada. */
export function validateAnswerInput(body) {
    const questionId = String(body?.questionId ?? "").trim();
    const revision = Number(body?.revision);
    if (!questionId || questionId.length > 160 || !Number.isInteger(revision) || revision < 0) {
        throw new AppError(400, "Referência da pergunta inválida");
    }
    return { questionId, revision, value: body?.value };
}

/** Valida a revisão usada numa edição e deixa o valor para o slot canónico. */
export function validateAnswerEditInput(body) {
    const revision = Number(body?.revision);
    if (!Number.isInteger(revision) || revision < 0) {
        throw new AppError(400, "Referência da resposta inválida");
    }
    return { revision, value: body?.value };
}

/** Limita o identificador de slot antes de consultar o plano encriptado. */
export function validateSlotCodeParam(params) {
    const slotCode = String(params?.slotCode ?? "").trim();
    if (!/^[a-z][a-z0-9_]{1,79}$/.test(slotCode)) {
        throw new AppError(400, "Resposta a editar inválida");
    }
    return slotCode;
}

/** Confirma warnings técnicos sem permitir ao cliente substituir métricas. */
export function validateAnalysisStartInput(body) {
    if (
        body?.acknowledgePhotoWarnings !== undefined &&
        typeof body.acknowledgePhotoWarnings !== "boolean"
    ) {
        throw new AppError(400, "Confirmação de qualidade fotográfica inválida");
    }
    return {
        acknowledgePhotoWarnings: body?.acknowledgePhotoWarnings === true,
    };
}

/**
 * Limita a paginação do histórico próprio sem aceitar cursores técnicos.
 * @param {Record<string, unknown>} query - Query string Express.
 * @returns {{limit: number}} Limite normalizado.
 */
export function validateConsultationHistoryQuery(query) {
    const value = query?.limit === undefined ? 20 : Number(query.limit);
    if (!Number.isInteger(value) || value < 1 || value > 50) {
        throw new AppError(400, "Limite de histórico inválido");
    }
    return { limit: value };
}

function assertSafeShortText(value, maxLength) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text || text.length > maxLength) {
        throw new AppError(400, "Resposta textual inválida");
    }
    if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text))) {
        throw new AppError(400, "A resposta contém instruções não permitidas");
    }
    return text;
}

/** Valida o valor exatamente contra o slot canónico escolhido pelo backend. */
export function normalizeAnswerForQuestion(question, value) {
    if (!question || typeof question !== "object") {
        throw new AppError(409, "Pergunta atual indisponível");
    }
    if (question.type === "short_text") {
        return assertSafeShortText(value, question.maxLength ?? 600);
    }
    if (question.type === "single_select") {
        const selected = String(value ?? "").trim();
        if (!question.options?.includes(selected)) {
            throw new AppError(400, "Opção de resposta inválida");
        }
        return selected;
    }
    if (question.type === "multi_select") {
        const selected = Array.isArray(value)
            ? [...new Set(value.map((item) => String(item ?? "").trim()))]
            : [];
        if (
            selected.length < 1 ||
            selected.length > question.options.length ||
            selected.some((item) => !question.options.includes(item))
        ) {
            throw new AppError(400, "Opções de resposta inválidas");
        }
        const exclusiveGroups = Array.isArray(
            question.presentation?.exclusiveGroups,
        )
            ? question.presentation.exclusiveGroups
            : [];
        if (
            exclusiveGroups.some(
                (group) =>
                    Array.isArray(group) &&
                    group.filter((item) => selected.includes(item)).length > 1,
            )
        ) {
            throw new AppError(
                400,
                "Escolhe apenas uma opção entre alternativas equivalentes",
            );
        }
        return selected;
    }
    if (["scale", "number"].includes(question.type)) {
        const number = Number(value);
        if (
            !Number.isInteger(number) ||
            number < question.min ||
            number > question.max
        ) {
            throw new AppError(400, "Resposta numérica inválida");
        }
        return number;
    }
    throw new AppError(409, "Tipo da pergunta atual não suportado");
}
