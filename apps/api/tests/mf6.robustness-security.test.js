/**
 * Testes focados da MF6 para robustez, performance e encriptação.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
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

    it("permite produção segura por proxy HTTPS e envia HSTS", async () => {
        await withForceHttps(true, async () => {
            const app = createApp();
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

        await writeFile(originalPath, Buffer.from("imagem facial sensivel"));

        const encrypted = await encryptFacePhotoFile({ path: originalPath });
        const encryptedBytes = await readFile(encrypted.storageKey);

        expect(encrypted.storageKey).toMatch(/\.enc$/);
        expect(encrypted.encryption.algorithm).toBe("aes-256-gcm");
        await expect(readFile(originalPath)).rejects.toThrow();
        expect(encryptedBytes.toString("utf8")).not.toContain("imagem facial");
        await expect(
            readEncryptedFacePhotoFile(encrypted),
        ).resolves.toEqual(Buffer.from("imagem facial sensivel"));

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
});
