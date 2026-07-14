/**
 * Protecao CSRF para mutacoes autenticadas por cookie.
 *
 * A origem e comparada exclusivamente com uma allowlist configurada no
 * arranque. Nunca se infere uma origem confiavel a partir de `Host` ou de
 * headers forwarded, porque ambos podem ser controlados por um cliente.
 */
import { AppError } from "./error.middleware.js";
import {
    isCsrfProtectionRequiredForSession,
    verifyCsrfTokenForSession,
} from "../services/session.service.js";

/** Nome HTTP canonico do header CSRF enviado pelo frontend. */
export const CSRF_HEADER_NAME = "x-csrf-token";

/** Metodos que nao alteram estado e, por isso, nao exigem token CSRF. */
const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Hosts onde HTTP sem TLS e aceitavel no alvo academico/local. */
const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Normaliza uma origem HTTP/HTTPS sem aceitar paths, credenciais ou wildcards.
 *
 * HTTP simples e deliberadamente limitado ao loopback local. Qualquer origem
 * remota tem de usar HTTPS, mesmo que tenha sido colocada por engano na
 * configuracao.
 *
 * @function normalizeConfiguredOrigin
 * @param {unknown} value - Origem configurada ou recebida no pedido.
 * @returns {string} Origem canonica (`scheme://host[:port]`).
 * @throws {Error} Quando o valor nao representa uma origem segura e exata.
 */
export function normalizeConfiguredOrigin(value) {
    const rawOrigin = String(value ?? "").trim();

    if (!rawOrigin || rawOrigin === "null" || rawOrigin === "*") {
        throw new Error("Origem explicita HTTP/HTTPS obrigatoria");
    }

    let parsedOrigin;

    try {
        parsedOrigin = new URL(rawOrigin);
    } catch {
        throw new Error("Origem configurada invalida");
    }

    if (
        !["http:", "https:"].includes(parsedOrigin.protocol) ||
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== "/" ||
        parsedOrigin.search ||
        parsedOrigin.hash
    ) {
        throw new Error("Origem configurada deve conter apenas scheme, host e port");
    }

    if (
        parsedOrigin.protocol === "http:" &&
        !LOCAL_HTTP_HOSTS.has(parsedOrigin.hostname)
    ) {
        throw new Error("Origens HTTP remotas nao sao permitidas");
    }

    return parsedOrigin.origin;
}

/**
 * Valida e remove duplicados da allowlist usada tanto por CORS como por CSRF.
 *
 * @function normalizeAllowedOrigins
 * @param {unknown[]} values - Lista explicita de origens configuradas.
 * @returns {string[]} Allowlist canonica e nao vazia.
 */
export function normalizeAllowedOrigins(values) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Pelo menos uma origem cliente explicita e obrigatoria");
    }

    return [...new Set(values.map(normalizeConfiguredOrigin))];
}

/**
 * Exige Origin allowlisted e token CSRF ligado à sessão nas mutações.
 * Métodos seguros e o helper legado estritamente test-only ficam isentos;
 * sessões persistidas de runtime exigem sempre ambas as provas.
 *
 * @async
 * @function requireCsrfForAuthenticatedMutation
 * @param {import("express").Request} req - Pedido já autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Continuação Express.
 * @returns {Promise<unknown>|unknown} Resultado da continuação.
 */
export async function requireCsrfForAuthenticatedMutation(req, res, next) {
    if (SAFE_HTTP_METHODS.has(String(req.method ?? "GET").toUpperCase())) {
        return next();
    }

    if (!isCsrfProtectionRequiredForSession(req.authSession)) {
        return next();
    }

    try {
        const allowedOrigins = req.app?.locals?.csrfAllowedOrigins;
        const requestOrigin = normalizeConfiguredOrigin(
            req.get?.("origin") ?? req.headers?.origin,
        );

        if (!Array.isArray(allowedOrigins) || !allowedOrigins.includes(requestOrigin)) {
            throw new AppError(403, "Origem do pedido nao autorizada");
        }

        await verifyCsrfTokenForSession(
            req.authSession?.id,
            req.get?.(CSRF_HEADER_NAME) ?? req.headers?.[CSRF_HEADER_NAME],
        );

        return next();
    } catch (error) {
        if (error instanceof AppError) return next(error);

        return next(new AppError(403, "Origem do pedido nao autorizada"));
    }
}
