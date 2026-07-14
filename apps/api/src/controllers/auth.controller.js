/**
 * Controllers de autenticacao.
 *
 * Os controllers fazem a ponte entre HTTP e services: validam o body, chamam a
 * regra de negocio e devolvem o status correto.
 */
import { loginUser, registerUser } from "../services/auth.service.js";
import {
    attachSessionCookie,
    clearSessionCookie,
    issueCsrfTokenForSession,
    revokeAllUserSessions,
    revokeSessionToken,
    SESSION_COOKIE_NAME,
} from "../services/session.service.js";
import {
    validateLoginInput,
    validateRegisterInput,
} from "../validators/auth.validator.js";

/** Resposta deliberadamente igual para email novo ou ja registado. */
export const REGISTRATION_ACCEPTED_RESPONSE = Object.freeze({
    message:
        "Pedido de registo recebido. Se este email estiver disponível, a conta será criada.",
});

/**
 * Controller de registo do BK-MF0-01.
 *
 * @async
 * @function registerController
 * @param {import("express").Request} req - Pedido com email/password.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * A resposta nao revela se o email ja existia. O service continua a executar
 * bcrypt e tenta o indice unico em ambos os casos, reduzindo tambem o canal de
 * enumeracao por diferenca grosseira de latencia.
 *
 * @returns {Promise<import("express").Response|void>} Resposta 202 genérica.
 */
export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        await registerUser(input);

        return res.status(202).json(REGISTRATION_ACCEPTED_RESPONSE);
    } catch (err) {
        return next(err);
    }
}

/**
 * Controller de login do BK-MF0-02.
 *
 * @async
 * @function loginController
 * @param {import("express").Request} req - Pedido com credenciais.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 e cookie HttpOnly.
 */
export async function loginController(req, res, next) {
    try {
        const input = validateLoginInput(req.body);
        const user = await loginUser(input);

        // O cookie so e emitido depois de a sessao opaca estar persistida.
        await attachSessionCookie(res, user);

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

/**
 * Roda e devolve o token CSRF da sessao autenticada.
 *
 * A resposta nao pode ser armazenada por browsers/proxies. O service persiste
 * apenas o HMAC do valor devolvido.
 *
 * @async
 * @function csrfController
 * @param {import("express").Request & {authSession?: {id?: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Continuacao Express.
 * @returns {Promise<import("express").Response|void>} Token CSRF de uso no header.
 */
export async function csrfController(req, res, next) {
    try {
        const csrfToken = await issueCsrfTokenForSession(req.authSession?.id);

        res.set("Cache-Control", "no-store");
        res.set("Pragma", "no-cache");
        return res.status(200).json({ csrfToken });
    } catch (error) {
        return next(error);
    }
}

/**
 * Controller de logout.
 *
 * @async
 * @function logoutController
 * @param {import("express").Request} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 204 depois de revogar e limpar cookie.
 */
export async function logoutController(req, res, next) {
    try {
        await revokeSessionToken(req.cookies?.[SESSION_COOKIE_NAME]);
        clearSessionCookie(res);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

/**
 * Revoga imediatamente todas as sessoes do utilizador autenticado.
 *
 * @async
 * @function logoutAllController
 * @param {import("express").Request & {user?: {id?: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 204 sem credenciais.
 */
export async function logoutAllController(req, res, next) {
    try {
        await revokeAllUserSessions(req.user.id);
        clearSessionCookie(res);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

/**
 * Controller que devolve o utilizador autenticado da sessao.
 *
 * @function meController
 * @param {import("express").Request & {user?: object}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @returns {import("express").Response} Resposta 200 com `req.user`.
 */
export function meController(req, res) {
    return res.status(200).json({ user: req.user });
}
