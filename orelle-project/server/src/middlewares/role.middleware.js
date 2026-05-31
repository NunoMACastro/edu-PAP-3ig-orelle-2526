import { AppError } from "./error.middleware.js";

/**
 * Verifica se o utilizador autenticado tem uma das roles permitidas.
 * Deve ser usado sempre depois de requireAuth.
 */
export function requireRole(...allowedRoles) {
    return function roleMiddleware(req, res, next) {
        if (!req.user) {
            return next(new AppError(401, "Autenticacao obrigatoria"));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(403, "Sem permissao para esta operacao"));
        }

        return next();
    };
}