import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import * as secureStorage from "../src/services/face-secure-storage.service.js";
import {
    decryptBuffer,
    decryptJson,
    encryptBuffer,
    encryptJson,
    parseEncryptionKey,
} from "../src/services/encryption.service.js";
import { env } from "../src/config/env.js";

const userId = "66a000000000000000000001";
const consentId = "66b000000000000000000001";
const frontalId = "66f000000000000000000001";
const perfilId = "66f000000000000000000002";
const analysisId = "66e000000000000000000001";
const reportId = "66e000000000000000000002";
const uploadDir = path.resolve("storage/private/facial-photos");

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria um buffer PNG mínimo para testes multipart.
 *
 * @function makePngImageBuffer
 * @returns {Buffer} Imagem PNG 1x1 válida.
 */
function makePngImageBuffer() {
    return Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64",
    );
}

/**
 * Gera token de cliente para rotas faciais autenticadas.
 *
 * @function makeToken
 * @returns {string} JWT de sessão válido para testes.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria consentimento facial ativo para o middleware de upload.
 *
 * @function makeConsent
 * @returns {object} Consentimento mock com `_id` e ownership.
 */
function makeConsent() {
    return {
        _id: objectId(consentId),
        userId,
        version: "face-analysis-v1",
        acceptedAt: new Date("2026-06-01T10:00:00.000Z"),
        purpose: "analise_facial_cosmetica",
    };
}

/**
 * Simula uma query Mongoose com `sort()`.
 *
 * @function queryWithSort
 * @param {unknown} result - Resultado final da query.
 * @returns {{sort: Function}} Query mock encadeável.
 */
function queryWithSort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria análise facial concluída para gerar relatório.
 *
 * @function makeAnalysis
 * @returns {object} Análise facial mock com findings cosméticos.
 */
function makeAnalysis() {
    return {
        _id: objectId(analysisId),
        findings: {
            skinType: { label: "mista" },
            acne: { label: "baixo" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Leitura cosmética, não médica."],
        status: "completed",
    };
}

/**
 * Cria relatório já decifrado para resposta pública da API.
 *
 * @function makeReport
 * @returns {object} Relatório mock com a interface pública esperada.
 */
function makeReport() {
    return {
        _id: objectId(reportId),
        analysisId: objectId(analysisId),
        cosmeticSummary: "Tipo de pele estimado: mista.",
        routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
        sources: ["fotografia_frontal"],
        limitations: ["Leitura cosmética com limites explícitos."],
        privacyStatus: "active",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

describe("BK-MF6-07 encriptação em repouso", () => {
    beforeEach(async () => {
        env.dataEncryptionKey = randomBytes(32).toString("base64");
        await fs.mkdir(uploadDir, { recursive: true });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.rm(uploadDir, { recursive: true, force: true });
    });

    it("cifra e decifra buffers sem guardar o original", () => {
        const key = randomBytes(32);
        const original = Buffer.from("relatorio cosmetico sensivel", "utf8");
        const encrypted = encryptBuffer(original, key);

        // O ciphertext tem de ser diferente para provar que o valor original
        // não ficou guardado em claro.
        expect(encrypted.encrypted.equals(original)).toBe(false);
        expect(
            decryptBuffer({ ...encrypted, key }).toString("utf8"),
        ).toBe("relatorio cosmetico sensivel");
    });

    it("cifra e decifra JSON preservando arrays de relatório", () => {
        const key = randomBytes(32);
        const reportPayload = {
            cosmeticSummary: "Resumo cosmético sensível",
            routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
            limitations: ["Leitura cosmética com limites explícitos."],
        };

        const encrypted = encryptJson(reportPayload, key);
        const decrypted = decryptJson(encrypted, key);

        expect(encrypted.encrypted).not.toContain("Resumo cosmético");
        expect(decrypted).toEqual(reportPayload);
    });

    it("rejeita chave inválida", () => {
        expect(() => parseEncryptionKey("curta")).toThrow(
            "Chave de encriptação inválida.",
        );
    });

    it("rejeita conteúdo adulterado pela auth tag", () => {
        const key = randomBytes(32);
        const encrypted = encryptBuffer(Buffer.from("fotografia"), key);

        expect(() =>
            decryptBuffer({
                ...encrypted,
                authTag: randomBytes(16).toString("base64"),
                key,
            }),
        ).toThrow("Conteúdo sensível não pode ser decifrado.");
    });

    it("guarda relatório cifrado no model e devolve valor legível ao backend", () => {
        const report = new FaceReport({
            userId,
            analysisId,
            cosmeticSummary: "Tipo de pele estimado: mista.",
            routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
            sources: ["fotografia_frontal"],
            limitations: ["Leitura cosmética com limites explícitos."],
        });

        const rawSummary = report.get("cosmeticSummary", null, {
            getters: false,
        });
        const persistedSummary = JSON.parse(rawSummary);

        // O valor bruto que seguiria para MongoDB é ciphertext, não texto
        // cosmético legível em dumps ou backups.
        expect(rawSummary).not.toContain("Tipo de pele");
        expect(persistedSummary).toEqual(
            expect.objectContaining({
                encrypted: expect.any(String),
                iv: expect.any(String),
                authTag: expect.any(String),
            }),
        );
        expect(report.cosmeticSummary).toContain("Tipo de pele");
    });

    it("faz upload HTTP e persiste fotografias como .enc sem expor storage", async () => {
        vi.spyOn(FaceConsent, "findOne").mockResolvedValue(makeConsent());
        vi.spyOn(secureStorage, "encryptFacePhotoFile").mockImplementation(
            async ({ sourcePath }) => ({
                storageKey: `${sourcePath}.enc`,
                encryption: {
                    algorithm: "aes-256-gcm",
                    iv: randomBytes(12).toString("base64"),
                    authTag: randomBytes(16).toString("base64"),
                },
            }),
        );
        vi.spyOn(FacePhoto, "insertMany").mockResolvedValue([
            {
                _id: objectId(frontalId),
                kind: "frontal",
                originalName: "frontal.png",
                mimeType: "image/png",
                sizeBytes: 68,
                status: "active",
                createdAt: new Date("2026-06-01T10:00:00.000Z"),
            },
            {
                _id: objectId(perfilId),
                kind: "perfil",
                originalName: "perfil.png",
                mimeType: "image/png",
                sizeBytes: 68,
                status: "active",
                createdAt: new Date("2026-06-01T10:00:00.000Z"),
            },
        ]);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        const publicBody = JSON.stringify(response.body);

        // A rota completa prova controller + service + model mockado, não apenas
        // um objeto fabricado dentro do teste.
        expect(response.status).toBe(201);
        expect(FacePhoto.insertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    storageKey: expect.stringMatching(/\.enc$/),
                    encryption: expect.objectContaining({
                        algorithm: "aes-256-gcm",
                        iv: expect.any(String),
                        authTag: expect.any(String),
                    }),
                }),
            ]),
        );
        expect(publicBody).not.toContain("storageKey");
        expect(publicBody).not.toContain("authTag");
        expect(publicBody).not.toContain("DATA_ENCRYPTION_KEY");
    });

    it("remove ficheiro cifrado se a segunda fotografia falhar", async () => {
        const firstEncryptedFile = {
            storageKey: path.join(uploadDir, "frontal.png.enc"),
            encryption: {
                algorithm: "aes-256-gcm",
                iv: randomBytes(12).toString("base64"),
                authTag: randomBytes(16).toString("base64"),
            },
        };

        vi.spyOn(FaceConsent, "findOne").mockResolvedValue(makeConsent());
        vi.spyOn(secureStorage, "encryptFacePhotoFile")
            .mockResolvedValueOnce(firstEncryptedFile)
            .mockRejectedValueOnce(new Error("Falha controlada na segunda cifra."));
        const removeEncryptedSpy = vi
            .spyOn(secureStorage, "removeEncryptedFacePhotoFiles")
            .mockResolvedValue();
        vi.spyOn(FacePhoto, "insertMany").mockResolvedValue([]);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        // A falha parcial não pode deixar `.enc` órfão nem persistir metadados
        // incompletos em MongoDB.
        expect(response.status).toBe(500);
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        expect(removeEncryptedSpy).toHaveBeenCalledWith([
            expect.objectContaining(firstEncryptedFile),
        ]);
    });

    it("gera relatório HTTP sem expor metadados criptográficos", async () => {
        vi.spyOn(FaceAnalysis, "findOne").mockReturnValue(
            queryWithSort(makeAnalysis()),
        );
        vi.spyOn(FaceReport, "create").mockResolvedValue(makeReport());

        const response = await request(createApp())
            .post("/api/face-reports/latest")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        const publicBody = JSON.stringify(response.body);

        // O endpoint real continua a devolver resumo permitido, mas nunca envia
        // ciphertext, IV, auth tag, chave ou path interno ao frontend.
        expect(response.status).toBe(201);
        expect(response.body.report.cosmeticSummary).toContain("Tipo de pele");
        expect(FaceReport.create).toHaveBeenCalledWith(
            expect.objectContaining({
                privacyStatus: "active",
                cosmeticSummary: expect.stringContaining("Tipo de pele"),
            }),
        );
        expect(publicBody).not.toContain("storageKey");
        expect(publicBody).not.toContain("authTag");
        expect(publicBody).not.toContain("encrypted");
        expect(publicBody).not.toContain("DATA_ENCRYPTION_KEY");
    });
});