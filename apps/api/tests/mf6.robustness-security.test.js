/**
 * Testes focados da MF6 para robustez, performance e encriptação.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";
import {
    DEFAULT_REQUEST_TIMEOUT_MS,
    requestTimeout,
} from "../src/middlewares/request-timeout.middleware.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { BCRYPT_COST } from "../src/services/auth.service.js";
import { getSessionCookieOptions } from "../src/services/session.service.js";
import {
    decryptBuffer,
    decryptJson,
    encryptBuffer,
    encryptJson,
    parseDataEncryptionKey,
} from "../src/services/encryption.service.js";
import {
    encryptFacePhotoFile,
    readEncryptedFacePhotoFile,
} from "../src/services/face-secure-storage.service.js";
import { FACE_ANALYSIS_BUDGET_MS } from "../src/services/face-analysis.service.js";
import { startServer } from "../src/server.js";

/**
 * Cria um ObjectId mínimo para documentos Mongoose sem ligar ao MongoDB.
 *
 * @function objectId
 * @param {string} id - Valor textual hexadecimal.
 * @returns {import("mongoose").Types.ObjectId} ObjectId Mongoose.
 */
function objectId(id) {
    return new mongoose.Types.ObjectId(id);
}

/**
 * Executa um teste com a configuracao HTTPS pretendida e restaura o ambiente.
 *
 * @async
 * @function withForceHttps
 * @param {boolean} value - Valor temporario de `env.forceHttps`.
 * @param {() => Promise<void>|void} action - Corpo do teste a executar.
 * @returns {Promise<void>} Promessa resolvida quando o teste termina.
 */
async function withForceHttps(value, action) {
    const originalForceHttps = env.forceHttps;

    try {
        env.forceHttps = value;
        await action();
    } finally {
        env.forceHttps = originalForceHttps;
    }
}

/**
 * Executa um teste com configuracao temporaria de encriptacao.
 *
 * @async
 * @function withEncryptionEnv
 * @param {{nodeEnv?: string, dataEncryptionKey?: string|undefined}} overrides - Valores temporarios.
 * @param {() => Promise<void>|void} action - Corpo do teste.
 * @returns {Promise<void>} Promessa resolvida quando o teste termina.
 */
async function withEncryptionEnv(overrides, action) {
    const originalNodeEnv = env.nodeEnv;
    const originalDataEncryptionKey = env.dataEncryptionKey;

    try {
        if ("nodeEnv" in overrides) env.nodeEnv = overrides.nodeEnv;
        if ("dataEncryptionKey" in overrides) {
            env.dataEncryptionKey = overrides.dataEncryptionKey;
        }
        await action();
    } finally {
        env.nodeEnv = originalNodeEnv;
        env.dataEncryptionKey = originalDataEncryptionKey;
    }
}

describe("MF6 - robustez, performance e segurança", () => {
    it("mantem contratos explícitos de bcrypt e budget de analise", () => {
        expect(BCRYPT_COST).toBe(12);
        expect(FACE_ANALYSIS_BUDGET_MS).toBe(10000);
        expect(DEFAULT_REQUEST_TIMEOUT_MS).toBeGreaterThan(
            FACE_ANALYSIS_BUDGET_MS,
        );
    });

    it("marca o cookie como Secure quando o gate HTTPS esta ativo", async () => {
        await withForceHttps(true, () => {
            expect(getSessionCookieOptions().secure).toBe(true);
        });
    });

    it("permite desenvolvimento local por HTTP sem HSTS", async () => {
        await withForceHttps(false, async () => {
            const app = createApp();
            const response = await request(app).get("/api/health");

            expect(response.status).toBe(200);
            expect(response.headers["strict-transport-security"]).toBeUndefined();
        });
    });

    it("permite produção segura por proxy HTTPS explicitamente autorizado e envia HSTS", async () => {
        await withForceHttps(true, async () => {
            const app = createApp({
                trustedProxies: ["127.0.0.0/8", "::1/128"],
            });
            const response = await request(app)
                .get("/api/health")
                .set("x-forwarded-proto", "https");

            expect(response.status).toBe(200);
            expect(response.headers["strict-transport-security"]).toContain(
                "max-age=15552000",
            );
        });
    });

    it("bloqueia produção HTTP insegura sem enviar HSTS", async () => {
        await withForceHttps(true, async () => {
            const app = createApp();
            const response = await request(app)
                .get("/api/health")
                .set("x-forwarded-proto", "http");

            expect(response.status).toBe(426);
            expect(response.body.error.message).toBe(
                "HTTPS obrigatório para comunicações Orélle.",
            );
            expect(response.headers["strict-transport-security"]).toBeUndefined();
        });
    });

    it("cifra e decifra buffers e JSON sem expor texto em claro", () => {
        const encryptedBuffer = encryptBuffer(Buffer.from("relatorio sensivel"));
        const encryptedJson = encryptJson({
            cosmeticSummary: "Tipo de pele estimado",
        });

        expect(encryptedBuffer.ciphertext).not.toContain("relatorio sensivel");
        expect(decryptBuffer(encryptedBuffer).toString("utf8")).toBe(
            "relatorio sensivel",
        );
        expect(JSON.stringify(encryptedJson)).not.toContain(
            "Tipo de pele estimado",
        );
        expect(decryptJson(encryptedJson)).toEqual({
            cosmeticSummary: "Tipo de pele estimado",
        });
    });

    it("rejeita chave de encriptação fraca", () => {
        expect(() => parseDataEncryptionKey("curta")).toThrow(
            "Chave de encriptação inválida.",
        );
    });

    it("rejeita payload cifrado adulterado", () => {
        const encryptedBuffer = encryptBuffer(Buffer.from("relatorio sensivel"));
        const tamperedPayload = {
            ...encryptedBuffer,
            authTag: Buffer.from("auth-tag-adulterada").toString("base64"),
        };

        expect(() => decryptBuffer(tamperedPayload)).toThrow(
            "Conteúdo encriptado inválido.",
        );
    });

    it("exige DATA_ENCRYPTION_KEY dedicada em producao", async () => {
        await withEncryptionEnv(
            { nodeEnv: "production", dataEncryptionKey: undefined },
            () => {
                expect(() => encryptBuffer(Buffer.from("foto sensivel"))).toThrow(
                    "DATA_ENCRYPTION_KEY obrigatória em produção.",
                );
            },
        );
    });

    it("guarda campos sensíveis de FaceReport cifrados no documento", () => {
        const report = new FaceReport({
            userId: objectId("665f00000000000000000001"),
            analysisId: objectId("665f00000000000000000002"),
            cosmeticSummary: "Tipo de pele estimado: mista.",
            routineSuggestions: [
                {
                    period: "manha",
                    title: "Limpeza suave",
                    reason: "Apoia rotina.",
                },
            ],
            sources: ["fotografia_frontal"],
            limitations: ["Não é diagnóstico médico."],
        });
        const storedSummary = report.get("cosmeticSummary", null, {
            getters: false,
        });

        expect(storedSummary.encrypted).toBe(true);
        expect(storedSummary.ciphertext).not.toContain("Tipo de pele");
        expect(report.cosmeticSummary).toBe("Tipo de pele estimado: mista.");
        expect(report.routineSuggestions[0].title).toBe("Limpeza suave");
    });

    it("cifra ficheiro facial e remove original antes da persistência", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "orelle-mf6-"));
        const originalPath = path.join(dir, "frontal.png");
        const userId = objectId("665f00000000000000000011");
        const photoId = objectId("665f00000000000000000012");

        await writeFile(originalPath, Buffer.from("imagem facial sensivel"));

        const encrypted = await encryptFacePhotoFile(
            { path: originalPath },
            { userId, photoId, kind: "frontal" },
        );
        const encryptedBytes = await readFile(encrypted.storageKey);
        const photo = {
            ...encrypted,
            _id: photoId,
            userId,
            kind: "frontal",
        };

        expect(encrypted.storageKey).toMatch(/\.enc$/);
        expect(encrypted.encryption.algorithm).toBe("aes-256-gcm");
        expect(encrypted.encryption.keyVersion).toBe(2);
        expect(encrypted.encryption.aadHash).toEqual(expect.any(String));
        await expect(readFile(originalPath)).rejects.toThrow();
        expect(encryptedBytes.toString("utf8")).not.toContain("imagem facial");
        await expect(
            readEncryptedFacePhotoFile(photo),
        ).resolves.toEqual(Buffer.from("imagem facial sensivel"));
        await expect(
            readEncryptedFacePhotoFile({
                ...photo,
                userId: objectId("665f00000000000000000013"),
            }),
        ).rejects.toThrow("Conteúdo contextual encriptado inválido");
        await expect(
            readEncryptedFacePhotoFile({ ...photo, kind: "perfil" }),
        ).rejects.toThrow("Conteúdo contextual encriptado inválido");
        await expect(
            readEncryptedFacePhotoFile({
                ...photo,
                _id: objectId("665f00000000000000000014"),
            }),
        ).rejects.toThrow("Conteúdo contextual encriptado inválido");

        await rm(dir, { recursive: true, force: true });
    });

    it("responde a 50 health checks concorrentes sem falhas", async () => {
        const app = createApp();
        const responses = await Promise.all(
            Array.from({ length: 50 }, () => request(app).get("/api/health")),
        );

        expect(responses.every((response) => response.status === 200)).toBe(true);
        expect(responses[0].body).toEqual({
            status: "ok",
            app: "orelle",
            checks: { http: "ok" },
        });
    });

    it("separa liveness de readiness sem expor configuração", async () => {
        const readyApp = createApp({ readinessCheck: () => true });
        const unavailableApp = createApp({ readinessCheck: () => false });

        const live = await request(unavailableApp).get("/api/health/live");
        const ready = await request(readyApp).get("/api/health/ready");
        const unavailable = await request(unavailableApp).get(
            "/api/health/ready",
        );

        expect(live.status).toBe(200);
        expect(live.body.checks).toEqual({ http: "ok" });
        expect(ready.status).toBe(200);
        expect(ready.body).toEqual({
            status: "ready",
            app: "orelle",
            checks: { mongodb: "ok" },
        });
        expect(unavailable.status).toBe(503);
        expect(unavailable.body).toEqual({
            status: "not_ready",
            app: "orelle",
            checks: { mongodb: "unavailable" },
        });
        expect(JSON.stringify(unavailable.body)).not.toContain("mongodb://");
    });

    it("fecha HTTP e Mongo uma única vez no shutdown gracioso", async () => {
        const connect = vi.fn().mockResolvedValue(undefined);
        const disconnect = vi.fn().mockResolvedValue(undefined);
        const close = vi.fn((callback) => callback());
        const server = { close };
        const signalHandlers = new Map();
        const processRef = {
            exitCode: 0,
            once: vi.fn((signal, handler) => {
                signalHandlers.set(signal, handler);
            }),
        };
        const logger = { log: vi.fn(), error: vi.fn() };
        const createApplication = () => ({
            listen: (port, callback) => {
                callback();
                return server;
            },
        });

        const runtime = await startServer({
            connect,
            disconnect,
            createApplication,
            processRef,
            logger,
            shutdownTimeoutMs: 100,
        });

        await Promise.all([
            runtime.shutdown("test"),
            runtime.shutdown("test-repetido"),
        ]);

        expect(connect).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(processRef.once).toHaveBeenCalledWith(
            "SIGTERM",
            expect.any(Function),
        );
        expect(processRef.once).toHaveBeenCalledWith(
            "SIGINT",
            expect.any(Function),
        );
        expect(processRef.exitCode).toBe(0);
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("só devolve o runtime depois de o servidor confirmar listening", async () => {
        let confirmListening;
        let resolveListenCalled;
        let runtimeResolved = false;
        const listenCalled = new Promise((resolve) => {
            resolveListenCalled = resolve;
        });
        const server = new EventEmitter();
        server.close = vi.fn((callback) => callback());
        const disconnect = vi.fn().mockResolvedValue(undefined);

        const runtimePromise = startServer({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect,
            createApplication: () => ({
                listen: (_target, callback) => {
                    confirmListening = callback;
                    resolveListenCalled();
                    return server;
                },
            }),
            processRef: { exitCode: 0, once: vi.fn() },
            logger: { log: vi.fn(), error: vi.fn() },
            installSignalHandlers: false,
        });
        void runtimePromise.then(() => {
            runtimeResolved = true;
        });

        await listenCalled;
        await Promise.resolve();
        expect(runtimeResolved).toBe(false);

        confirmListening();
        const runtime = await runtimePromise;
        expect(runtimeResolved).toBe(true);

        await runtime.shutdown("immediate-stop-test");
        expect(server.close).toHaveBeenCalledTimes(1);
        expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it("fecha MongoDB e rejeita quando o bind HTTP falha", async () => {
        const server = new EventEmitter();
        const disconnect = vi.fn().mockResolvedValue(undefined);
        const startup = startServer({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect,
            createApplication: () => ({
                listen: () => {
                    queueMicrotask(() => {
                        server.emit("error", new Error("porta indisponível"));
                    });
                    return server;
                },
            }),
            processRef: { exitCode: 0, once: vi.fn() },
            logger: { log: vi.fn(), error: vi.fn() },
            installSignalHandlers: false,
        });

        await expect(startup).rejects.toThrow("porta indisponível");
        expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it("força ligações HTTP e fecha Mongo mesmo após timeout de shutdown", async () => {
        const disconnect = vi.fn().mockResolvedValue(undefined);
        const close = vi.fn(() => undefined);
        const closeAllConnections = vi.fn();
        const processRef = { exitCode: 0, once: vi.fn() };
        const logger = { log: vi.fn(), error: vi.fn() };

        const runtime = await startServer({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect,
            createApplication: () => ({
                listen: (_target, callback) => {
                    callback();
                    return { close, closeAllConnections };
                },
            }),
            processRef,
            logger,
            shutdownTimeoutMs: 5,
        });

        await expect(runtime.shutdown("timeout-test")).rejects.toThrow(
            "Timeout no shutdown HTTP",
        );

        expect(close).toHaveBeenCalledTimes(1);
        expect(closeAllConnections).toHaveBeenCalledTimes(1);
        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(processRef.exitCode).toBe(1);
        expect(logger.error).toHaveBeenCalledWith(
            "Falha no encerramento gracioso da API",
        );
    });

    it("devolve erro controlado quando um pedido excede o timeout", async () => {
        const app = express();

        app.use(requestTimeout({ timeoutMs: 5 }));
        app.get("/slow", () => undefined);
        app.use(errorMiddleware);

        const response = await request(app).get("/slow");

        expect(response.status).toBe(503);
        expect(response.body.error.message).toBe("Pedido excedeu o tempo limite.");
    });

    it("sinaliza timeout para impedir resposta tardia de rota lenta", async () => {
        const app = express();
        let slowRouteSawTimeout = false;
        let sentLateResponse = false;

        app.use(requestTimeout({ timeoutMs: 5 }));
        app.get("/slow-guarded", async (req, res) => {
            await new Promise((resolve) => setTimeout(resolve, 25));
            slowRouteSawTimeout = req.hasRequestTimedOut?.() === true;

            if (res.headersSent || req.hasRequestTimedOut?.()) {
                return;
            }

            sentLateResponse = true;
            res.json({ status: "late" });
        });
        app.use(errorMiddleware);

        const response = await request(app).get("/slow-guarded");
        await new Promise((resolve) => setTimeout(resolve, 40));

        expect(response.status).toBe(503);
        expect(response.body.error.message).toBe("Pedido excedeu o tempo limite.");
        expect(slowRouteSawTimeout).toBe(true);
        expect(sentLateResponse).toBe(false);
    });

    it("aborta o sinal do pedido para impedir mutação tardia cooperativa", async () => {
        const app = express();
        let abortWasObserved = false;
        let abortReason;
        let lateMutation = false;

        app.use(requestTimeout({ timeoutMs: 5 }));
        app.get("/slow-abortable", async (req) => {
            req.orelleAbortSignal.addEventListener(
                "abort",
                () => {
                    abortWasObserved = true;
                    abortReason = req.orelleAbortSignal.reason;
                },
                { once: true },
            );

            await new Promise((resolve) => setTimeout(resolve, 25));

            if (!req.orelleAbortSignal.aborted) {
                lateMutation = true;
            }
        });
        app.use(errorMiddleware);

        const response = await request(app).get("/slow-abortable");
        await new Promise((resolve) => setTimeout(resolve, 40));

        expect(response.status).toBe(503);
        expect(abortWasObserved).toBe(true);
        expect(abortReason).toMatchObject({ statusCode: 503 });
        expect(lateMutation).toBe(false);
    });
});
