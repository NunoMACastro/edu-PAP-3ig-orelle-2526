/**
 * Middleware de erros partilhado pela API Orelle.
 *
 * A API usa `AppError` para erros esperados, como dados invalidos, falta de
 * sessao ou permissoes insuficientes. Erros inesperados devolvem mensagem
 * generica e requestId, sem detalhes internos.
 */
import {
    buildPublicErrorResponse,
    buildSafeErrorLog,
    writeSafeErrorLog,
} from "../services/observability.service.js";

/**
 * Erro controlado da aplicacao.
 *
 * @class
 * @extends Error
 */
export class AppError extends Error {
    /**
     * Cria um erro HTTP previsivel para controllers e validators.
     *
     * @param {number} statusCode - Codigo HTTP a devolver ao cliente.
     * @param {string} message - Mensagem segura para o cliente.
     * @param {Record<string, unknown>|undefined} [details] - Detalhes de validacao.
     */
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Converte erros da aplicacao numa resposta JSON uniforme e segura.
 *
 * @function errorMiddleware
 * @param {Error & {statusCode?: number, details?: unknown, code?: string}} err - Erro recebido.
 * @param {import("express").Request & {requestId?: string}} req - Pedido Express original.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {import("express").Response|void} Resposta JSON ou delegacao se headers ja foram enviados.
 */
export function errorMiddleware(err, req, res, next) {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode ?? 500;
    const message =
        statusCode === 500 ? "Erro interno do servidor" : err.message;

    // O log recebe apenas campos permitidos; nunca recebe req.body, headers,
    // cookies, ficheiros, fotografias, relatorios ou dados biometricos.
    writeSafeErrorLog(buildSafeErrorLog({ err, req, statusCode }));

    return res.status(statusCode).json(
        buildPublicErrorResponse({
            statusCode,
            message,
            details: err.details,
            requestId: req.requestId,
        }),
    );
}
