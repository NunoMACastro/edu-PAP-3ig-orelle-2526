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
 * @param {import("express").Request & {requestTimedOut?: boolean}} req - Pedido Express atual.
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
        req.requestTimedOut = false;
        req.hasRequestTimedOut = () => req.requestTimedOut === true;

        const timeoutId = setTimeout(() => {
            markRequestTimedOut(req);

            if (res.headersSent) return;
            // A mensagem e generica para nao expor rota, query, stack trace ou dados sensiveis.
            next(new AppError(503, "Pedido excedeu o tempo limite."));
        }, timeoutMs);

        res.once("finish", () => clearTimeout(timeoutId));
        res.once("close", () => clearTimeout(timeoutId));

        next();
    };
}
