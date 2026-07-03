/**
 * Middlewares de transporte seguro para a MF6.
 *
 * Em desenvolvimento a API pode correr em HTTP local. Em produção, `RNF09`
 * exige HTTPS/TLS e a app deve confiar no proxy frontal apenas para ler
 * `X-Forwarded-Proto`, nunca para decidir ownership ou autenticação.
 */
import { env } from "../config/env.js";
import { AppError } from "./error.middleware.js";

const HTTPS_UPGRADE_STATUS = 426;
const HSTS_HEADER_VALUE = "max-age=15552000; includeSubDomains";

/**
 * Confirma se o pedido chegou por HTTPS real ou por proxy HTTPS validado.
 *
 * @function isSecureTransport
 * @param {import("express").Request} req - Pedido Express.
 * @returns {boolean} Verdadeiro quando o transporte efetivo é HTTPS.
 */
function isSecureTransport(req) {
    const forwardedProto = String(req.get("x-forwarded-proto") ?? "")
        .split(",")[0]
        .trim()
        .toLowerCase();

    return req.secure || forwardedProto === "https";
}

/**
 * Aplica HSTS quando o ambiente exige HTTPS.
 *
 * @function securityTransportHeaders
 * @param {import("express").Request} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export function securityTransportHeaders(req, res, next) {
    if (isSecureTransport(req)) {
        res.setHeader("Strict-Transport-Security", HSTS_HEADER_VALUE);
    }

    next();
}

/**
 * Bloqueia HTTP em produção sem fazer redirect inseguro de métodos POST.
 *
 * @function enforceHttpsTransport
 * @param {import("express").Request} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export function enforceHttpsTransport(req, res, next) {
    if (!env.forceHttps || isSecureTransport(req)) {
        return next();
    }

    return next(
        new AppError(
            HTTPS_UPGRADE_STATUS,
            "HTTPS obrigatório para comunicações Orélle.",
        ),
    );
}
