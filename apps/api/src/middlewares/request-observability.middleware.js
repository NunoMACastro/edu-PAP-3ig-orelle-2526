/**
 * Middlewares de contexto e metricas HTTP para RNF20.
 */
import { performance } from "node:perf_hooks";
import {
    createRequestId,
    getSafeRoute,
    recordHttpRequestMetric,
} from "../services/observability.service.js";

/**
 * Cria contexto minimo de observabilidade para cada pedido.
 *
 * @function requestContextMiddleware
 * @param {import("express").Request & {requestId?: string, requestStartedAt?: number}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export function requestContextMiddleware(req, res, next) {
    req.requestId = createRequestId();
    req.requestStartedAt = performance.now();

    // O header permite cruzar uma resposta com o log tecnico sem expor dados pessoais.
    res.set("X-Request-Id", req.requestId);
    next();
}

/**
 * Regista uma metrica quando a resposta HTTP termina.
 *
 * @function requestMetricsMiddleware
 * @param {import("express").Request & {requestStartedAt?: number}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export function requestMetricsMiddleware(req, res, next) {
    res.on("finish", () => {
        const startedAt = Number.isFinite(req.requestStartedAt)
            ? req.requestStartedAt
            : performance.now();
        const durationMs = Math.max(
            0,
            Math.round(performance.now() - startedAt),
        );

        // A escrita acontece depois da resposta e nunca deve alterar o resultado do pedido.
        void recordHttpRequestMetric({
            method: req.method,
            route: getSafeRoute(req),
            statusCode: res.statusCode,
            durationMs,
        });
    });

    next();
}
