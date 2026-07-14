/**
 * Middleware de timeout transversal para pedidos HTTP da MF6.
 *
 * O objetivo e devolver uma falha controlada quando um pedido fica pendurado,
 * sem expor stack traces, paths internos ou dados de utilizador.
 */
import { AppError } from "./error.middleware.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

/**
 * Marca o pedido como expirado para que rotas assincronas parem com seguranca.
 *
 * @function markRequestTimedOut
 * @param {import("express").Request & {requestTimedOut?: boolean, orelleAbortSignal?: AbortSignal}} req - Pedido Express atual.
 * @returns {void}
 */
function markRequestTimedOut(req) {
    req.requestTimedOut = true;
}

/**
 * Cria middleware Express que limita a duracao de cada pedido.
 *
 * @function requestTimeout
 * @param {{timeoutMs?: number}} [options={}] - Configuracao do timeout.
 * @returns {import("express").RequestHandler} Middleware Express.
 */
export function requestTimeout({ timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = {}) {
    return (req, res, next) => {
        const abortController = new AbortController();
        req.requestTimedOut = false;
        // A propriedade e deliberadamente namespaced: Node.js 24 reserva
        // `IncomingMessage.signal` como getter nativo sem setter.
        req.orelleAbortSignal = abortController.signal;

        /**
         * Indica a handlers posteriores se o pedido ja ultrapassou o limite.
         *
         * @function req.hasRequestTimedOut
         * @returns {boolean} Verdadeiro quando o temporizador ja marcou o pedido como expirado.
         */
        req.hasRequestTimedOut = () => req.requestTimedOut === true;

        const timeoutId = setTimeout(() => {
            markRequestTimedOut(req);

            const timeoutError = new AppError(
                503,
                "Pedido excedeu o tempo limite.",
            );
            abortController.abort(timeoutError);

            if (res.headersSent) return;
            // A mensagem e generica para nao expor rota, query, stack trace ou dados sensiveis.
            next(timeoutError);
        }, timeoutMs);

        const cleanup = () => clearTimeout(timeoutId);

        req.once("aborted", () => {
            if (!abortController.signal.aborted) {
                abortController.abort(new Error("Pedido cancelado pelo cliente"));
            }
            cleanup();
        });
        res.once("finish", cleanup);
        res.once("close", () => {
            if (!res.writableFinished && !abortController.signal.aborted) {
                abortController.abort(new Error("Ligação ao cliente terminada"));
            }
            cleanup();
        });

        next();
    };
}
