/**
 * Middleware de autenticacao da MF0.
 *
 * O BK-MF0-02 define que rotas protegidas devem ler a sessao a partir de cookie
 * HttpOnly. Se a sessao for valida, o utilizador fica disponivel em `req.user`.
 */
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { AppError } from "./error.middleware.js";

/**
 * Bloqueia pedidos sem sessao valida.
 *
 * @function requireAuth
 * @param {import("express").Request & {user?: object}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        req.user = verifySessionToken(token);
        return next();
    } catch (err) {
        return next(err);
    }
}
