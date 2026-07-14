/**
 * Service de observabilidade segura para RNF20.
 *
 * A API centraliza aqui requestId, sanitizacao, logs e metricas para que
 * controllers e middlewares nao espalhem regras diferentes nem exponham dados
 * pessoais, biometricos, cookies, tokens, paths internos ou payloads completos.
 */
import { randomUUID } from "node:crypto";
import { PerformanceMetric } from "../models/performance-metric.model.js";

export const HTTP_REQUEST_OPERATION = "http_request";
export const HTTP_REQUEST_BUDGET_MS = 3000;
export const HTTP_SUCCESS_SAMPLE_RATE = 0.1;

const REDACTED_VALUE = "[redigido]";
const MAX_ROUTE_LENGTH = 120;
const MAX_DETAIL_DEPTH = 4;
const SENSITIVE_KEY_PATTERN =
    /authorization|cookie|password|token|secret|storage|path|file|photo|image|report|biometric|headers/i;
const SENSITIVE_VALUE_PATTERN =
    /Bearer\s+|orelle_session=|\/Users\/|\/private\/|\/srv\/|\.enc|\.png|\.jpg|eyJ/i;

/**
 * Cria um identificador tecnico para correlacionar resposta, log e metrica.
 *
 * @function createRequestId
 * @returns {string} UUID aleatorio para o pedido atual.
 */
export function createRequestId() {
    return randomUUID();
}

/**
 * Remove query strings e identificadores reais antes de registar a rota.
 *
 * @function getSafeRoute
 * @param {import("express").Request} req - Pedido Express observado.
 * @returns {string} Rota minimizada para logs e metricas.
 */
export function getSafeRoute(req) {
    const routePath = req.route?.path;
    const rawRoute =
        routePath && req.baseUrl
            ? `${req.baseUrl}${routePath}`
            : (req.originalUrl?.split("?")[0] ?? "unknown");

    const withoutObjectIds = rawRoute.replace(/[a-f0-9]{24}/gi, ":id");
    const withoutUuid = withoutObjectIds.replace(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        ":id",
    );
    const withoutNumbers = withoutUuid.replace(/\/\d+(?=\/|$)/g, "/:id");

    return withoutNumbers.slice(0, MAX_ROUTE_LENGTH);
}

/**
 * Verifica se um texto parece conter dados sensiveis.
 *
 * @function isSensitiveText
 * @param {string} value - Texto a avaliar.
 * @returns {boolean} Verdadeiro quando o texto deve ser redigido.
 */
function isSensitiveText(value) {
    return SENSITIVE_VALUE_PATTERN.test(value);
}

/**
 * Sanitiza detalhes que podem ir para a resposta publica.
 *
 * @function sanitizePublicDetails
 * @param {unknown} details - Detalhes recebidos de validators ou services.
 * @param {number} [depth=0] - Profundidade atual da sanitizacao recursiva.
 * @returns {unknown} Detalhes sem campos sensiveis.
 */
export function sanitizePublicDetails(details, depth = 0) {
    if (details === undefined || details === null) return undefined;
    if (depth > MAX_DETAIL_DEPTH) return REDACTED_VALUE;

    if (typeof details === "string") {
        return isSensitiveText(details) ? REDACTED_VALUE : details;
    }

    if (typeof details === "number" || typeof details === "boolean") {
        return details;
    }

    if (Array.isArray(details)) {
        return details.map((item) => sanitizePublicDetails(item, depth + 1));
    }

    if (typeof details === "object") {
        return Object.fromEntries(
            Object.entries(details).map(([key, value]) => {
                // A chave e bloqueada antes do valor para impedir cookies,
                // tokens e paths mesmo quando o conteudo parece inocente.
                if (SENSITIVE_KEY_PATTERN.test(key)) {
                    return [key, REDACTED_VALUE];
                }

                return [key, sanitizePublicDetails(value, depth + 1)];
            }),
        );
    }

    return undefined;
}

/**
 * Construi a resposta de erro que pode ser devolvida ao frontend.
 *
 * @function buildPublicErrorResponse
 * @param {{statusCode: number, message: string, details?: unknown, requestId?: string}} options - Dados do erro.
 * @returns {{error: {message: string, requestId: string, details?: unknown}}} Resposta publica minimizada.
 */
export function buildPublicErrorResponse({
    statusCode,
    message,
    details,
    requestId = "sem-request-id",
}) {
    const publicError = {
        message: statusCode === 500 ? "Erro interno do servidor" : message,
        requestId,
    };
    const safeDetails =
        statusCode === 500 ? undefined : sanitizePublicDetails(details);

    if (safeDetails !== undefined) {
        publicError.details = safeDetails;
    }

    return { error: publicError };
}

/**
 * Cria uma entrada de log com lista fechada de campos permitidos.
 *
 * @function buildSafeErrorLog
 * @param {{err: Error & {statusCode?: number}, req: import("express").Request, statusCode: number}} options - Erro e pedido.
 * @returns {Record<string, string|number>} Entrada segura para log.
 */
export function buildSafeErrorLog({ err, req, statusCode }) {
    return {
        level: statusCode >= 500 ? "error" : "warn",
        event: "api_error",
        requestId: req.requestId ?? "sem-request-id",
        method: req.method,
        route: getSafeRoute(req),
        statusCode,
        errorName: err.name ?? "Error",
        message: statusCode === 500 ? "Erro interno do servidor" : err.message,
    };
}

/**
 * Escreve o log seguro ja minimizado.
 *
 * @function writeSafeErrorLog
 * @param {Record<string, string|number>} entry - Entrada de log permitida.
 * @param {{error: (message: string) => void}} [logger=console] - Logger injetavel para testes.
 * @returns {void}
 */
export function writeSafeErrorLog(entry, logger = console) {
    logger.error(JSON.stringify(entry));
}

/**
 * Converte um codigo HTTP num estado operacional simples.
 *
 * @function getMetricStatus
 * @param {number} statusCode - Codigo HTTP observado.
 * @returns {"success"|"client_error"|"error"} Estado operacional da metrica.
 */
export function getMetricStatus(statusCode) {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "client_error";
    return "success";
}

/**
 * Indica se o modelo real tem uma ligacao Mongo pronta para escrita.
 *
 * @function canUseRealMetricConnection
 * @returns {boolean} Verdadeiro quando uma escrita real nao fica em buffer.
 */
function canUseRealMetricConnection() {
    const readyState = PerformanceMetric.db?.readyState;

    return typeof readyState !== "number" || readyState === 1;
}

/**
 * Mantém todos os erros e aplica sampling apenas a pedidos HTTP bem-sucedidos.
 * Em testes, todos os sucessos são gravados para conservar provas determinísticas.
 *
 * @function shouldRecordHttpMetric
 * @param {{statusCode: number, sampleValue?: number, nodeEnv?: string}} input - Estado e amostra normalizada.
 * @returns {boolean} Verdadeiro quando a métrica deve ser persistida.
 */
export function shouldRecordHttpMetric({
    statusCode,
    sampleValue = Math.random(),
    nodeEnv = process.env.NODE_ENV,
}) {
    if (statusCode >= 400 || nodeEnv === "test") return true;
    return (
        Number.isFinite(sampleValue) &&
        sampleValue >= 0 &&
        sampleValue < HTTP_SUCCESS_SAMPLE_RATE
    );
}

/**
 * Regista uma metrica HTTP minimizada sem interromper o pedido principal.
 *
 * @async
 * @function recordHttpRequestMetric
 * @param {{method: string, route: string, statusCode: number, durationMs: number}} metric - Metrica observada.
 * @param {{sampleValue?: number, nodeEnv?: string}} [options] - Amostra e ambiente injetáveis.
 * @returns {Promise<void>} Promessa resolvida mesmo que a escrita auxiliar falhe.
 */
export async function recordHttpRequestMetric(
    { method, route, statusCode, durationMs },
    { sampleValue = Math.random(), nodeEnv = process.env.NODE_ENV } = {},
) {
    try {
        if (
            !canUseRealMetricConnection() ||
            !shouldRecordHttpMetric({ statusCode, sampleValue, nodeEnv })
        ) {
            return;
        }

        await PerformanceMetric.create({
            operation: HTTP_REQUEST_OPERATION,
            method,
            route,
            statusCode,
            durationMs,
            status: getMetricStatus(statusCode),
            budgetMs: HTTP_REQUEST_BUDGET_MS,
        });
    } catch {
        // Observabilidade e auxiliar: a resposta principal nao deve falhar nem
        // expor detalhes internos quando a escrita da metrica falha.
    }
}
