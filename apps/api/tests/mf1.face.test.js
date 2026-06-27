/**
 * Testes da MF1 para consentimento, fotografias, análise, relatório e histórico.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { analyzeSkinPhotos } from "../src/providers/skin-analysis.provider.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateFaceConsentInput } from "../src/validators/face-photo.validator.js";

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        find: vi.fn(),
        insertMany: vi.fn(),
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        create: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        create: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: vi.fn().mockResolvedValue({}),
    },
}));

const userId = "66a000000000000000000001";
const otherUserId = "66a000000000000000000002";
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
 * Cria um buffer PNG mínimo para testar uploads multipart.
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
 * Gera um token de cliente para os endpoints faciais autenticados.
 *
 * @function makeToken
 * @param {string} [id=userId] - ID do utilizador a colocar no token.
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken(id = userId) {
    return createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria um consentimento facial mock.
 *
 * @function makeConsent
 * @param {object} [overrides={}] - Campos a sobrepor no consentimento base.
 * @returns {object} Consentimento mock.
 */
function makeConsent(overrides = {}) {
    return {
        _id: objectId(consentId),
        userId,
        version: "face-analysis-v1",
        acceptedAt: new Date("2026-06-01T10:00:00.000Z"),
        purpose: "analise_facial_cosmetica",
        ...overrides,
    };
}

/**
 * Cria uma fotografia facial mock.
 *
 * @function makePhoto
 * @param {string} kind - Tipo de fotografia facial.
 * @param {string} id - ID da fotografia.
 * @param {string} [storageKey] - Caminho interno simulado.
 * @returns {object} Fotografia mock.
 */
function makePhoto(kind, id, storageKey = `/tmp/${kind}.png`) {
    return {
        _id: id,
        kind,
        storageKey,
        originalName: `${kind}.png`,
        mimetype: "image/png",
        mimeType: "image/png",
        size: 10,
        sizeBytes: 10,
        status: "active",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

/**
 * Cria uma análise facial mock com findings cosméticos completos.
 *
 * @function makeAnalysis
 * @param {object} [overrides={}] - Campos a sobrepor na análise base.
 * @returns {object} Análise facial mock.
 */
function makeAnalysis(overrides = {}) {
    return {
        _id: objectId(analysisId),
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: {
                label: "mista",
                confidence: 0.55,
                explanation: "Estimativa cosmetica inicial.",
            },
            acne: {
                label: "baixo",
                confidence: 0.5,
                explanation: "Sinal cosmetico conservador.",
            },
            manchas: {
                label: "baixo",
                confidence: 0.48,
                explanation: "Sinal cosmetico conservador.",
            },
            rugas: {
                label: "baixo",
                confidence: 0.47,
                explanation: "Sinal cosmetico conservador.",
            },
            oleosidade: {
                label: "moderada",
                confidence: 0.53,
                explanation: "Estimativa cosmetica inicial.",
            },
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Não é diagnóstico médico.",
            "Resultado de provider local controlado com confiança baixa a moderada.",
        ],
        performance: {
            durationMs: 12,
            budgetMs: 10000,
        },
        status: "completed",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Simula a cadeia de query Mongoose `select().sort().limit()`.
 *
 * @function chainMock
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function chainMock(result) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `sort().select()`.
 *
 * @function sortSelectMock
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function sortSelectMock(result) {
    return {
        sort: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue(result),
        }),
    };
}

/**
 * Simula a cadeia de query Mongoose `findOne().sort()`.
 *
 * @function findOneChainMock
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function findOneChainMock(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

describe("MF1 - fluxo facial", () => {
    beforeEach(async () => {
        vi.resetAllMocks();
        await fs.mkdir(uploadDir, { recursive: true });
    });

    afterEach(async () => {
        await fs.rm(uploadDir, { recursive: true, force: true });
    });

    it("rejeita consentimento nao aceite", () => {
        expect(() => validateFaceConsentInput({ accepted: false })).toThrow(
            "Consentimento facial obrigatorio",
        );
    });

    it("aceita consentimento autenticado", async () => {
        FaceConsent.findOneAndUpdate.mockResolvedValueOnce(makeConsent());

        const response = await request(createApp())
            .post("/api/face-consent")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ accepted: true, version: "face-analysis-v1" });

        expect(response.status).toBe(200);
        expect(response.body.consent.purpose).toBe(
            "analise_facial_cosmetica",
        );
    });

    it("bloqueia upload sem consentimento ativo antes de escrever ficheiros", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", Buffer.from("image"), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", Buffer.from("image"), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        expect(response.status).toBe(403);
        await expect(fs.readdir(uploadDir)).resolves.toEqual([]);
    });

    it("devolve 400 quando uma fotografia excede o limite de tamanho", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());

        const oversizedImage = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", oversizedImage, {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Ficheiro excede o tamanho máximo permitido",
        );
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
    });

    it("rejeita fotografia com MIME permitido mas assinatura invalida", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", Buffer.from("not an image"), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Conteúdo de imagem inválido",
        );
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(fs.readdir(uploadDir)).resolves.toEqual([]);
    });

    it("guarda metadados de duas fotografias sem storageKey na resposta", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        FacePhoto.insertMany.mockResolvedValueOnce([
            {
                _id: objectId(frontalId),
                kind: "frontal",
                originalName: "frontal.png",
                mimeType: "image/png",
                sizeBytes: 5,
                status: "active",
                createdAt: new Date("2026-06-01T10:00:00.000Z"),
            },
            {
                _id: objectId(perfilId),
                kind: "perfil",
                originalName: "perfil.png",
                mimeType: "image/png",
                sizeBytes: 5,
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

        expect(response.status).toBe(201);
        expect(response.body.photos).toHaveLength(2);
        expect(response.body.photos[0].storageKey).toBeUndefined();
        expect(FacePhoto.insertMany.mock.calls[0][0][0].storageKey).toMatch(
            /\.enc$/,
        );
        expect(FacePhoto.insertMany.mock.calls[0][0][0].encryption).toEqual(
            expect.objectContaining({
                algorithm: "aes-256-gcm",
                iv: expect.any(String),
                authTag: expect.any(String),
            }),
        );
    });

    it("remove uploads e ficheiros cifrados quando a persistência falha", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        FacePhoto.insertMany.mockRejectedValueOnce(new Error("mongo down"));

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

        expect(response.status).toBe(500);
        expect(response.body.error.message).toBe("Erro interno do servidor");
        expect(FacePhoto.insertMany).toHaveBeenCalledOnce();
        await expect(fs.readdir(uploadDir)).resolves.toEqual([]);
    });

    it("mantem provider local controlado com sinais cosmeticos", async () => {
        const analysis = await analyzeSkinPhotos({
            frontalPhoto: makePhoto("frontal", frontalId),
            perfilPhoto: makePhoto("perfil", perfilId),
        });

        expect(analysis.providerName).toBe("local-skin-analysis-v1");
        expect(analysis.findings.skinType.label).toBe("mista");
        expect(analysis.findings.acne.label).toBe("baixo");
        expect(analysis.findings.oleosidade.label).toBe("moderada");
        expect(analysis.findings.oleosidade.confidence).toBeGreaterThanOrEqual(
            0.45,
        );
        expect(analysis.limitations.join(" ")).toContain(
            "provider local controlado",
        );
        expect(Object.values(analysis.findings)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "mista" }),
                expect.objectContaining({ label: "moderada" }),
            ]),
        );
    });

    it("cria analise com provider isolado e limitacoes", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        FacePhoto.find.mockReturnValueOnce(
            sortSelectMock([
                makePhoto("frontal", frontalId),
                makePhoto("perfil", perfilId),
            ]),
        );
        FaceAnalysis.create.mockResolvedValueOnce(makeAnalysis());

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(201);
        expect(response.body.analysis.providerName).toBe(
            "local-skin-analysis-v1",
        );
        expect(response.body.analysis.performance).toEqual(
            expect.objectContaining({
                durationMs: expect.any(Number),
                budgetMs: 10000,
            }),
        );
        expect(response.body.analysis.limitations.join(" ")).toContain(
            "diagnóstico médico",
        );
        expect(FaceAnalysis.create).toHaveBeenCalledWith(
            expect.objectContaining({
                providerName: "local-skin-analysis-v1",
                findings: expect.objectContaining({
                    skinType: expect.objectContaining({
                        label: "mista",
                    }),
                    oleosidade: expect.objectContaining({
                        label: "moderada",
                    }),
                }),
                limitations: expect.arrayContaining([
                    expect.stringContaining("provider local controlado"),
                ]),
            }),
        );
    });

    it("bloqueia analise sem consentimento", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(403);
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("gera relatorio a partir da analise mais recente", async () => {
        FaceAnalysis.findOne.mockReturnValueOnce(findOneChainMock(makeAnalysis()));
        FaceReport.create.mockResolvedValueOnce({
            _id: objectId(reportId),
            analysisId: objectId(analysisId),
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
            createdAt: new Date("2026-06-01T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/face-reports/latest")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(201);
        expect(response.body.report.cosmeticSummary).toContain(
            "Tipo de pele",
        );
    });

    it("devolve historico apenas do utilizador autenticado", async () => {
        FaceAnalysis.find.mockReturnValueOnce(chainMock([makeAnalysis()]));
        FaceReport.find.mockReturnValueOnce(
            chainMock([
                {
                    _id: objectId(reportId),
                    analysisId: objectId(analysisId),
                    cosmeticSummary: "Resumo cosmético.",
                    routineSuggestions: [],
                    limitations: ["Não é diagnóstico médico."],
                    createdAt: new Date("2026-06-01T11:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get(`/api/me/skin-history?userId=${otherUserId}`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.history).toHaveLength(2);
        expect(FaceAnalysis.find).toHaveBeenCalledWith({ userId });
        expect(FaceReport.find).toHaveBeenCalledWith({
            userId,
            privacyStatus: "active",
        });
        expect(response.body.history[0].storageKey).toBeUndefined();
    });
});
