/**
 * Servico de sessao segura do BK-MF0-02.
 *
 * A sessao e representada por um JWT assinado e guardado num cookie HttpOnly.
 * O frontend nunca recebe nem guarda token em localStorage/sessionStorage.
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Nome canónico do cookie de sessão.
 *
 * @type {"orelle_session"}
 */
export const SESSION_COOKIE_NAME = "orelle_session";

/**
 * Constrói as opções seguras do cookie de sessão.
 *
 * @function getSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/", maxAge: number}} Opções para `res.cookie`.
 */
export function getSessionCookieOptions() {
    // HttpOnly impede leitura por JavaScript; o frontend nunca recebe o segredo da sessão.
    // Secure fica dependente de produção porque o desenvolvimento local pode usar HTTP.
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
    };
}

/**
 * Constrói as opções usadas para limpar o cookie de sessão.
 *
 * @function getClearSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/"}} Opções para `res.clearCookie`.
 */
function getClearSessionCookieOptions() {
    const options = getSessionCookieOptions();
    // A limpeza mantém path/sameSite/secure iguais para apontar ao mesmo cookie criado no login.
    delete options.maxAge;

    return options;
}

/**
 * Cria um token de sessão a partir do utilizador seguro.
 *
 * @function createSessionToken
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {string} JWT assinado para colocar no cookie HttpOnly.
 */
export function createSessionToken(user) {
    return jwt.sign(
        {
            // O payload guarda apenas identidade mínima; permissões detalhadas ficam no backend.
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        env.sessionSecret,
        { expiresIn: env.sessionTtl },
    );
}

/**
 * Valida um token de sessão e devolve o utilizador autenticado.
 *
 * @function verifySessionToken
 * @param {string} token - JWT recebido do cookie.
 * @returns {{id: string, email: string, role: string}} Dados mínimos do utilizador autenticado.
 * @throws {AppError} Quando o token está ausente, inválido ou expirado.
 */
export function verifySessionToken(token) {
    try {
        // jwt.verify rejeita assinatura alterada, segredo errado ou expiração ultrapassada.
        const payload = jwt.verify(token, env.sessionSecret);

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    } catch {
        throw new AppError(401, "Sessão inválida ou expirada");
    }
}

/**
 * Escreve o cookie HttpOnly de sessão na resposta.
 *
 * @function attachSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {void}
 */
export function attachSessionCookie(res, user) {
    const token = createSessionToken(user);
    // O token segue no header Set-Cookie, não no body JSON devolvido ao browser.
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

/**
 * Limpa o cookie de sessão no logout.
 *
 * @function clearSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @returns {void}
 */
export function clearSessionCookie(res) {
    // Logout deve apagar o mesmo nome e os mesmos atributos usados no login.
    res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());
}