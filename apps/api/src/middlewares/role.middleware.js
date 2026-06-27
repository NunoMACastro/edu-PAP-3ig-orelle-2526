/**
 * Middleware de roles do BK-MF0-05.
 *
 * Deve ser usado sempre depois de `requireAuth`, porque depende de `req.user`
 * ja estar preenchido pela sessao.
 */
import { AppError } from "./error.middleware.js";

/**
 * Cria um middleware que exige uma das roles indicadas.
 *
 * @function requireRole
 * @param {...string} allowedRoles - Roles autorizadas para a rota.
 * @returns {import("express").RequestHandler} Middleware Express de autorizacao.
 */
export function requireRole(...allowedRoles) {
    /**
     * Middleware que valida a role do utilizador autenticado.
     *
     * @param {import("express").Request & {user?: {role?: string}}} req - Pedido Express.
     * @param {import("express").Response} res - Resposta Express.
     * @param {import("express").NextFunction} next - Proximo middleware.
     * @returns {void}
     */
    return function roleMiddleware(req, res, next) {
        if (!req.user) {
            return next(new AppError(401, "Autenticação obrigatória"));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(403, "Sem permissao para esta operacao"));
        }

        return next();
    };
}
