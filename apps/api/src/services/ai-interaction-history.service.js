/**
 * Service do historico seguro da interacao cliente-IA.
 *
 * Todas as leituras filtram pelo utilizador autenticado e todas as escritas
 * passam por minimizacao antes da persistencia cifrada.
 */
import { isValidObjectId } from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AI_HISTORY_EVENT_TYPES,
    AI_HISTORY_SOURCES,
    AiInteractionHistory,
} from "../models/ai-interaction-history.model.js";

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 50;
const MAX_SIGNAL_COUNT = 12;
const SENSITIVE_TERMS = Object.freeze([
    "fotografia",
    "imagem facial",
    "ficheiro privado",
    "prompt interno",
    "segredo",
    "cookie",
    "token",
    "chave privada",
    "consentimento",
    "storage key",
]);

/**
 * Normaliza texto obrigatorio com limite de tamanho.
 *
 * @function normalizeText
 * @param {unknown} value - Valor recebido.
 * @param {string} fieldName - Nome do campo para mensagem segura.
 * @param {number} maxLength - Tamanho maximo permitido.
 * @returns {string} Texto normalizado.
 * @throws {AppError} Quando o texto e invalido.
 */
function normalizeText(value, fieldName, maxLength) {
    if (typeof value !== "string") {
        throw new AppError(400, `${fieldName} obrigatorio.`);
    }

    const text = value.trim();

    if (text.length < 3 || text.length > maxLength) {
        throw new AppError(400, `${fieldName} fora do tamanho permitido.`);
    }

    return text;
}

/**
 * Valida identificadores internos sem permitir ownership vindo do browser.
 *
 * @function normalizeObjectId
 * @param {unknown} value - Identificador recebido de service interno.
 * @param {string} fieldName - Nome logico do campo.
 * @returns {string} ObjectId textual validado.
 * @throws {AppError} Quando o identificador e invalido.
 */
function normalizeObjectId(value, fieldName) {
    const normalized = String(value ?? "").trim();

    if (!isValidObjectId(normalized)) {
        throw new AppError(400, `${fieldName} invalido.`);
    }

    return normalized;
}

/**
 * Rejeita termos que indiquem dados privados ou tecnicos no historico publico.
 *
 * @function assertNoSensitiveContent
 * @param {unknown} value - Valor ja minimizado pelo caller.
 * @returns {void}
 * @throws {AppError} Quando existe indicio de dado sensivel.
 */
function assertNoSensitiveContent(value) {
    const text = JSON.stringify(value).toLowerCase();
    const foundTerm = SENSITIVE_TERMS.find((term) => text.includes(term));

    if (foundTerm) {
        throw new AppError(400, "Historico IA contem dado sensivel.", {
            term: foundTerm,
        });
    }
}

/**
 * Valida tipo de evento permitido pelo contrato do BK.
 *
 * @function normalizeEventType
 * @param {unknown} eventType - Tipo recebido.
 * @returns {string} Tipo validado.
 * @throws {AppError} Quando o tipo nao pertence ao contrato.
 */
function normalizeEventType(eventType) {
    if (!AI_HISTORY_EVENT_TYPES.includes(eventType)) {
        throw new AppError(400, "Tipo de evento IA invalido.");
    }

    return eventType;
}

/**
 * Valida origem interna do evento.
 *
 * @function normalizeSource
 * @param {unknown} source - Origem recebida.
 * @returns {string} Origem validada.
 * @throws {AppError} Quando a origem e desconhecida.
 */
function normalizeSource(source) {
    const normalized = source ?? "guided_consultation";

    if (!AI_HISTORY_SOURCES.includes(normalized)) {
        throw new AppError(400, "Origem do historico IA invalida.");
    }

    return normalized;
}

/**
 * Normaliza sinais publicos para a timeline IA.
 *
 * @function normalizeSafeSignals
 * @param {unknown} signals - Sinais candidatos.
 * @returns {{key: string, label: string, value: string}[]} Sinais seguros.
 * @throws {AppError} Quando existem sinais invalidos ou excessivos.
 */
function normalizeSafeSignals(signals) {
    if (!Array.isArray(signals)) {
        throw new AppError(400, "Sinais do historico obrigatorios.");
    }

    if (signals.length === 0 || signals.length > MAX_SIGNAL_COUNT) {
        throw new AppError(400, "Numero de sinais do historico invalido.");
    }

    return signals.map((signal) => {
        // Cada sinal e normalizado campo a campo para rejeitar payloads livres vindos de IA ou UI.
        const normalizedSignal = {
            key: normalizeText(signal?.key, "Chave do sinal", 40),
            label: normalizeText(signal?.label, "Etiqueta do sinal", 80),
            value: normalizeText(signal?.value, "Valor do sinal", 120),
        };

        assertNoSensitiveContent(normalizedSignal);

        return normalizedSignal;
    });
}

/**
 * Normaliza limite de listagem para intervalo seguro.
 *
 * @function normalizeLimit
 * @param {unknown} limit - Valor recebido da query ou de service interno.
 * @returns {number} Limite final.
 */
function normalizeLimit(limit) {
    const parsed = Number.parseInt(String(limit ?? DEFAULT_HISTORY_LIMIT), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_HISTORY_LIMIT;
    }

    return Math.min(parsed, MAX_HISTORY_LIMIT);
}

/**
 * Converte documento interno em DTO publico.
 *
 * @function toPublicHistoryItem
 * @param {object} historyItem - Documento Mongoose ou mock equivalente.
 * @returns {object} Item publico da timeline IA.
 */
function toPublicHistoryItem(historyItem) {
    return {
        id: historyItem._id.toString(),
        eventType: historyItem.eventType,
        purpose: historyItem.purpose,
        safeSummary: historyItem.safeSummary,
        safeSignals: historyItem.safeSignals,
        source: historyItem.source,
        createdAt: historyItem.createdAt,
        updatedAt: historyItem.updatedAt,
    };
}

/**
 * Regista evento minimizado da interacao cliente-IA.
 *
 * @async
 * @function recordAiInteractionHistoryEvent
 * @param {{userId: string, sessionId: string, eventType: string, purpose: string, safeSummary: string, safeSignals: {key: string, label: string, value: string}[], source?: string}} input - Evento interno.
 * @param {{session?: import("mongoose").ClientSession|null}} [options] - Sessão transacional interna opcional.
 * @returns {Promise<object>} DTO publico do evento criado.
 * @throws {AppError} Quando o evento tem dados invalidos ou sensiveis.
 */
export async function recordAiInteractionHistoryEvent(input, options = {}) {
    const userId = normalizeObjectId(input?.userId, "Utilizador do historico");
    const sessionId = normalizeObjectId(input?.sessionId, "Sessao IA do historico");
    const eventType = normalizeEventType(input?.eventType);
    const source = normalizeSource(input?.source);
    const purpose = normalizeText(input?.purpose, "Finalidade do historico", 120);
    const safeSummary = normalizeText(input?.safeSummary, "Resumo do historico", 700);
    const safeSignals = normalizeSafeSignals(input?.safeSignals);

    assertNoSensitiveContent({ purpose, safeSummary, safeSignals });

    // A escrita fica centralizada para que controllers e providers nao ignorem minimizacao.
    const document = {
        userId,
        sessionId,
        eventType,
        purpose,
        safeSummary,
        safeSignals,
        source,
    };
    const created = options.session
        ? await AiInteractionHistory.create([document], {
              session: options.session,
          })
        : await AiInteractionHistory.create(document);
    const historyItem = Array.isArray(created) ? created[0] : created;

    return toPublicHistoryItem(historyItem);
}

/**
 * Lista historico IA do proprio utilizador autenticado.
 *
 * @async
 * @function listMyAiInteractionHistory
 * @param {string} userId - Utilizador autenticado.
 * @param {{limit?: string|number}} [options={}] - Opcoes de paginacao simples.
 * @returns {Promise<object[]>} Timeline publica ordenada por data decrescente.
 */
export async function listMyAiInteractionHistory(userId, options = {}) {
    const normalizedUserId = normalizeObjectId(userId, "Utilizador do historico");
    const limit = normalizeLimit(options.limit);
    // O filtro usa sempre o userId autenticado recebido do controller, nunca um ID enviado pelo browser.
    const historyItems = await AiInteractionHistory.find({ userId: normalizedUserId })
        .sort({ createdAt: -1 })
        .limit(limit);

    return historyItems.map(toPublicHistoryItem);
}

/**
 * Lista contexto interno seguro para enriquecimento de recomendacoes no BK-MF8-10.
 *
 * @async
 * @function listRecommendationHistoryContext
 * @param {string} userId - Utilizador autenticado no fluxo chamador.
 * @param {{sessionId?: string|null, limit?: string|number, session?: import("mongoose").ClientSession|null}} [options={}] - Filtro e sessão transacional opcionais.
 * @returns {Promise<{eventType: string, purpose: string, safeSummary: string, safeSignals: Array<object>, source: string, createdAt: Date}[]>} Contexto minimizado.
 */
export async function listRecommendationHistoryContext(userId, options = {}) {
    const normalizedUserId = normalizeObjectId(userId, "Utilizador do historico");
    const filter = { userId: normalizedUserId };

    if (options.sessionId) {
        filter.sessionId = normalizeObjectId(
            options.sessionId,
            "Sessao IA do historico",
        );
    }

    let query = AiInteractionHistory.find(filter)
        .sort({ createdAt: -1 })
        .limit(normalizeLimit(options.limit));
    if (options.session) query = query.session(options.session);
    const historyItems = await query;

    // O contrato interno para recomendacoes continua sem expor IDs de sessao ou utilizador.
    return historyItems.map((historyItem) => ({
        eventType: historyItem.eventType,
        purpose: historyItem.purpose,
        safeSummary: historyItem.safeSummary,
        safeSignals: historyItem.safeSignals,
        source: historyItem.source,
        createdAt: historyItem.createdAt,
    }));
}
