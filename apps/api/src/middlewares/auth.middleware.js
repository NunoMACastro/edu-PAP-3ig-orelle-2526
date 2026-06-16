// real_dev/api/src/middlewares/auth.middleware.js
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { AppError } from "./error.middleware.js";

/**
 * Bloqueia pedidos autenticados de contas que foram suspensas depois do login.
 *
 * O MF4 define que rotas protegidas devem ler a sessão a partir do cookie,
 * mas também validar na Base de Dados se o estado da conta continua ativo.
 * Se a sessão for válida e ativa, o utilizador fica disponível em `req.user`.
 *
 * @async
 * @function requireAuth
 * @param {import("express").Request & {user?: object}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<void>}
 */
export async function requireAuth(req, res, next) {
    const sessionValue = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionValue) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        // 1. Descodifica o token da sessão
        const sessionUser = verifySessionToken(sessionValue);
        
        // 2. Procura o utilizador na Base de Dados para validar o estado atual dele
        const user = await User.findById(sessionUser.id).select("role isActive accountStatus");

        // 3. Se o utilizador foi apagado, desativado ou suspenso administrativamente, bloqueia imediatamente
        if (!user || !user.isActive || user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
            return next(new AppError(403, "Conta inativa. Contacta a equipa Orélle."));
        }

        // 4. Se estiver tudo bem, anexa os dados atualizados ao pedido
        req.user = { ...sessionUser, role: user.role };
        return next();
    } catch (err) {
        return next(err);
    }
}