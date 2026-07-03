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
 * Nome canonico do cookie de sessao.
 *
 * @type {"orelle_session"}
 */
export const SESSION_COOKIE_NAME = "orelle_session";

/**
 * Constroi as opcoes seguras do cookie de sessao.
 *
 * @function getSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/", maxAge: number}} Opcoes para `res.cookie`.
 */
export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.forceHttps,
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
    };
}

/**
 * Constroi as opcoes usadas para limpar o cookie de sessao.
 *
 * `clearCookie` nao deve receber `maxAge`, porque o Express passa a ignorar
 * esse campo em versoes futuras. Mantemos os restantes atributos iguais aos
 * usados na criacao para atingir o mesmo cookie.
 *
 * @function getClearSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/"}} Opcoes para `res.clearCookie`.
 */
function getClearSessionCookieOptions() {
    const options = getSessionCookieOptions();
    delete options.maxAge;

    return options;
}

/**
 * Cria um token de sessao a partir do utilizador seguro.
 *
 * @function createSessionToken
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {string} JWT assinado para colocar no cookie HttpOnly.
 */
export function createSessionToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        env.sessionSecret,
        { expiresIn: env.sessionTtl },
    );
}

/**
 * Valida um token de sessao e devolve o utilizador autenticado.
 *
 * @function verifySessionToken
 * @param {string} token - JWT recebido do cookie.
 * @returns {{id: string, email: string, role: string}} Dados minimos do utilizador autenticado.
 * @throws {AppError} Quando o token esta ausente, invalido ou expirado.
 */
export function verifySessionToken(token) {
    try {
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
 * Escreve o cookie HttpOnly de sessao na resposta.
 *
 * @function attachSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {void}
 */
export function attachSessionCookie(res, user) {
    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

/**
 * Limpa o cookie de sessao no logout.
 *
 * @function clearSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @returns {void}
 */
export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());
}
