/**
 * Servico de sessoes opacas da API Orelle.
 *
 * O browser recebe um token aleatorio de 256 bits num cookie HttpOnly. O
 * runtime persiste apenas um HMAC desse token em `AuthSession`; o token bruto
 * nunca e guardado na base de dados nem enviado para logs/respostas JSON.
 */
import {
    createHmac,
    randomBytes,
    randomUUID,
    timingSafeEqual,
} from "node:crypto";
import { env, ENVIRONMENT_NAMES } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import { AuthSession } from "../models/auth-session.model.js";

/** @type {number} Entropia do token opaco em bytes (256 bits). */
export const SESSION_TOKEN_BYTES = 32;

/** @type {number} Entropia de cada token CSRF em bytes (256 bits). */
export const CSRF_TOKEN_BYTES = 32;

/** @type {RegExp} Forma base64url exata produzida por 32 bytes aleatorios. */
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** @type {RegExp} Forma base64url exata de um token CSRF valido. */
const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** @type {RegExp} Forma hexadecimal do HMAC persistido na sessao. */
const CSRF_HASH_PATTERN = /^[a-f0-9]{64}$/;

/** @type {number} TTL usado quando SESSION_TTL nao e indicado. */
const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Adaptador em memoria estritamente reservado a `NODE_ENV=test`.
 *
 * A suite historica cria cookies sem MongoDB. Preservamos essa capacidade sem
 * introduzir qualquer fallback no runtime de desenvolvimento/producao. Tal
 * como a colecao real, o mapa usa exclusivamente o hash do token como chave.
 *
 * @type {Map<string, object>}
 */
const testSessionsByHash = new Map();

/** Nome canonico do cookie de sessao. */
export const SESSION_COOKIE_NAME = "orelle_session";

/**
 * Confirma que o adaptador sem persistencia só corre em testes sem E2E real.
 * O E2E isolado usa a coleção `AuthSession` para provar CSRF e revogação.
 *
 * @function isExplicitTestRuntime
 * @returns {boolean} Verdadeiro apenas no teste unitário sem persistência.
 */
function isExplicitTestRuntime() {
    return (
        env.nodeEnv === ENVIRONMENT_NAMES.TEST &&
        process.env.NODE_ENV === ENVIRONMENT_NAMES.TEST &&
        env.e2eIsolated !== true
    );
}

/**
 * Converte SESSION_TTL para milissegundos.
 *
 * Valores sem unidade sao tratados como segundos. Sao suportadas as unidades
 * `ms`, `s`, `m`, `h` e `d`.
 *
 * @function parseSessionTtlMs
 * @param {string|number|undefined} value - TTL configurado.
 * @returns {number} TTL positivo em milissegundos.
 * @throws {Error} Quando o valor e invalido, nulo ou nao finito.
 */
export function parseSessionTtlMs(value = env.sessionTtl) {
    if (typeof value === "number") {
        if (!Number.isFinite(value) || value <= 0) {
            throw new Error("SESSION_TTL deve ser um intervalo positivo");
        }

        return value;
    }

    const normalizedValue = String(value ?? "").trim().toLowerCase();

    if (!normalizedValue) return DEFAULT_SESSION_TTL_MS;

    const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)?$/);

    if (!match) {
        throw new Error("SESSION_TTL deve usar ms, s, m, h ou d");
    }

    const amount = Number(match[1]);
    const multipliers = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    const multiplier = multipliers[match[2] ?? "s"];
    const ttlMs = amount * multiplier;

    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
        throw new Error("SESSION_TTL deve ser um intervalo positivo e seguro");
    }

    return ttlMs;
}

/**
 * Gera uma credencial de sessao opaca com 256 bits de entropia.
 *
 * @function generateSessionToken
 * @returns {string} Token base64url apropriado para cookie.
 */
export function generateSessionToken() {
    return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

/**
 * Gera um token CSRF imprevisivel com 256 bits de entropia.
 *
 * @function generateCsrfToken
 * @returns {string} Token base64url destinado apenas ao cliente autenticado.
 */
export function generateCsrfToken() {
    return randomBytes(CSRF_TOKEN_BYTES).toString("base64url");
}

/**
 * Calcula o identificador persistivel de uma credencial de sessao.
 *
 * SESSION_SECRET funciona como pepper HMAC. A funcao nunca devolve nem inclui
 * o token original no valor persistido.
 *
 * @function hashSessionToken
 * @param {string} token - Token bruto recebido do cookie.
 * @returns {string} HMAC SHA-256 hexadecimal.
 */
export function hashSessionToken(token) {
    return createHmac("sha256", env.sessionSecret)
        .update(String(token))
        .digest("hex");
}

/**
 * Liga o token CSRF a uma sessao e devolve apenas o HMAC persistivel.
 *
 * O prefixo de dominio impede reutilizacao cruzada dos HMACs de sessao e CSRF,
 * apesar de ambos usarem o mesmo segredo de runtime.
 *
 * @function hashCsrfToken
 * @param {unknown} token - Token CSRF bruto.
 * @param {unknown} sessionId - Identificador da sessao titular.
 * @returns {string} HMAC SHA-256 hexadecimal.
 */
export function hashCsrfToken(token, sessionId) {
    return createHmac("sha256", env.sessionSecret)
        .update("orelle-csrf-v1\0")
        .update(String(sessionId ?? ""))
        .update("\0")
        .update(String(token ?? ""))
        .digest("hex");
}

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
        maxAge: parseSessionTtlMs(),
    };
}

/**
 * Constroi as opcoes usadas para limpar o cookie de sessao.
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
 * Normaliza o identificador do utilizador sem copiar dados adicionais.
 *
 * @function getSessionUserId
 * @param {{id?: unknown, _id?: unknown}} user - Utilizador autenticado.
 * @returns {string} Identificador textual.
 * @throws {Error} Quando nao existe identificador.
 */
function getSessionUserId(user) {
    const userId = user?.id ?? user?._id;

    if (!userId) throw new Error("Utilizador obrigatorio para criar sessao");

    return userId.toString();
}

/**
 * Persiste uma nova sessao real e devolve apenas o token para o cookie.
 *
 * Esta funcao nao tem fallback: qualquer falha da base de dados impede o login.
 * A injecao de `sessionModel` existe para testes unitarios sem ligacao externa.
 *
 * @async
 * @function createPersistentSession
 * @param {{id?: unknown, _id?: unknown}} user - Utilizador autenticado.
 * @param {{now?: Date, ttlMs?: number, sessionModel?: typeof AuthSession}} [options] - Relogio/configuracao injetaveis.
 * @returns {Promise<string>} Token bruto destinado exclusivamente ao cookie.
 */
export async function createPersistentSession(user, options = {}) {
    const now = options.now ?? new Date();
    const ttlMs = options.ttlMs ?? parseSessionTtlMs();
    const sessionModel = options.sessionModel ?? AuthSession;
    const token = generateSessionToken();

    await sessionModel.create({
        tokenHash: hashSessionToken(token),
        userId: getSessionUserId(user),
        expiresAt: new Date(now.getTime() + ttlMs),
        revokedAt: null,
        lastSeenAt: now,
        csrfHash: null,
    });

    return token;
}

/**
 * Helper legado para criar cookies na suite sem MongoDB.
 *
 * E deliberadamente bloqueado fora de `NODE_ENV=test`; o runtime usa sempre
 * `createPersistentSession` e nunca confia em identidade guardada no cookie.
 *
 * @function createSessionToken
 * @param {{id?: unknown, _id?: unknown, email?: string, role?: string}} user - Identidade fake de teste.
 * @param {{now?: Date, ttlMs?: number, enforceCsrf?: boolean}} [options] - Relogio/TTL e protecao CSRF do teste.
 * @returns {string} Token opaco registado apenas no adaptador de teste.
 */
export function createSessionToken(user, options = {}) {
    if (!isExplicitTestRuntime()) {
        throw new Error("createSessionToken esta disponivel apenas em NODE_ENV=test");
    }

    const now = options.now ?? new Date();
    const ttlMs = options.ttlMs ?? parseSessionTtlMs();
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);

    testSessionsByHash.set(tokenHash, {
        id: randomUUID(),
        userId: getSessionUserId(user),
        email: user.email,
        role: user.role,
        expiresAt: new Date(now.getTime() + ttlMs),
        revokedAt: null,
        lastSeenAt: now,
        csrfHash: null,
        // Compatibilidade estritamente test-only: suites historicas anteriores
        // ao contrato CSRF continuam isoladas. Novos testes de seguranca usam
        // `enforceCsrf: true`; sessoes reais nunca recebem este marcador.
        csrfProtectionRequired: options.enforceCsrf === true,
    });

    return token;
}

/**
 * Resolve uma query Mongoose ou um mock Promise-like de forma uniforme.
 *
 * @async
 * @function resolveSessionQuery
 * @param {unknown} query - Query devolvida pelo modelo.
 * @returns {Promise<unknown>} Documento lean ou mock resolvido.
 */
async function resolveSessionQuery(
    query,
    selection = "_id userId expiresAt lastSeenAt",
) {
    let normalizedQuery = query;

    if (typeof normalizedQuery?.select === "function") {
        normalizedQuery = normalizedQuery.select(selection);
    }

    if (typeof normalizedQuery?.lean === "function") {
        normalizedQuery = normalizedQuery.lean();
    }

    return normalizedQuery;
}

/**
 * Valida uma sessao opaca, recusando revogadas e expiradas imediatamente.
 *
 * Em runtime, a consulta atomica tambem atualiza `lastSeenAt`. Em testes
 * historicos sem MongoDB, usa o adaptador explicitamente limitado a test.
 *
 * @async
 * @function verifySessionToken
 * @param {string} token - Credencial recebida do cookie.
 * @param {{now?: Date, sessionModel?: typeof AuthSession}} [options] - Dependencias injetaveis.
 * @returns {Promise<{id: string, email?: string, role?: string, sessionId: string, csrfProtectionRequired?: boolean}>} Identidade minima da sessao.
 * @throws {AppError} Quando a sessao nao existe, expirou ou foi revogada.
 */
export async function verifySessionToken(token, options = {}) {
    if (!SESSION_TOKEN_PATTERN.test(String(token ?? ""))) {
        throw new AppError(401, "Sessão inválida ou expirada");
    }

    const now = options.now ?? new Date();
    const tokenHash = hashSessionToken(token);

    if (isExplicitTestRuntime()) {
        const session = testSessionsByHash.get(tokenHash);

        if (
            !session ||
            session.revokedAt ||
            session.expiresAt.getTime() <= now.getTime()
        ) {
            throw new AppError(401, "Sessão inválida ou expirada");
        }

        session.lastSeenAt = now;

        return {
            id: session.userId,
            email: session.email,
            role: session.role,
            sessionId: session.id,
            csrfProtectionRequired: session.csrfProtectionRequired,
        };
    }

    const sessionModel = options.sessionModel ?? AuthSession;
    const sessionQuery = sessionModel.findOneAndUpdate(
        {
            tokenHash,
            revokedAt: null,
            expiresAt: { $gt: now },
        },
        { $set: { lastSeenAt: now } },
        { new: true },
    );
    const session = await resolveSessionQuery(sessionQuery);

    if (!session) {
        throw new AppError(401, "Sessão inválida ou expirada");
    }

    return {
        id: session.userId.toString(),
        sessionId: session._id.toString(),
    };
}

/**
 * Decide se uma sessao deve cumprir o contrato CSRF.
 *
 * O marcador `false` apenas e reconhecido quando o processo e o ambiente
 * normalizado sao ambos `test`. Em desenvolvimento/producao, inclusive perante
 * metadata forjada internamente, a protecao continua obrigatoria.
 *
 * @function isCsrfProtectionRequiredForSession
 * @param {{csrfProtectionRequired?: boolean}|undefined} sessionMetadata - Metadata interna da sessao.
 * @returns {boolean} Verdadeiro para todas as sessoes de runtime.
 */
export function isCsrfProtectionRequiredForSession(sessionMetadata) {
    return !(
        isExplicitTestRuntime() &&
        sessionMetadata?.csrfProtectionRequired === false
    );
}

/**
 * Procura uma sessao no adaptador test-only pelo identificador interno.
 *
 * @function findActiveTestSessionById
 * @param {string} sessionId - ID interno da sessao.
 * @param {Date} now - Instante da operacao.
 * @returns {object|null} Sessao ativa ou null.
 */
function findActiveTestSessionById(sessionId, now) {
    for (const session of testSessionsByHash.values()) {
        if (
            session.id === sessionId &&
            !session.revokedAt &&
            session.expiresAt.getTime() > now.getTime()
        ) {
            return session;
        }
    }

    return null;
}

/**
 * Constroi o filtro comum de uma sessao persistida ativa.
 *
 * @function buildActiveSessionFilter
 * @param {string} sessionId - ID interno da sessao.
 * @param {Date} now - Instante da operacao.
 * @returns {object} Filtro MongoDB sem qualquer credencial bruta.
 */
function buildActiveSessionFilter(sessionId, now) {
    return {
        _id: sessionId,
        revokedAt: null,
        expiresAt: { $gt: now },
    };
}

/**
 * Emite e persiste um novo token CSRF para a sessao autenticada.
 *
 * Apenas o HMAC ligado ao ID da sessao e guardado. Uma nova emissao roda o
 * token anterior, reduzindo a janela de reutilizacao de valores expostos.
 *
 * @async
 * @function issueCsrfTokenForSession
 * @param {unknown} sessionId - ID interno obtido por `requireAuth`.
 * @param {{now?: Date, sessionModel?: typeof AuthSession}} [options] - Dependencias injetaveis.
 * @returns {Promise<string>} Token bruto devolvido uma unica vez ao cliente.
 * @throws {AppError} Quando a sessao deixou de estar ativa.
 */
export async function issueCsrfTokenForSession(sessionId, options = {}) {
    const normalizedSessionId = String(sessionId ?? "").trim();

    if (!normalizedSessionId) {
        throw new AppError(401, "Sessao invalida ou expirada");
    }

    const now = options.now ?? new Date();
    const token = generateCsrfToken();
    const csrfHash = hashCsrfToken(token, normalizedSessionId);

    if (isExplicitTestRuntime() && !options.sessionModel) {
        const session = findActiveTestSessionById(normalizedSessionId, now);

        if (!session) throw new AppError(401, "Sessao invalida ou expirada");

        session.csrfHash = csrfHash;
        return token;
    }

    const sessionModel = options.sessionModel ?? AuthSession;
    const result = await sessionModel.updateOne(
        buildActiveSessionFilter(normalizedSessionId, now),
        { $set: { csrfHash } },
    );
    const matchedCount = result.matchedCount ?? result.n ?? result.modifiedCount ?? 0;

    if (matchedCount < 1) {
        throw new AppError(401, "Sessao invalida ou expirada");
    }

    return token;
}

/**
 * Compara um token candidato com o HMAC persistido em tempo constante.
 *
 * Mesmo valores ausentes/malformados percorrem `timingSafeEqual` usando um
 * buffer neutro do mesmo tamanho. A decisao final continua a exigir as formas
 * canonicas, sem distinguir publicamente o motivo da recusa.
 *
 * @function isCsrfTokenHashMatch
 * @param {unknown} token - Token recebido no header.
 * @param {unknown} storedHash - HMAC lido da sessao.
 * @param {string} sessionId - ID interno da sessao.
 * @returns {boolean} Verdadeiro apenas para token e hash validos/coincidentes.
 */
function isCsrfTokenHashMatch(token, storedHash, sessionId) {
    const normalizedToken = String(token ?? "");
    const normalizedStoredHash = String(storedHash ?? "");
    const candidateBuffer = Buffer.from(
        hashCsrfToken(normalizedToken, sessionId),
        "hex",
    );
    const storedBuffer = CSRF_HASH_PATTERN.test(normalizedStoredHash)
        ? Buffer.from(normalizedStoredHash, "hex")
        : Buffer.alloc(candidateBuffer.length);
    const hashesMatch = timingSafeEqual(candidateBuffer, storedBuffer);

    return (
        CSRF_TOKEN_PATTERN.test(normalizedToken) &&
        CSRF_HASH_PATTERN.test(normalizedStoredHash) &&
        hashesMatch
    );
}

/**
 * Valida o token CSRF da mutacao contra a sessao ativa.
 *
 * @async
 * @function verifyCsrfTokenForSession
 * @param {unknown} sessionId - ID interno obtido por `requireAuth`.
 * @param {unknown} token - Valor recebido em `X-CSRF-Token`.
 * @param {{now?: Date, sessionModel?: typeof AuthSession}} [options] - Dependencias injetaveis.
 * @returns {Promise<true>} Confirmacao sem devolver o hash persistido.
 * @throws {AppError} Quando a sessao expirou ou o token nao coincide.
 */
export async function verifyCsrfTokenForSession(
    sessionId,
    token,
    options = {},
) {
    const normalizedSessionId = String(sessionId ?? "").trim();

    if (!normalizedSessionId) {
        throw new AppError(401, "Sessao invalida ou expirada");
    }

    const now = options.now ?? new Date();
    let session;

    if (isExplicitTestRuntime() && !options.sessionModel) {
        session = findActiveTestSessionById(normalizedSessionId, now);
    } else {
        const sessionModel = options.sessionModel ?? AuthSession;
        session = await resolveSessionQuery(
            sessionModel.findOne(
                buildActiveSessionFilter(normalizedSessionId, now),
            ),
            "+csrfHash",
        );
    }

    if (!session) throw new AppError(401, "Sessao invalida ou expirada");

    if (!isCsrfTokenHashMatch(token, session.csrfHash, normalizedSessionId)) {
        throw new AppError(403, "Token CSRF invalido");
    }

    return true;
}

/**
 * Revoga a sessao representada pelo cookie, de forma idempotente.
 *
 * Tokens ausentes ou malformados nao provocam consultas e sao tratados como
 * sessoes ja terminadas, permitindo um logout seguro e repetivel.
 *
 * @async
 * @function revokeSessionToken
 * @param {string|undefined} token - Token do cookie.
 * @param {{now?: Date, sessionModel?: typeof AuthSession}} [options] - Dependencias injetaveis.
 * @returns {Promise<boolean>} Verdadeiro quando uma sessao ativa foi revogada.
 */
export async function revokeSessionToken(token, options = {}) {
    if (!SESSION_TOKEN_PATTERN.test(String(token ?? ""))) return false;

    const now = options.now ?? new Date();
    const tokenHash = hashSessionToken(token);

    if (isExplicitTestRuntime()) {
        const session = testSessionsByHash.get(tokenHash);

        if (!session || session.revokedAt) return false;

        session.revokedAt = now;
        return true;
    }

    const sessionModel = options.sessionModel ?? AuthSession;
    const result = await sessionModel.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: now } },
    );

    return (result.modifiedCount ?? result.nModified ?? 0) > 0;
}

/**
 * Revoga todas as sessoes do utilizador autenticado.
 *
 * @async
 * @function revokeAllUserSessions
 * @param {string} userId - Titular das sessoes.
 * @param {{now?: Date, sessionModel?: typeof AuthSession}} [options] - Dependencias injetaveis.
 * @returns {Promise<number>} Numero de sessoes revogadas.
 */
export async function revokeAllUserSessions(userId, options = {}) {
    const normalizedUserId = String(userId ?? "").trim();

    if (!normalizedUserId) throw new Error("userId obrigatorio para logout-all");

    const now = options.now ?? new Date();

    if (isExplicitTestRuntime()) {
        let revokedCount = 0;

        for (const session of testSessionsByHash.values()) {
            if (session.userId !== normalizedUserId || session.revokedAt) continue;

            session.revokedAt = now;
            revokedCount += 1;
        }

        return revokedCount;
    }

    const sessionModel = options.sessionModel ?? AuthSession;
    const result = await sessionModel.updateMany(
        { userId: normalizedUserId, revokedAt: null },
        { $set: { revokedAt: now } },
    );

    return result.modifiedCount ?? result.nModified ?? 0;
}

/**
 * Escreve o cookie HttpOnly depois de a sessao estar persistida.
 *
 * @async
 * @function attachSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @param {{id?: unknown, _id?: unknown, email?: string, role?: string}} user - Utilizador autenticado.
 * @returns {Promise<void>}
 */
export async function attachSessionCookie(res, user) {
    const token = isExplicitTestRuntime()
        ? createSessionToken(user)
        : await createPersistentSession(user);

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

/**
 * Limpa o adaptador de sessoes entre testes unitarios.
 *
 * @function resetTestSessions
 * @returns {void}
 */
export function resetTestSessions() {
    if (!isExplicitTestRuntime()) {
        throw new Error("resetTestSessions esta disponivel apenas em NODE_ENV=test");
    }

    testSessionsByHash.clear();
}
