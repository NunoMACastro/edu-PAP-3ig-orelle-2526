/**
 * Modelo de apresentação da consulta cosmética server-driven.
 *
 * As funções deste módulo não inventam estados de negócio. Limitam-se a
 * normalizar pequenas variações de envelopes/DTOs durante a migração do
 * backend e a fornecer decisões de navegação puras e testáveis.
 */

export const CONSULTATION_GOAL_CODES = Object.freeze([
    "acne_imperfections",
    "hydration_barrier",
    "oil_control",
    "sensitivity_redness",
    "spots_tone_luminosity",
    "sun_protection",
    "makeup",
]);

export const CONSULTATION_GOAL_FALLBACKS = Object.freeze({
    acne_imperfections: Object.freeze({
        code: "acne_imperfections",
        label: "Acne e imperfeições",
        description: "Apoio cosmético para borbulhas, pontos negros e marcas recentes.",
    }),
    hydration_barrier: Object.freeze({
        code: "hydration_barrier",
        label: "Hidratação e barreira",
        description: "Apoio cosmético para secura, repuxamento e conforto da barreira.",
    }),
    oil_control: Object.freeze({
        code: "oil_control",
        label: "Controlo de oleosidade",
        description: "Apoio cosmético para brilho, poros visíveis e equilíbrio da rotina.",
    }),
    sensitivity_redness: Object.freeze({
        code: "sensitivity_redness",
        label: "Sensibilidade e vermelhidão",
        description: "Apoio cosmético conservador para desconforto e reatividade visível.",
    }),
    spots_tone_luminosity: Object.freeze({
        code: "spots_tone_luminosity",
        label: "Manchas, tom e luminosidade",
        description: "Apoio cosmético para uniformidade aparente e luminosidade.",
    }),
    sun_protection: Object.freeze({
        code: "sun_protection",
        label: "Proteção solar",
        description: "Seleção cosmética de proteção solar para o uso quotidiano.",
    }),
    makeup: Object.freeze({
        code: "makeup",
        label: "Maquilhagem",
        description: "Seleção de produtos e variantes para o resultado pretendido.",
    }),
});

export const QUESTION_TYPES = Object.freeze([
    "single_select",
    "multi_select",
    "scale",
    "number",
    "short_text",
]);

export const POLLED_SESSION_PHASES = Object.freeze(
    new Set(["analyzing", "generating_report"]),
);

export const PENDING_OPERATION_STATES = Object.freeze(
    new Set(["queued", "pending", "processing", "running", "retry_scheduled"]),
);

const REPORT_PHASES = new Set([
    "draft_ready",
    "review_pending",
    "frozen_locked",
    "unlocked",
    "completed",
]);

const REPORT_UNLOCKED_STATES = new Set(["unlocked", "completed"]);

const REPORT_REVIEW_PENDING_STATES = new Set(["review_pending"]);

/** Confirma que um valor pode ser tratado como objeto de dados. */
export function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Remove envelopes HTTP comuns sem depender de uma única convenção da API.
 * O limite protege contra envelopes recursivos inválidos.
 *
 * @param {unknown} payload - Resposta já desserializada pelo apiClient.
 * @returns {unknown} Valor interno mais provável.
 */
export function unwrapApiEnvelope(payload) {
    let current = payload;

    for (let depth = 0; depth < 4 && isRecord(current); depth += 1) {
        if (Object.hasOwn(current, "data") && current.data !== undefined) {
            current = current.data;
            continue;
        }
        if (Object.hasOwn(current, "result") && current.result !== undefined) {
            current = current.result;
            continue;
        }
        break;
    }

    return current;
}

/**
 * Seleciona uma propriedade conhecida num payload tolerante a envelopes.
 *
 * @param {unknown} payload - Resposta da API.
 * @param {string[]} keys - Chaves por ordem de preferência.
 * @returns {unknown} Propriedade encontrada ou o próprio payload interno.
 */
export function pickEnvelopeValue(payload, keys) {
    const value = unwrapApiEnvelope(payload);
    if (!isRecord(value)) return value;

    for (const key of keys) {
        if (Object.hasOwn(value, key) && value[key] !== undefined) {
            return unwrapApiEnvelope(value[key]);
        }
    }

    return value;
}

/** Devolve a referência pública estável de um DTO. */
export function getPublicId(value) {
    if (typeof value === "string") return value;
    if (!isRecord(value)) return "";
    return String(value.id ?? value.reportId ?? value.sessionId ?? value._id ?? "");
}

/**
 * Normaliza o catálogo server-driven e completa apenas labels de códigos
 * canónicos quando uma resposta transitória omite apresentação.
 */
export function normalizeGoalsPayload(payload) {
    const root = unwrapApiEnvelope(payload);
    const rawGoals = Array.isArray(root)
        ? root
        : pickEnvelopeValue(root, ["goals", "goalDefinitions", "items"]);
    const byCode = new Map(
        (Array.isArray(rawGoals) ? rawGoals : [])
            .filter((goal) => isRecord(goal))
            .map((goal) => [String(goal.code ?? goal.id ?? ""), goal]),
    );

    const goals = CONSULTATION_GOAL_CODES.map((code) => {
        const serverGoal = byCode.get(code) ?? {};
        const fallback = CONSULTATION_GOAL_FALLBACKS[code];

        return {
            ...serverGoal,
            code,
            label: String(serverGoal.label ?? fallback.label),
            description: String(serverGoal.description ?? fallback.description),
            requiresPhotos: serverGoal.requiresPhotos !== false,
            supportsMakeupPreview:
                serverGoal.supportsMakeupPreview === true || code === "makeup",
        };
    });

    return {
        version: String(isRecord(root) ? root.version ?? "" : ""),
        selection: {
            primary: 1,
            secondaryMax: Number(
                (isRecord(root) && root.selection?.secondaryMax) ?? 2,
            ),
        },
        questions: {
            min: Number((isRecord(root) && root.questions?.min) ?? 10),
            max: Number((isRecord(root) && root.questions?.max) ?? 17),
        },
        goals,
    };
}

/**
 * Converte opções string/objeto num contrato estável para controlos nativos.
 */
export function normalizeQuestionOption(option, index = 0) {
    if (isRecord(option)) {
        const value = String(option.value ?? option.code ?? option.id ?? "");
        return {
            value,
            label: String(option.label ?? option.name ?? `Opção ${index + 1}`),
        };
    }

    const value = String(option ?? "");
    return { value, label: `Opção ${index + 1}` };
}

/**
 * Normaliza a pergunta atual sem converter tipos legacy desconhecidos em tipos
 * válidos; o componente pode assim mostrar uma falha controlada.
 */
export function normalizeQuestion(question) {
    if (!isRecord(question)) return null;

    const typeAliases = {
        single_choice: "single_select",
        multi_choice: "multi_select",
        text: "short_text",
    };
    const rawType = String(question.type ?? question.answerType ?? "");
    const type = typeAliases[rawType] ?? rawType;
    const id = String(question.id ?? question.questionId ?? question.code ?? "");

    if (!id) return null;

    return {
        ...question,
        id,
        label: String(question.label ?? question.prompt ?? question.text ?? "Pergunta"),
        type,
        required: question.required !== false,
        options: Array.isArray(question.options)
            ? question.options.map(normalizeQuestionOption).filter((option) => option.value)
            : [],
        min: Number.isFinite(Number(question.min)) ? Number(question.min) : 0,
        max: Number.isFinite(Number(question.max)) ? Number(question.max) : 100,
        maxLength: Number.isFinite(Number(question.maxLength))
            ? Number(question.maxLength)
            : 600,
        presentation: isRecord(question.presentation)
            ? question.presentation
            : {},
    };
}

/**
 * Extrai o estado de fluxo mais específico disponível.
 */
export function getSessionPhase(session) {
    if (!isRecord(session)) return "not_started";
    return String(
        session.flowState ??
            session.flow_state ??
            session.phase ??
            session.lifecycleStatus ??
            session.state ??
            session.status ??
            "active",
    );
}

/** Extrai a pergunta atual de versões compatíveis do DTO. */
export function getCurrentQuestion(session) {
    if (!isRecord(session)) return null;
    return normalizeQuestion(
        session.currentQuestion ??
            session.question ??
            session.nextQuestion ??
            session.conversation?.currentQuestion ??
            null,
    );
}

/**
 * Decide polling apenas quando o backend declarou trabalho assíncrono ou ainda
 * está a materializar a pergunta seguinte.
 */
export function shouldPollConsultation(session) {
    const phase = getSessionPhase(session);
    const operationStatus = String(session?.operation?.status ?? "");

    return (
        POLLED_SESSION_PHASES.has(phase) ||
        PENDING_OPERATION_STATES.has(operationStatus)
    );
}

/** Backoff limitado: 2 s, 4 s, 8 s e depois 10 s. */
export function getConsultationPollDelay(attempt) {
    const normalizedAttempt = Number.isInteger(attempt) && attempt >= 0 ? attempt : 0;
    return Math.min(2_000 * 2 ** normalizedAttempt, 10_000);
}

/** Extrai a referência de relatório sem expor outras referências técnicas. */
export function getSessionReportId(session) {
    if (!isRecord(session)) return "";
    return getPublicId(session.report ?? session.reportId ?? session.faceReport ?? "");
}

/**
 * Normaliza apenas os campos que a UI consome, preservando extensibilidade do
 * DTO para atualizações em memória depois de mutações.
 */
export function normalizeSession(payload) {
    const raw = pickEnvelopeValue(payload, ["session", "consultation"]);
    if (!isRecord(raw)) return null;

    const id = getPublicId(raw);
    const conversation = isRecord(raw.conversation) ? raw.conversation : {};
    return {
        ...raw,
        id,
        flowState: getSessionPhase(raw),
        reportId: getSessionReportId(raw),
        currentQuestion: getCurrentQuestion(raw),
        revision: Number.isInteger(Number(raw.revision)) ? Number(raw.revision) : 0,
        conversation: {
            ...conversation,
            answeredCount: Number(conversation.answeredCount ?? 0),
            totalQuestions: Number(
                conversation.totalQuestions ?? conversation.maxQuestions ?? 17,
            ),
            currentIndex: Number(
                conversation.currentIndex ??
                    (conversation.answeredCount ?? 0) +
                        (getCurrentQuestion(raw) ? 1 : 0),
            ),
            answers: Array.isArray(conversation.answers)
                ? conversation.answers.map((answer) => ({
                      ...answer,
                      options: Array.isArray(answer.options)
                          ? answer.options.map(normalizeQuestionOption)
                          : [],
                      presentation: isRecord(answer.presentation)
                          ? answer.presentation
                          : {},
                  }))
                : [],
        },
    };
}

/** Converte o valor canónico numa representação adequada ao formulário. */
export function toQuestionDisplayValue(question, value) {
    if (question?.presentation?.control === "currency") {
        const scale = Number(question.presentation.scale ?? 100);
        return Number(value) / scale;
    }
    return value;
}

/** Converte apenas formatos de apresentação antes de enviar para a API. */
export function toCanonicalQuestionValue(question, value) {
    if (question?.presentation?.control === "currency") {
        const scale = Number(question.presentation.scale ?? 100);
        const amount = Number(value);
        return Number.isFinite(amount) ? Math.round(amount * scale) : value;
    }
    return question?.type === "number" ? Number(value) : value;
}

/** Resolve o destino canónico a partir do estado confirmado pela API. */
export function getSessionDestination(session) {
    const normalized = normalizeSession(session);
    if (!normalized) return "/consulta/nova";

    if (
        normalized.flowState === "collecting_goal" ||
        normalized.flowState === "collecting_photos"
    ) {
        return "/consulta/nova";
    }

    if (normalized.reportId && REPORT_PHASES.has(normalized.flowState)) {
        return `/consulta/relatorios/${encodeURIComponent(normalized.reportId)}`;
    }

    return "/consulta/ativa";
}

/** Devolve o lifecycle público do relatório. */
export function getReportPhase(report) {
    if (!isRecord(report)) return "unavailable";
    return String(
        report.lifecycleStatus ??
            report.flowState ??
            report.access?.status ??
            report.status ??
            "draft_ready",
    );
}

/** Confirma desbloqueio sem assumir que conteúdo ausente está apenas oculto. */
export function isReportUnlocked(report) {
    if (!isRecord(report)) return false;
    return (
        report.unlocked === true ||
        report.access?.unlocked === true ||
        REPORT_UNLOCKED_STATES.has(getReportPhase(report))
    );
}

/** Confirma se existe uma revisão ainda cancelável. */
export function isReviewPending(report) {
    return REPORT_REVIEW_PENDING_STATES.has(getReportPhase(report));
}

/** Formata um valor monetário inteiro sem aceitar floats silenciosamente. */
export function formatCents(value, locale = "pt-PT") {
    if (value === null || value === undefined || value === "") return "—";
    const cents = Number(value);
    if (!Number.isInteger(cents) || cents < 0) return "—";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
}

/**
 * Validação imediata do valor da pergunta. A API continua a validar o contrato
 * completo e é sempre a autoridade final.
 */
export function isQuestionAnswerPresent(question, value) {
    if (
        !question?.required &&
        (value === "" ||
            value === undefined ||
            value === null ||
            (Array.isArray(value) && value.length === 0))
    ) {
        return true;
    }

    switch (question?.type) {
        case "single_select":
            return typeof value === "string" && value.length > 0;
        case "multi_select":
            return Array.isArray(value) && value.length > 0;
        case "scale":
        case "number": {
            if (value === "" || value === null || value === undefined) return false;
            const number = Number(value);
            const min = Number(
                question.presentation?.displayMin ?? question.min,
            );
            const max = Number(
                question.presentation?.displayMax ?? question.max,
            );
            return (
                Number.isFinite(number) &&
                (question.presentation?.control === "currency" ||
                    Number.isInteger(number)) &&
                number >= min &&
                number <= max
            );
        }
        case "short_text":
            return typeof value === "string" && value.trim().length > 0;
        default:
            return false;
    }
}
