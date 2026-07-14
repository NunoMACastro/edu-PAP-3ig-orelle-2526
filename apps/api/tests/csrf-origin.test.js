/**
 * Testes focais do contrato CSRF/Origin da auditoria G1.
 *
 * Exercitam emissao por sessao, persistencia exclusiva do HMAC, rejeicoes de
 * origem/token e o unico adaptador de compatibilidade reservado a unit tests.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import {
    normalizeAllowedOrigins,
    normalizeConfiguredOrigin,
} from "../src/middlewares/csrf.middleware.js";
import {
    createSessionToken,
    hashCsrfToken,
    isCsrfProtectionRequiredForSession,
    issueCsrfTokenForSession,
    resetTestSessions,
    verifyCsrfTokenForSession,
} from "../src/services/session.service.js";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";
const TEST_USER = Object.freeze({
    id: "66a000000000000000000001",
    email: "cliente@orelle.test",
    role: "cliente",
});

/**
 * Cria uma app com allowlist local explicita e uma sessao que exige CSRF.
 *
 * @function createProtectedContext
 * @returns {{app: import("express").Express, sessionToken: string}} Contexto HTTP isolado.
 */
function createProtectedContext() {
    return {
        app: createApp({ allowedOrigins: [LOCAL_ORIGIN] }),
        sessionToken: createSessionToken(TEST_USER, { enforceCsrf: true }),
    };
}

/**
 * Emite um token CSRF pelo endpoint publico do contrato autenticado.
 *
 * @async
 * @function fetchCsrfToken
 * @param {import("express").Express} app - App em teste.
 * @param {string} sessionToken - Cookie opaco test-only.
 * @returns {Promise<string>} Token CSRF devolvido pela API.
 */
async function fetchCsrfToken(app, sessionToken) {
    const response = await request(app)
        .get("/api/auth/csrf")
        .set("Cookie", [`orelle_session=${sessionToken}`]);

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers.pragma).toBe("no-cache");
    expect(response.body.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    return response.body.csrfToken;
}

describe("ORELLE-AUD-P2-007 - CSRF e Origin", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        resetTestSessions();
    });

    it("normaliza apenas origens exatas e restringe HTTP ao loopback", () => {
        expect(
            normalizeAllowedOrigins([
                "http://localhost:5173",
                "http://localhost:5173/",
                "https://app.orelle.test",
            ]),
        ).toEqual(["http://localhost:5173", "https://app.orelle.test"]);
        expect(() => normalizeConfiguredOrigin("*")).toThrow("explicita");
        expect(() => normalizeConfiguredOrigin("null")).toThrow("explicita");
        expect(() =>
            normalizeConfiguredOrigin("https://user:pass@app.orelle.test"),
        ).toThrow("scheme, host e port");
        expect(() =>
            normalizeConfiguredOrigin("https://app.orelle.test/path"),
        ).toThrow("scheme, host e port");
        expect(() => normalizeConfiguredOrigin("http://app.orelle.test")).toThrow(
            "HTTP remotas",
        );
        expect(() => normalizeAllowedOrigins([])).toThrow("Pelo menos uma");
    });

    it("emite 256 bits e persiste apenas o HMAC ligado a sessao", async () => {
        const sessionId = "66b000000000000000000001";
        const now = new Date("2026-07-10T10:00:00.000Z");
        const sessionModel = {
            updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
        };

        const csrfToken = await issueCsrfTokenForSession(sessionId, {
            now,
            sessionModel,
        });
        const [filter, update] = sessionModel.updateOne.mock.calls[0];

        expect(Buffer.from(csrfToken, "base64url")).toHaveLength(32);
        expect(filter).toEqual({
            _id: sessionId,
            revokedAt: null,
            expiresAt: { $gt: now },
        });
        expect(update).toEqual({
            $set: { csrfHash: hashCsrfToken(csrfToken, sessionId) },
        });
        expect(update.$set.csrfHash).toMatch(/^[a-f0-9]{64}$/);
        expect(JSON.stringify(update)).not.toContain(csrfToken);
    });

    it("valida o HMAC da sessao e recusa candidatos ausentes ou alterados", async () => {
        const sessionId = "66b000000000000000000001";
        const csrfToken = "a".repeat(43);
        const sessionModel = {
            findOne: vi.fn().mockResolvedValue({
                csrfHash: hashCsrfToken(csrfToken, sessionId),
            }),
        };

        await expect(
            verifyCsrfTokenForSession(sessionId, csrfToken, { sessionModel }),
        ).resolves.toBe(true);
        await expect(
            verifyCsrfTokenForSession(sessionId, "b".repeat(43), {
                sessionModel,
            }),
        ).rejects.toMatchObject({ statusCode: 403 });
        await expect(
            verifyCsrfTokenForSession(sessionId, undefined, { sessionModel }),
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("exige sessao no GET /api/auth/csrf e nunca coloca o token em cookie", async () => {
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const withoutSession = await request(app).get("/api/auth/csrf");

        expect(withoutSession.status).toBe(401);

        const sessionToken = createSessionToken(TEST_USER, { enforceCsrf: true });
        const response = await request(app)
            .get("/api/auth/csrf")
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"]).toBeUndefined();
        expect(response.body).toEqual({
            csrfToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        });
    });

    it("rejeita mutacao autenticada sem Origin ou com Origin fora da allowlist", async () => {
        const { app, sessionToken } = createProtectedContext();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const missingOrigin = await request(app)
            .post("/api/auth/logout-all")
            .set("Cookie", [`orelle_session=${sessionToken}`])
            .set("X-CSRF-Token", csrfToken);
        const invalidOrigin = await request(app)
            .post("/api/auth/logout-all")
            .set("Cookie", [`orelle_session=${sessionToken}`])
            .set("Origin", "https://evil.example")
            .set("X-CSRF-Token", csrfToken);

        expect(missingOrigin.status).toBe(403);
        expect(missingOrigin.body.error.message).toBe(
            "Origem do pedido nao autorizada",
        );
        expect(invalidOrigin.status).toBe(403);
        expect(invalidOrigin.body.error.message).toBe(
            "Origem do pedido nao autorizada",
        );
    });

    it("rejeita token ausente, alterado e emitido para outra sessao", async () => {
        const { app, sessionToken } = createProtectedContext();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const otherSessionToken = createSessionToken(
            { ...TEST_USER, id: "66a000000000000000000002" },
            { enforceCsrf: true },
        );
        const otherCsrfToken = await fetchCsrfToken(app, otherSessionToken);
        const baseRequest = () =>
            request(app)
                .post("/api/auth/logout-all")
                .set("Cookie", [`orelle_session=${sessionToken}`])
                .set("Origin", LOCAL_ORIGIN);

        const missingToken = await baseRequest();
        const changedToken = await baseRequest().set(
            "X-CSRF-Token",
            `${csrfToken.slice(0, -1)}${csrfToken.endsWith("A") ? "B" : "A"}`,
        );
        const crossSessionToken = await baseRequest().set(
            "X-CSRF-Token",
            otherCsrfToken,
        );

        expect(missingToken.status).toBe(403);
        expect(changedToken.status).toBe(403);
        expect(crossSessionToken.status).toBe(403);
        expect(missingToken.body.error.message).toBe("Token CSRF invalido");
    });

    it("aceita token e Origin validos e revoga todas as sessoes", async () => {
        const { app, sessionToken } = createProtectedContext();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const response = await request(app)
            .post("/api/auth/logout-all")
            .set("Cookie", [`orelle_session=${sessionToken}`])
            .set("Origin", LOCAL_ORIGIN)
            .set("X-CSRF-Token", csrfToken);

        expect(response.status).toBe(204);
        expect(response.headers["set-cookie"].join(";")).toContain(
            "orelle_session=",
        );

        const afterLogout = await request(app)
            .get("/api/auth/me")
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(afterLogout.status).toBe(401);
    });

    it("mantem login, registo e health fora da exigencia CSRF", async () => {
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const health = await request(app).get("/api/health/live");
        const login = await request(app).post("/api/auth/login").send({});
        const registration = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(health.status).toBe(200);
        expect(login.status).not.toBe(403);
        expect(registration.status).not.toBe(403);
    });

    it("limita a compatibilidade historica ao helper test-only", async () => {
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const legacyTestToken = createSessionToken(TEST_USER);
        const testOnlyLogout = await request(app)
            .post("/api/auth/logout")
            .set("Cookie", [`orelle_session=${legacyTestToken}`]);

        expect(testOnlyLogout.status).toBe(204);

        const previousNodeEnv = process.env.NODE_ENV;

        try {
            process.env.NODE_ENV = "production";
            expect(
                isCsrfProtectionRequiredForSession({
                    csrfProtectionRequired: false,
                }),
            ).toBe(true);
        } finally {
            process.env.NODE_ENV = previousNodeEnv;
        }
    });
});
