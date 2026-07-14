/**
 * Testes unitarios das sessoes opacas.
 *
 * Nao usam Supertest nem abrem portas: validam entropia, persistencia apenas
 * por hash, TTL e revogacao imediata atraves dos controllers de logout.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    logoutAllController,
    logoutController,
} from "../src/controllers/auth.controller.js";
import { AuthSession } from "../src/models/auth-session.model.js";
import { shouldRevalidateSessionUser } from "../src/middlewares/auth.middleware.js";
import { authRoutes } from "../src/routes/auth.routes.js";
import {
    attachSessionCookie,
    createPersistentSession,
    createSessionToken,
    generateSessionToken,
    hashSessionToken,
    parseSessionTtlMs,
    resetTestSessions,
    revokeAllUserSessions,
    revokeSessionToken,
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../src/services/session.service.js";
import { env } from "../src/config/env.js";

const testUser = Object.freeze({
    id: "66a000000000000000000001",
    email: "cliente@orelle.test",
    role: "cliente",
});

/**
 * Cria a parte da Response Express usada pelos controllers de logout.
 *
 * @function makeResponse
 * @returns {{clearCookie: Function, status: Function, send: Function}} Resposta fake encadeavel.
 */
function makeResponse() {
    const response = {
        clearCookie: vi.fn(),
        status: vi.fn(),
        send: vi.fn(),
    };

    response.status.mockReturnValue(response);
    response.send.mockReturnValue(response);

    return response;
}

describe("ORELLE-AUD-P2-007 - sessoes opacas", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        resetTestSessions();
    });

    it("gera token opaco de 256 bits e hash HMAC sem formato JWT", () => {
        const token = createSessionToken(testUser);
        const tokenHash = hashSessionToken(token);

        expect(Buffer.from(token, "base64url")).toHaveLength(32);
        expect(token).not.toContain(".");
        expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
        expect(tokenHash).not.toContain(token);
        expect(hashSessionToken(token)).toBe(tokenHash);
    });

    it("persiste apenas o hash, datas de controlo e espaco csrfHash", async () => {
        const now = new Date("2026-07-10T09:00:00.000Z");
        const sessionModel = { create: vi.fn().mockResolvedValue({}) };
        const token = await createPersistentSession(testUser, {
            now,
            ttlMs: 60_000,
            sessionModel,
        });
        const persistedSession = sessionModel.create.mock.calls[0][0];

        expect(sessionModel.create).toHaveBeenCalledTimes(1);
        expect(persistedSession).toEqual({
            tokenHash: hashSessionToken(token),
            userId: testUser.id,
            expiresAt: new Date("2026-07-10T09:01:00.000Z"),
            revokedAt: null,
            lastSeenAt: now,
            csrfHash: null,
        });
        expect(JSON.stringify(persistedSession)).not.toContain(token);
    });

    it("usa AuthSession persistida no E2E isolado em vez do adaptador em memoria", async () => {
        const previousE2eIsolated = env.e2eIsolated;
        const createSpy = vi.spyOn(AuthSession, "create").mockResolvedValue({});
        const response = { cookie: vi.fn() };

        try {
            env.e2eIsolated = true;
            await attachSessionCookie(response, testUser);
        } finally {
            env.e2eIsolated = previousE2eIsolated;
        }

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(response.cookie).toHaveBeenCalledWith(
            SESSION_COOKIE_NAME,
            expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
            expect.objectContaining({ httpOnly: true, path: "/" }),
        );
    });

    it("define TTL MongoDB e os campos de revogacao obrigatorios", () => {
        const ttlIndex = AuthSession.schema
            .indexes()
            .find(([fields]) => fields.expiresAt === 1);

        expect(AuthSession.schema.path("tokenHash").options.select).toBe(false);
        expect(AuthSession.schema.path("csrfHash").options.select).toBe(false);
        expect(AuthSession.schema.path("revokedAt")).toBeDefined();
        expect(AuthSession.schema.path("lastSeenAt").isRequired).toBe(true);
        expect(ttlIndex?.[1].expireAfterSeconds).toBe(0);
    });

    it("monta POST /logout-all atras de requireAuth", () => {
        const logoutAllLayer = authRoutes.stack.find(
            (layer) => layer.route?.path === "/logout-all",
        );

        expect(logoutAllLayer?.route?.methods?.post).toBe(true);
        expect(logoutAllLayer.route.stack).toHaveLength(2);
        expect(logoutAllLayer.route.stack[0].name).toBe("requireAuth");
        expect(logoutAllLayer.route.stack[1].name).toBe("logoutAllController");
    });

    it("consulta persistencia com filtros de expiracao/revogacao e atualiza lastSeenAt", async () => {
        const token = generateSessionToken();
        const now = new Date("2026-07-10T09:00:00.000Z");
        const sessionModel = {
            findOneAndUpdate: vi.fn().mockResolvedValue({
                _id: { toString: () => "session-1" },
                userId: { toString: () => testUser.id },
            }),
        };
        const previousNodeEnv = process.env.NODE_ENV;

        try {
            process.env.NODE_ENV = "production";

            await expect(
                verifySessionToken(token, { now, sessionModel }),
            ).resolves.toEqual({
                id: testUser.id,
                sessionId: "session-1",
            });
        } finally {
            process.env.NODE_ENV = previousNodeEnv;
        }

        expect(sessionModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                tokenHash: hashSessionToken(token),
                revokedAt: null,
                expiresAt: { $gt: now },
            },
            { $set: { lastSeenAt: now } },
            { new: true },
        );
    });

    it("persiste revogacao individual e global sem aceitar sessao inexistente", async () => {
        const token = generateSessionToken();
        const now = new Date("2026-07-10T09:00:00.000Z");
        const sessionModel = {
            findOneAndUpdate: vi.fn().mockResolvedValue(null),
            updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            updateMany: vi.fn().mockResolvedValue({ modifiedCount: 3 }),
        };
        const previousNodeEnv = process.env.NODE_ENV;

        try {
            process.env.NODE_ENV = "production";

            await expect(
                verifySessionToken(token, { now, sessionModel }),
            ).rejects.toMatchObject({ statusCode: 401 });
            await expect(
                revokeSessionToken(token, { now, sessionModel }),
            ).resolves.toBe(true);
            await expect(
                revokeAllUserSessions(testUser.id, { now, sessionModel }),
            ).resolves.toBe(3);
        } finally {
            process.env.NODE_ENV = previousNodeEnv;
        }

        expect(sessionModel.updateOne).toHaveBeenCalledWith(
            { tokenHash: hashSessionToken(token), revokedAt: null },
            { $set: { revokedAt: now } },
        );
        expect(sessionModel.updateMany).toHaveBeenCalledWith(
            { userId: testUser.id, revokedAt: null },
            { $set: { revokedAt: now } },
        );
    });

    it("logout revoga imediatamente o cookie atual e e idempotente", async () => {
        const token = createSessionToken(testUser);
        const response = makeResponse();
        const next = vi.fn();

        await expect(verifySessionToken(token)).resolves.toMatchObject({
            id: testUser.id,
        });

        await logoutController(
            { cookies: { [SESSION_COOKIE_NAME]: token } },
            response,
            next,
        );

        expect(next).not.toHaveBeenCalled();
        expect(response.clearCookie).toHaveBeenCalledWith(
            SESSION_COOKIE_NAME,
            expect.objectContaining({ httpOnly: true, path: "/" }),
        );
        expect(response.status).toHaveBeenCalledWith(204);
        await expect(verifySessionToken(token)).rejects.toMatchObject({
            statusCode: 401,
        });

        await logoutController(
            { cookies: { [SESSION_COOKIE_NAME]: token } },
            response,
            next,
        );
        expect(response.status).toHaveBeenLastCalledWith(204);
    });

    it("logout-all revoga todas as sessoes do titular e nao afeta terceiros", async () => {
        const firstToken = createSessionToken(testUser);
        const secondToken = createSessionToken(testUser);
        const otherToken = createSessionToken({
            id: "66a000000000000000000002",
            email: "outra@orelle.test",
            role: "cliente",
        });
        const response = makeResponse();
        const next = vi.fn();

        await logoutAllController({ user: testUser }, response, next);

        expect(next).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(204);
        await expect(verifySessionToken(firstToken)).rejects.toMatchObject({
            statusCode: 401,
        });
        await expect(verifySessionToken(secondToken)).rejects.toMatchObject({
            statusCode: 401,
        });
        await expect(verifySessionToken(otherToken)).resolves.toMatchObject({
            id: "66a000000000000000000002",
        });
    });

    it("recusa uma sessao no instante de expiracao sem esperar pelo monitor TTL", async () => {
        const issuedAt = new Date("2026-07-10T09:00:00.000Z");
        const token = createSessionToken(testUser, {
            now: issuedAt,
            ttlMs: 1_000,
        });

        await expect(
            verifySessionToken(token, {
                now: new Date("2026-07-10T09:00:00.999Z"),
            }),
        ).resolves.toMatchObject({ id: testUser.id });

        await expect(
            verifySessionToken(token, {
                now: new Date("2026-07-10T09:00:01.000Z"),
            }),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("recusa tokens ausentes, malformados e alterados", async () => {
        const token = createSessionToken(testUser);
        const changedLastCharacter = token.endsWith("A") ? "B" : "A";
        const tamperedToken = `${token.slice(0, -1)}${changedLastCharacter}`;

        await expect(verifySessionToken(undefined)).rejects.toMatchObject({
            statusCode: 401,
        });
        await expect(verifySessionToken("nao-e-token-opaco")).rejects.toMatchObject({
            statusCode: 401,
        });
        await expect(verifySessionToken(tamperedToken)).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it("bloqueia o helper sem persistencia fora de NODE_ENV=test", () => {
        const previousNodeEnv = process.env.NODE_ENV;

        try {
            process.env.NODE_ENV = "production";

            expect(() => createSessionToken(testUser)).toThrow(
                "apenas em NODE_ENV=test",
            );
        } finally {
            process.env.NODE_ENV = previousNodeEnv;
        }
    });

    it("normaliza TTL e rejeita configuracoes inseguras", () => {
        expect(parseSessionTtlMs("2h")).toBe(7_200_000);
        expect(parseSessionTtlMs("30m")).toBe(1_800_000);
        expect(parseSessionTtlMs("120")).toBe(120_000);
        expect(() => parseSessionTtlMs("0s")).toThrow("intervalo positivo");
        expect(() => parseSessionTtlMs("duas-horas")).toThrow("ms, s, m, h ou d");
    });

    it("revalida conta apenas no E2E isolado com Mongo pronto", () => {
        const connectedUserModel = {
            findById() {},
            db: { readyState: 1 },
        };
        const disconnectedUserModel = {
            findById() {},
            db: { readyState: 0 },
        };

        expect(
            shouldRevalidateSessionUser({
                nodeEnv: "test",
                e2eIsolated: true,
                userModel: connectedUserModel,
            }),
        ).toBe(true);
        expect(
            shouldRevalidateSessionUser({
                nodeEnv: "test",
                e2eIsolated: false,
                userModel: connectedUserModel,
            }),
        ).toBe(false);
        expect(
            shouldRevalidateSessionUser({
                nodeEnv: "test",
                e2eIsolated: true,
                userModel: disconnectedUserModel,
            }),
        ).toBe(false);
        expect(
            shouldRevalidateSessionUser({
                nodeEnv: "production",
                e2eIsolated: false,
                userModel: disconnectedUserModel,
            }),
        ).toBe(true);
    });
});
