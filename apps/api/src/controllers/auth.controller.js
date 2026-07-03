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
} from "../services/session.service.js";
import {
    validateLoginInput,
    validateRegisterInput,
} from "../validators/auth.validator.js";

/**
 * Controller de registo do BK-MF0-01.
 *
 * @async
 * @function registerController
 * @param {import("express").Request} req - Pedido com email/password.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com utilizador seguro.
 */
export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        const user = await registerUser(input);

        return res.status(201).json({ user });
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

        attachSessionCookie(res, user);

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

/**
 * Controller de logout.
 *
 * @function logoutController
 * @param {import("express").Request} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @returns {import("express").Response} Resposta 204 depois de limpar cookie.
 */
export function logoutController(req, res) {
    clearSessionCookie(res);
    return res.status(204).send();
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
