/**
 * Testes focais de headers, proxy allowlist e quotas HTTP da G1.
 *
 * Não usam MongoDB nem providers externos. As políticas são criadas por teste,
 * assegurando contadores determinísticos e sem estado residual entre casos.
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import {
    env,
    parseTrustedProxyCidrs,
} from "../src/config/env.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";
import {
    createRateLimiter,
    createRateLimiters,
    getRateLimitIdentity,
    RATE_LIMIT_POLICIES,
} from "../src/middlewares/rate-limit.middleware.js";
import { aiConsultationRoutes } from "../src/routes/ai-consultation.routes.js";
import { facePhotoRoutes } from "../src/routes/face-photo.routes.js";
import { makeupSimulationRoutes } from "../src/routes/makeup-simulation.routes.js";
import {
    createSessionToken,
    resetTestSessions,
} from "../src/services/session.service.js";

/**
 * Cria uma app mínima para testar uma política sem executar regras de negócio.
 *
 * @function createLimiterTestApp
 * @param {import("express").RequestHandler} limiter - Limiter sob teste.
 * @param {{authenticated?: boolean, trustProxy?: boolean}} [options] - Contexto do pedido.
 * @returns {import("express").Express} Aplicação isolada.
 */
function createLimiterTestApp(
    limiter,
    { authenticated = false, trustProxy = false } = {},
) {
    const app = express();
    app.set("trust proxy", trustProxy);
    app.use((req, res, next) => {
        req.requestId = "rate-limit-test";

        if (authenticated) {
            req.user = { id: req.get("x-test-user") };
        }

        next();
    });
    app.post("/limited", limiter, (req, res) => res.status(204).send());
    app.use(errorMiddleware);
    return app;
}

/**
 * Localiza uma rota Express pelo path público.
 *
 * @function findRouteLayer
 * @param {import("express").Router} router - Router a inspecionar.
 * @param {string} routePath - Path registado.
 * @returns {object} Layer da rota.
 */
function findRouteLayer(router, routePath) {
    return router.stack.find((layer) => layer.route?.path === routePath);
}

describe("G1 - headers, proxy e rate limits", () => {
    const originalForceHttps = env.forceHttps;

    beforeEach(() => {
        resetTestSessions();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        env.forceHttps = originalForceHttps;
        vi.restoreAllMocks();
    });

    it("mantém os cinco contratos exatos de quota", () => {
        expect(RATE_LIMIT_POLICIES).toEqual({
            login: {
                identifier: "auth-login",
                limit: 5,
                windowMs: 15 * 60 * 1000,
            },
            register: {
                identifier: "auth-register",
                limit: 3,
                windowMs: 60 * 60 * 1000,
            },
            authenticated: {
                identifier: "api-authenticated",
                limit: 120,
                windowMs: 60 * 1000,
            },
            upload: {
                identifier: "face-upload",
                limit: 5,
                windowMs: 60 * 60 * 1000,
            },
            ai: {
                identifier: "ai-generation",
                limit: 60,
                windowMs: 24 * 60 * 60 * 1000,
            },
        });
    });

    it("a quota IA deixa concluir três consultas máximas na mesma janela", async () => {
        const limiter = createRateLimiter(RATE_LIMIT_POLICIES.ai);
        const app = createLimiterTestApp(limiter, { authenticated: true });

        // Criação + análise + oito respostas + submissão = 11 mutações IA.
        // Três consultas completas precisam de 33 pedidos antes de qualquer
        // retry técnico ou manual.
        for (let requestIndex = 0; requestIndex < 33; requestIndex += 1) {
            const response = await request(app)
                .post("/limited")
                .set("x-test-user", "three-consultations-user");
            expect(response.status).toBe(204);
        }

        for (let requestIndex = 33; requestIndex < 60; requestIndex += 1) {
            const response = await request(app)
                .post("/limited")
                .set("x-test-user", "three-consultations-user");
            expect(response.status).toBe(204);
        }
        const blocked = await request(app)
            .post("/limited")
            .set("x-test-user", "three-consultations-user");
        expect(blocked.status).toBe(429);
    });

    it("aceita apenas allowlists explícitas de IP/CIDR", () => {
        expect(
            parseTrustedProxyCidrs(
                "127.0.0.1/32, ::1/128,127.0.0.1/32",
            ),
        ).toEqual(["127.0.0.1/32", "::1/128"]);
        expect(parseTrustedProxyCidrs(undefined)).toEqual([]);

        for (const unsafeValue of ["true", "1", "*", "loopback", "10.0.0.0/99"]) {
            expect(() => parseTrustedProxyCidrs(unsafeValue)).toThrow();
        }
    });

    it("prefere utilizador autenticado e normaliza IPv6 no fallback público", () => {
        expect(
            getRateLimitIdentity({
                user: { id: "user-1" },
                ip: "2001:db8:1234:5678::1",
            }),
        ).toBe("user:user-1");

        expect(
            getRateLimitIdentity({ ip: "2001:db8:1234:5678::1" }),
        ).toBe("ip:2001:db8:1234:5600::/56");
    });

    it("bloqueia após a quota, envia Retry-After e não reflete dados do pedido", async () => {
        const limiter = createRateLimiter({
            identifier: "deterministic-test",
            limit: 2,
            windowMs: 60 * 1000,
        });
        const app = createLimiterTestApp(limiter);

        expect((await request(app).post("/limited")).status).toBe(204);
        expect((await request(app).post("/limited")).status).toBe(204);

        const blocked = await request(app)
            .post("/limited")
            .set("authorization", "Bearer segredo-nao-refletir")
            .send({ password: "nao-refletir" });

        expect(blocked.status).toBe(429);
        expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
        expect(blocked.headers.ratelimit).toContain("deterministic-test");
        expect(blocked.body).toEqual({
            error: {
                message: "Demasiados pedidos. Tenta novamente mais tarde.",
                requestId: "rate-limit-test",
            },
        });
        expect(JSON.stringify(blocked.body)).not.toContain("segredo");
        expect(JSON.stringify(blocked.body)).not.toContain("password");
    });

    it("não permite contornar a quota pública rodando X-Forwarded-For", async () => {
        const limiter = createRateLimiter({
            identifier: "proxy-spoof-test",
            limit: 2,
            windowMs: 60 * 1000,
        });
        const app = createLimiterTestApp(limiter);

        expect(
            (await request(app).post("/limited").set("x-forwarded-for", "198.51.100.1"))
                .status,
        ).toBe(204);
        expect(
            (await request(app).post("/limited").set("x-forwarded-for", "198.51.100.2"))
                .status,
        ).toBe(204);
        expect(
            (await request(app).post("/limited").set("x-forwarded-for", "198.51.100.3"))
                .status,
        ).toBe(429);
    });

    it("isola a quota autenticada por utilizador mesmo no mesmo IP", async () => {
        const rateLimiters = createRateLimiters({
            policies: {
                ...RATE_LIMIT_POLICIES,
                authenticated: {
                    ...RATE_LIMIT_POLICIES.authenticated,
                    limit: 2,
                },
            },
        });
        const app = createApp({ rateLimiters });
        const firstToken = createSessionToken({
            id: "user-a",
            email: "a@orelle.test",
            role: "cliente",
        });
        const secondToken = createSessionToken({
            id: "user-b",
            email: "b@orelle.test",
            role: "cliente",
        });
        const firstCookie = `orelle_session=${firstToken}`;
        const secondCookie = `orelle_session=${secondToken}`;

        expect(
            (await request(app).get("/api/auth/me").set("Cookie", firstCookie))
                .status,
        ).toBe(200);
        expect(
            (await request(app).get("/api/auth/me").set("Cookie", firstCookie))
                .status,
        ).toBe(200);
        expect(
            (await request(app).get("/api/auth/me").set("Cookie", firstCookie))
                .status,
        ).toBe(429);
        expect(
            (await request(app).get("/api/auth/me").set("Cookie", secondCookie))
                .status,
        ).toBe(200);
    });

    it("monta upload e operações canónicas IA depois de requireAuth", () => {
        const uploadRoute = findRouteLayer(facePhotoRoutes, "/face-photos");
        const aiMutationPaths = [
            "/ai-consultation/sessions",
            "/ai-consultation/sessions/:sessionId/analysis",
            "/ai-consultation/sessions/:sessionId/answers",
            "/ai-consultation/sessions/:sessionId/submit",
            "/ai-consultation/sessions/:sessionId/retry",
        ];

        expect(uploadRoute.route.stack[0].name).toBe("requireAuth");
        expect(uploadRoute.route.stack[1].handle.rateLimitPolicy).toBe("upload");
        for (const routePath of aiMutationPaths) {
            const route = findRouteLayer(aiConsultationRoutes, routePath);
            expect(route.route.stack[0].name).toBe("requireAuth");
            expect(route.route.stack[1].handle.rateLimitPolicy).toBe("ai");
        }
        const makeupRoute = findRouteLayer(
            makeupSimulationRoutes,
            "/face-reports/:reportId/makeup-simulations",
        );
        expect(makeupRoute.route.stack[0].name).toBe("requireAuth");
        expect(makeupRoute.route.stack[1].handle.rateLimitPolicy).toBe("ai");
    });

    it("aplica os limites públicos exatos de login e registo", async () => {
        const app = createApp();

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const response = await request(app).post("/api/auth/login").send({});
            expect(response.status).toBe(400);
        }

        const blockedLogin = await request(app).post("/api/auth/login").send({});
        expect(blockedLogin.status).toBe(429);

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const response = await request(app).post("/api/auth/register").send({});
            expect(response.status).toBe(400);
        }

        const blockedRegister = await request(app)
            .post("/api/auth/register")
            .send({});
        expect(blockedRegister.status).toBe(429);
    });

    it("Helmet protege JSON e health não atravessa qualquer limiter", async () => {
        const rateLimiters = {
            login: vi.fn((req, res, next) => next()),
            register: vi.fn((req, res, next) => next()),
            authenticated: vi.fn((req, res, next) => next()),
            upload: vi.fn((req, res, next) => next()),
            ai: vi.fn((req, res, next) => next()),
        };
        const response = await request(createApp({ rateLimiters })).get(
            "/api/health/live",
        );

        expect(response.status).toBe(200);
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(response.headers["referrer-policy"]).toBe("no-referrer");
        expect(response.headers["x-powered-by"]).toBeUndefined();
        expect(response.headers.ratelimit).toBeUndefined();
        expect(Object.values(rateLimiters).every((mock) => mock.mock.calls.length === 0))
            .toBe(true);
    });

    it("X-Forwarded-Proto não contorna HTTPS sem proxy autorizado", async () => {
        env.forceHttps = true;

        const spoofed = await request(createApp({ trustedProxies: [] }))
            .get("/api/health")
            .set("x-forwarded-proto", "https");
        const trusted = await request(
            createApp({
                trustedProxies: ["127.0.0.0/8", "::1/128"],
            }),
        )
            .get("/api/health")
            .set("x-forwarded-proto", "https");

        expect(spoofed.status).toBe(426);
        expect(spoofed.headers["strict-transport-security"]).toBeUndefined();
        expect(trusted.status).toBe(200);
        expect(trusted.headers["strict-transport-security"]).toContain(
            "max-age=15552000",
        );
    });
});
