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
import { env, ENVIRONMENT_NAMES } from "../config/env.js";
import { AppError } from "./error.middleware.js";
import { runRateLimitPolicy } from "./rate-limit.middleware.js";
import { requireCsrfForAuthenticatedMutation } from "./csrf.middleware.js";

/**
 * Aplica, pela ordem, a quota autenticada e a protecao CSRF comum.
 *
 * @function continueAuthenticatedRequest
 * @param {import("express").Request} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Continuacao Express.
 * @returns {unknown} Resultado do limiter.
 */
function continueAuthenticatedRequest(req, res, next) {
    return runRateLimitPolicy("authenticated", req, res, (rateLimitError) => {
        if (rateLimitError) return next(rateLimitError);

        return requireCsrfForAuthenticatedMutation(req, res, next);
    });
}

/**
 * Decide se a sessao deve ser revalidada contra a conta persistida.
 *
 * Em runtime real a revalidacao fica ativa para bloquear contas suspensas ou
 * eliminadas mesmo com cookie antigo. Em testes unitarios/integracao sem BD, a
 * revalidacao so corre quando o proprio teste fornece um mock explicito.
 *
 * @function shouldRevalidateSessionUser
 * @param {{nodeEnv?: string, e2eIsolated?: boolean, userModel?: typeof User}} [options] - Runtime injetável para testes puros.
 * @returns {boolean} Verdadeiro quando ha contrato seguro para consultar User.
 */
export function shouldRevalidateSessionUser({
    nodeEnv = env.nodeEnv,
    e2eIsolated = env.e2eIsolated,
    userModel = User,
} = {}) {
    if (typeof userModel.findById !== "function") {
        // Em runtime nunca se autentica sem revalidar a conta. Nos testes
        // legados, o modelo reduzido pode omitir esta funcao deliberadamente.
        return nodeEnv !== ENVIRONMENT_NAMES.TEST;
    }

    return (
        nodeEnv !== ENVIRONMENT_NAMES.TEST ||
        (e2eIsolated === true && userModel.db?.readyState === 1) ||
        userModel.findById._isMockFunction === true ||
        typeof userModel.findById.mock === "object"
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
        return query.select("email role isActive accountStatus");
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
        const sessionUser = await verifySessionToken(token);

        if (shouldRevalidateSessionUser()) {
            const accountState = await findSessionAccountState(sessionUser.id);

            if (!accountState) {
                return next(new AppError(401, "Sessão inválida"));
            }

            ensureUserCanAuthenticate(accountState);
            req.user = {
                id: sessionUser.id,
                email: accountState.email ?? sessionUser.email,
                role: accountState.role,
            };
            req.authSession = {
                id: sessionUser.sessionId,
                csrfProtectionRequired:
                    sessionUser.csrfProtectionRequired !== false,
            };
            return continueAuthenticatedRequest(req, res, next);
        }

        // O adaptador test-only transporta identidade para suites sem MongoDB.
        // `sessionId` permanece metadata interna e nunca entra no DTO `/me`.
        req.user = {
            id: sessionUser.id,
            email: sessionUser.email,
            role: sessionUser.role,
        };
        req.authSession = {
            id: sessionUser.sessionId,
            csrfProtectionRequired: sessionUser.csrfProtectionRequired !== false,
        };
        return continueAuthenticatedRequest(req, res, next);
    } catch (err) {
        return next(err);
    }
}
