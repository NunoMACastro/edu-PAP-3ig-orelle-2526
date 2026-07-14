/** Controllers HTTP da consulta cosmética OpenAI v2. */
import {
    answerAiConsultationQuestion,
    beginAiConsultationAnalysis,
    cancelAiConsultationSession,
    createAiConsultationSession,
    editAiConsultationAnswer,
    getAiConsultationCapabilities,
    getAiConsultationSession,
    getCurrentAiConsultationSession,
    listAiConsultationGoals,
    listAiConsultationSessions,
    retryAiConsultationOperation,
    submitAiConsultationSession,
} from "../services/ai-consultation.service.js";
import {
    validateAnswerInput,
    validateAnswerEditInput,
    validateAnalysisStartInput,
    validateGoalSelection,
    validateSessionIdParam,
    validateSlotCodeParam,
    validateConsultationHistoryQuery,
} from "../validators/ai-consultation.validator.js";

function noStore(res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
}

/**
 * Publica a disponibilidade sanitizada do serviço OpenAI.
 * @returns {import("express").Response} Resposta sem dados sensíveis.
 */
export function getAiConsultationCapabilitiesController(req, res) {
    return res.status(200).json({ capabilities: getAiConsultationCapabilities() });
}

/**
 * Lista o catálogo público e versionado de objetivos cosméticos.
 * @returns {import("express").Response} Objetivos selecionáveis.
 */
export function listAiConsultationGoalsController(req, res) {
    return res.status(200).json(listAiConsultationGoals());
}

/**
 * Cria uma consulta própria depois de validar a seleção de objetivos.
 * @returns {Promise<import("express").Response|void>} Sessão criada ou erro delegado.
 */
export async function createAiConsultationSessionController(req, res, next) {
    try {
        const session = await createAiConsultationSession(
            req.user.id,
            validateGoalSelection(req.body),
        );
        noStore(res);
        return res.status(201).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Obtém a consulta aberta do titular autenticado.
 * @returns {Promise<import("express").Response|void>} Estado agregado ou erro delegado.
 */
export async function getCurrentAiConsultationSessionController(req, res, next) {
    try {
        const session = await getCurrentAiConsultationSession(req.user.id);
        noStore(res);
        return res.status(200).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Lista resumos próprios sem respostas, fotografias ou conteúdo bloqueado.
 * @returns {Promise<import("express").Response|void>} Histórico sanitizado.
 */
export async function listAiConsultationSessionsController(req, res, next) {
    try {
        const history = await listAiConsultationSessions(
            req.user.id,
            validateConsultationHistoryQuery(req.query),
        );
        noStore(res);
        return res.status(200).json(history);
    } catch (error) {
        return next(error);
    }
}

/**
 * Obtém uma consulta própria pelo identificador validado.
 * @returns {Promise<import("express").Response|void>} Sessão e transcript sanitizado.
 */
export async function getAiConsultationSessionController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await getAiConsultationSession(req.user.id, sessionId);
        noStore(res);
        return res.status(200).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Enfileira idempotentemente a análise das fotografias da consulta.
 * @returns {Promise<import("express").Response|void>} Operação assíncrona ou erro delegado.
 */
export async function beginAiConsultationAnalysisController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await beginAiConsultationAnalysis(
            req.user.id,
            sessionId,
            validateAnalysisStartInput(req.body),
        );
        noStore(res);
        return res.status(202).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Persiste uma resposta com CAS e prepara a pergunta seguinte.
 * @returns {Promise<import("express").Response|void>} Sessão atualizada ou erro delegado.
 */
export async function answerAiConsultationQuestionController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const input = validateAnswerInput(req.body);
        const session = await answerAiConsultationQuestion(req.user.id, sessionId, input);
        noStore(res);
        return res.status(session.operation ? 202 : 200).json({ session });
    } catch (error) {
        return next(error);
    }
}

/** Edita uma resposta já recolhida sem reconstruir o restante guião. */
export async function editAiConsultationAnswerController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const slotCode = validateSlotCodeParam(req.params);
        const input = validateAnswerEditInput(req.body);
        const session = await editAiConsultationAnswer(
            req.user.id,
            sessionId,
            slotCode,
            input,
        );
        noStore(res);
        return res.status(200).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Enfileira idempotentemente a geração do relatório final.
 * @returns {Promise<import("express").Response|void>} Operação assíncrona ou erro delegado.
 */
export async function submitAiConsultationSessionController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await submitAiConsultationSession(req.user.id, sessionId);
        noStore(res);
        return res.status(202).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Repete apenas a etapa durável que terminou como recuperável.
 * @returns {Promise<import("express").Response|void>} Nova tentativa ou erro delegado.
 */
export async function retryAiConsultationOperationController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await retryAiConsultationOperation(req.user.id, sessionId);
        noStore(res);
        return res.status(202).json({ session });
    } catch (error) {
        return next(error);
    }
}

/**
 * Cancela a consulta aberta e os respetivos jobs ainda executáveis.
 * @returns {Promise<import("express").Response|void>} Sessão cancelada ou erro delegado.
 */
export async function cancelAiConsultationSessionController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await cancelAiConsultationSession(req.user.id, sessionId);
        noStore(res);
        return res.status(200).json({ session });
    } catch (error) {
        return next(error);
    }
}
