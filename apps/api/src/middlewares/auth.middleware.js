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
import { ensureUserCanAuthenticate } from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { AppError } from "./error.middleware.js";

/**
 * Decide se a sessao deve ser revalidada contra a conta persistida.
 *
 * Em runtime real a revalidacao fica ativa para bloquear contas suspensas ou
 * eliminadas mesmo com cookie antigo. Em testes unitarios/integracao sem BD, a
 * revalidacao so corre quando o proprio teste fornece um mock explicito.
 *
 * @function shouldRevalidateSessionUser
 * @returns {boolean} Verdadeiro quando ha contrato seguro para consultar User.
 */
function shouldRevalidateSessionUser() {
    if (typeof User.findById !== "function") return false;

    return (
        process.env.NODE_ENV !== "test" ||
        User.findById._isMockFunction === true ||
        typeof User.findById.mock === "object"
    );
}

/**
 * Carrega apenas os campos necessarios para validar estado e role da conta.
 *
 * @async
 * @function findSessionAccountState
 * @param {string} userId - ID presente no token de sessao.
 * @returns {Promise<object|null>} Estado de conta com role atual ou null.
 */
async function findSessionAccountState(userId) {
    const query = User.findById(userId);

    if (!query) return null;

    if (typeof query.select === "function") {
        return query.select("role isActive accountStatus");
    }

    return query;
}

/**
 * Bloqueia pedidos sem sessao valida.
 *
 * @function requireAuth
 * @param {import("express").Request & {user?: object}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {void}
 */
export async function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        const sessionUser = verifySessionToken(token);

        if (shouldRevalidateSessionUser()) {
            const accountState = await findSessionAccountState(sessionUser.id);

            if (!accountState) {
                return next(new AppError(401, "Sessão inválida"));
            }

            ensureUserCanAuthenticate(accountState);
            req.user = {
                ...sessionUser,
                role: accountState.role,
            };
            return next();
        }

        req.user = sessionUser;
        return next();
    } catch (err) {
        return next(err);
    }
}
