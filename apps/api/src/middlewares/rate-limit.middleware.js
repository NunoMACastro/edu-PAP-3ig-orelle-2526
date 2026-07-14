/**
 * Políticas de rate limiting da API Orélle.
 *
 * Os limites são criados por aplicação Express, evitando estado partilhado
 * entre testes ou instâncias locais. A factory aceita stores injetáveis para
 * permitir testes determinísticos e uma futura troca por um store distribuído.
 */
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "./error.middleware.js";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Políticas canónicas definidas no plano integral da auditoria. */
export const RATE_LIMIT_POLICIES = Object.freeze({
    login: Object.freeze({
        identifier: "auth-login",
        limit: 5,
        windowMs: 15 * MINUTE_MS,
    }),
    register: Object.freeze({
        identifier: "auth-register",
        limit: 3,
        windowMs: HOUR_MS,
    }),
    authenticated: Object.freeze({
        identifier: "api-authenticated",
        limit: 120,
        windowMs: MINUTE_MS,
    }),
    upload: Object.freeze({
        identifier: "face-upload",
        limit: 5,
        windowMs: HOUR_MS,
    }),
    ai: Object.freeze({
        identifier: "ai-generation",
        // Uma consulta completa pode consumir criação + análise + 8 respostas
        // + relatório (11 pedidos). Três consultas válidas usam 33 pedidos;
        // esta margem adicional cobre retries explícitos sem substituir as
        // quotas funcionais aplicadas no domínio.
        limit: 60,
        windowMs: DAY_MS,
    }),
});

/**
 * Cria uma chave de quota que prefere a conta autenticada.
 *
 * Pedidos públicos usam `req.ip`, já calculado pelo Express a partir da
 * allowlist de proxies. `ipKeyGenerator` agrega IPv6 por subnet e evita que um
 * único cliente contorne a quota rodando endereços dentro da mesma rede.
 *
 * @function getRateLimitIdentity
 * @param {import("express").Request & {user?: {id?: unknown}}} req - Pedido atual.
 * @returns {string} Identidade técnica sem email, token, cookie ou outro PII.
 */
export function getRateLimitIdentity(req) {
    const userId = String(req.user?.id ?? "").trim();

    if (userId) {
        return `user:${userId}`;
    }

    const safeIp = String(req.ip ?? req.socket?.remoteAddress ?? "unknown");
    return `ip:${ipKeyGenerator(safeIp)}`;
}

/**
 * Calcula um Retry-After conservador para respostas bloqueadas.
 *
 * @function getRetryAfterSeconds
 * @param {import("express").Request & {rateLimit?: {resetTime?: Date}}} req - Pedido limitado.
 * @param {number} windowMs - Janela total da política.
 * @param {number} [now=Date.now()] - Relógio injetável para testes unitários.
 * @returns {number} Segundos inteiros, nunca inferiores a um.
 */
export function getRetryAfterSeconds(req, windowMs, now = Date.now()) {
    const resetAt = req.rateLimit?.resetTime?.getTime?.();
    const remainingMs = Number.isFinite(resetAt) ? resetAt - now : windowMs;

    return Math.max(1, Math.ceil(remainingMs / 1000));
}

/**
 * Cria um limiter Express com resposta segura e headers normalizados.
 *
 * @function createRateLimiter
 * @param {{identifier: string, limit: number, windowMs: number, store?: import("express-rate-limit").Store, keyGenerator?: (req: import("express").Request) => string}} options - Política e dependências.
 * @returns {import("express").RequestHandler} Middleware de limitação.
 */
export function createRateLimiter({
    identifier,
    limit,
    windowMs,
    store,
    keyGenerator = getRateLimitIdentity,
}) {
    return rateLimit({
        identifier,
        limit,
        windowMs,
        store,
        keyGenerator,
        legacyHeaders: false,
        standardHeaders: "draft-8",
        passOnStoreError: false,
        handler(req, res, next) {
            res.setHeader(
                "Retry-After",
                String(getRetryAfterSeconds(req, windowMs)),
            );
            return next(
                new AppError(
                    429,
                    "Demasiados pedidos. Tenta novamente mais tarde.",
                ),
            );
        },
    });
}

/**
 * Materializa todas as políticas para uma instância da aplicação.
 *
 * Cada nome pode receber um store próprio. Reutilizar a mesma instância entre
 * políticas não é suportado pelo express-rate-limit, pois misturaria quotas.
 *
 * @function createRateLimiters
 * @param {{stores?: Partial<Record<keyof typeof RATE_LIMIT_POLICIES, import("express-rate-limit").Store>>, policies?: typeof RATE_LIMIT_POLICIES}} [options] - Stores e políticas injetáveis.
 * @returns {Record<keyof typeof RATE_LIMIT_POLICIES, import("express").RequestHandler>} Limiters isolados.
 */
export function createRateLimiters({
    stores = {},
    policies = RATE_LIMIT_POLICIES,
} = {}) {
    return Object.fromEntries(
        Object.entries(policies).map(([name, policy]) => [
            name,
            createRateLimiter({ ...policy, store: stores[name] }),
        ]),
    );
}

/**
 * Executa uma política criada pela aplicação depois da autenticação.
 *
 * O fallback sem `req.app` existe apenas para unit tests que invocam um
 * middleware isoladamente. Num pedido Express real, ausência da configuração
 * é tratada como erro interno em vez de desativar silenciosamente a proteção.
 *
 * @function runRateLimitPolicy
 * @param {keyof typeof RATE_LIMIT_POLICIES} policyName - Nome canónico.
 * @param {import("express").Request} req - Pedido atual.
 * @param {import("express").Response} res - Resposta atual.
 * @param {import("express").NextFunction} next - Continuação Express.
 * @returns {unknown} Resultado do limiter ou da continuação.
 */
export function runRateLimitPolicy(policyName, req, res, next) {
    if (!req.app) return next();

    const limiter = req.app.locals.rateLimiters?.[policyName];

    if (typeof limiter !== "function") {
        return next(new Error("Política de rate limiting indisponível"));
    }

    return limiter(req, res, next);
}

/**
 * Cria um middleware nomeado para uma política adicional de uma rota.
 *
 * @function useRateLimitPolicy
 * @param {keyof typeof RATE_LIMIT_POLICIES} policyName - Nome canónico.
 * @returns {import("express").RequestHandler} Middleware Express reutilizável.
 */
export function useRateLimitPolicy(policyName) {
    const middleware = function rateLimitPolicyMiddleware(req, res, next) {
        return runRateLimitPolicy(policyName, req, res, next);
    };

    // Metadata técnica não exposta por HTTP; permite auditar a montagem das
    // rotas sem executar upload ou IA em testes estruturais.
    middleware.rateLimitPolicy = policyName;
    return middleware;
}
