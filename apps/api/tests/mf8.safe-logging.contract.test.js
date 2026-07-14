/**
 * Testes MF8/BK-MF8-02 para logs seguros e metricas minimizadas.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { AppError, errorMiddleware } from "../src/middlewares/error.middleware.js";
import {
    requestContextMiddleware,
    requestMetricsMiddleware,
} from "../src/middlewares/request-observability.middleware.js";
import {
    recordHttpRequestMetric,
    shouldRecordHttpMetric,
} from "../src/services/observability.service.js";

const mocks = vi.hoisted(() => ({
    metricCreate: vi.fn(),
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: mocks.metricCreate,
    },
}));

/**
 * Cria uma app minima para forcar erros controlados.
 *
 * @function createFailingApp
 * @param {Error} error - Erro a enviar para o middleware.
 * @returns {import("express").Express} App Express de teste.
 */
function createFailingApp(error) {
    const app = express();

    app.use(requestContextMiddleware);
    app.use(requestMetricsMiddleware);
    app.get("/api/mf8-error/:id", (req, res, next) => {
        // A rota contem um ID para provar que logs e metricas normalizam identificadores reais.
        next(error);
    });
    app.use(errorMiddleware);

    return app;
}

/**
 * Le a ultima entrada escrita em console.error durante o teste.
 *
 * @function readLastLog
 * @param {ReturnType<typeof vi.spyOn>} spy - Espiao de console.error.
 * @returns {Record<string, unknown>} Entrada de log convertida de JSON.
 */
function readLastLog(spy) {
    const lastCall = spy.mock.calls.at(-1)?.[0] ?? "{}";

    return JSON.parse(lastCall);
}

beforeEach(() => {
    mocks.metricCreate.mockReset();
});

describe("BK-MF8-02 - logs seguros e metricas", () => {
    it("sanitiza detalhes publicos e escreve log sem dados sensiveis", async () => {
        const logSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        try {
            const app = createFailingApp(
                new AppError(400, "Dados invalidos", {
                    field: "nome",
                    cookie: "orelle_session=abc",
                    imagePath: "/private/uploads/frontal.png",
                    token: "Bearer segredo",
                }),
            );

            const response = await request(app)
                .get("/api/mf8-error/66a000000000000000000001")
                .set("Cookie", "orelle_session=valor-sensivel");

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe("Dados invalidos");
            expect(response.body.error.requestId).toEqual(expect.any(String));
            expect(response.body.error.details).toEqual({
                field: "nome",
                cookie: "[redigido]",
                imagePath: "[redigido]",
                token: "[redigido]",
            });

            const responseText = JSON.stringify(response.body);
            expect(responseText).not.toContain("orelle_session=abc");
            expect(responseText).not.toContain("/private/uploads/frontal.png");
            expect(responseText).not.toContain("Bearer segredo");

            const safeLog = readLastLog(logSpy);
            expect(safeLog).toMatchObject({
                event: "api_error",
                method: "GET",
                route: "/api/mf8-error/:id",
                statusCode: 400,
                message: "Dados invalidos",
            });
            expect(JSON.stringify(safeLog)).not.toContain("orelle_session");
            expect(JSON.stringify(safeLog)).not.toContain("/private");
            expect(JSON.stringify(safeLog)).not.toContain("Bearer");
        } finally {
            logSpy.mockRestore();
        }
    });

    it("mantem erros internos genericos para frontend e log", async () => {
        const logSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        try {
            const app = createFailingApp(
                new Error("Falha em /srv/orelle/internal/token.txt"),
            );

            const response = await request(app).get(
                "/api/mf8-error/66a000000000000000000002",
            );

            expect(response.status).toBe(500);
            expect(response.body.error.message).toBe("Erro interno do servidor");
            expect(response.body.error.requestId).toEqual(expect.any(String));
            expect(response.body.error.details).toBeUndefined();
            expect(JSON.stringify(response.body)).not.toContain("/srv/orelle");
            expect(JSON.stringify(response.body)).not.toContain("token.txt");

            const safeLog = readLastLog(logSpy);
            expect(safeLog.message).toBe("Erro interno do servidor");
            expect(JSON.stringify(safeLog)).not.toContain("/srv/orelle");
            expect(JSON.stringify(safeLog)).not.toContain("token.txt");
        } finally {
            logSpy.mockRestore();
        }
    });

    it("regista metrica HTTP minimizada sem payload nem cookies", async () => {
        const response = await request(createApp()).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.headers["x-request-id"]).toEqual(expect.any(String));
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "http_request",
                method: "GET",
                route: "/api/health",
                statusCode: 200,
                status: "success",
                budgetMs: 3000,
            }),
        );

        const metric = mocks.metricCreate.mock.calls.at(-1)?.[0];
        expect(metric.durationMs).toEqual(expect.any(Number));
        expect(JSON.stringify(metric)).not.toContain("orelle_session");
        expect(JSON.stringify(metric)).not.toContain("password");
        expect(JSON.stringify(metric)).not.toContain("storageKey");
    });

    it("aplica sampling apenas a sucessos e conserva todos os erros", async () => {
        expect(
            shouldRecordHttpMetric({
                statusCode: 200,
                sampleValue: 0.099,
                nodeEnv: "development",
            }),
        ).toBe(true);
        expect(
            shouldRecordHttpMetric({
                statusCode: 200,
                sampleValue: 0.1,
                nodeEnv: "development",
            }),
        ).toBe(false);
        expect(
            shouldRecordHttpMetric({
                statusCode: 503,
                sampleValue: 0.99,
                nodeEnv: "development",
            }),
        ).toBe(true);
        expect(
            shouldRecordHttpMetric({
                statusCode: 200,
                sampleValue: 0.99,
                nodeEnv: "test",
            }),
        ).toBe(true);

        await recordHttpRequestMetric(
            {
                method: "GET",
                route: "/api/catalog/products",
                statusCode: 200,
                durationMs: 20,
            },
            { sampleValue: 0.99, nodeEnv: "development" },
        );
        expect(mocks.metricCreate).not.toHaveBeenCalled();

        await recordHttpRequestMetric(
            {
                method: "GET",
                route: "/api/catalog/products",
                statusCode: 503,
                durationMs: 20,
            },
            { sampleValue: 0.99, nodeEnv: "development" },
        );
        expect(mocks.metricCreate).toHaveBeenCalledTimes(1);
    });
});
