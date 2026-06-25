import { AppError } from "./error.middleware.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

/**
 * Marca o pedido como expirado e permite que rotas lentas parem de responder tarde.
 *
 * @function markRequestTimedOut
 * @param {import("express").Request & {requestTimedOut?: boolean, hasRequestTimedOut?: () => boolean}} req - Pedido Express atual.
 * @returns {void}
 */
function markRequestTimedOut(req) {
    req.requestTimedOut = true;
}

/**
 * Cria middleware Express que limita a duração máxima de cada pedido.
 *
 * @function requestTimeout
 * @param {number} [timeoutMs=DEFAULT_REQUEST_TIMEOUT_MS] - Tempo máximo permitido por pedido HTTP.
 * @returns {import("express").RequestHandler} Middleware que encaminha erro 503 quando a rota demora demasiado.
 */
export function requestTimeout(timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    return (req, res, next) => {
        req.requestTimedOut = false;
        req.hasRequestTimedOut = () => req.requestTimedOut === true;

        const timer = setTimeout(() => {
            markRequestTimedOut(req);

            if (!res.headersSent) {
                // A mensagem é genérica para não revelar rota interna, query, stack trace ou dados do utilizador.
                next(new AppError(503, "Pedido demorou demasiado. Tenta novamente."));
            }
        }, timeoutMs);

        // Limpar o temporizador evita trabalho pendente depois de respostas rápidas ou ligações fechadas.
        res.on("finish", () => clearTimeout(timer));
        res.on("close", () => clearTimeout(timer));

        next();
    };
}