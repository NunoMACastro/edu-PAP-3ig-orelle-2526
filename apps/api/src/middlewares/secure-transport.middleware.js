import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express ou o proxy indicam HTTPS.
 */
export function isSecureRequest(req) {
    // Em produção com proxy, Express precisa deste header para conhecer o protocolo original.
    return req.secure || req.get("x-forwarded-proto") === "https";
}
import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express ou o proxy indicam HTTPS.
 */
export function isSecureRequest(req) {
    // Em produção com proxy, Express precisa deste header para conhecer o protocolo original.
    return req.secure || req.get("x-forwarded-proto") === "https";
}

/**
 * Exige HTTPS em produção e aplica HSTS quando o pedido é seguro.
 *
 * @function requireHttps
 * @param {{nodeEnv: string}} env - Configuração normalizada da aplicação.
 * @returns {import("express").RequestHandler} Middleware Express.
 */
export function requireHttps(env) {
    return (req, res, next) => {
        if (env.nodeEnv !== "production") {
            return next();
        }

        if (!isSecureRequest(req)) {
            // A mensagem não revela topologia interna, nomes de proxy ou portas privadas.
            return next(new AppError(403, "Comunicação HTTPS obrigatória."));
        }

        // HSTS só é enviado depois de confirmar HTTPS para reforçar o browser em produção.
        res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
        return next();
    };
}