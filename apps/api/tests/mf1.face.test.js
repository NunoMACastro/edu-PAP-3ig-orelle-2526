/**
 * Testes da MF1 para consentimento, fotografias, análise, relatório e histórico.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import request from "supertest";
import sharp from "sharp";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FACE_PHOTO_UPLOAD_DIR } from "../src/middlewares/face-photo-upload.middleware.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { readEncryptedFacePhotoFile } from "../src/services/face-secure-storage.service.js";
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
        updateMany: vi.fn(),
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
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: { LOCKED: "locked", UNLOCKED: "unlocked" },
    ReportUnlock: { find: vi.fn() },
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock("../src/services/face-secure-storage.service.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        readEncryptedFacePhotoFile: vi.fn(),
    };
});

const userId = "66a000000000000000000001";
const otherUserId = "66a000000000000000000002";
const consentId = "66b000000000000000000001";
const frontalId = "66f000000000000000000001";
const perfilId = "66f000000000000000000002";
const analysisId = "66e000000000000000000001";
const reportId = "66e000000000000000000002";
const uploadDir = FACE_PHOTO_UPLOAD_DIR;

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        /**
         * Devolve o valor textual do ObjectId simulado.
         *
         * @function toString
         * @returns {string} Identificador textual usado no teste.
         */
        toString() {
            return id;
        },
    };
}

/**
 * Cria uma imagem PNG válida com detalhe suficiente para o perfil de qualidade v1.
 *
 * @function makePngImageBuffer
 * @returns {Promise<Buffer>} Imagem PNG 960x720 válida.
 */
async function makePngImageBuffer() {
    return sharp(
        Buffer.from(`
            <svg width="960" height="720" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <rect width="24" height="24" fill="rgb(112, 92, 76)" />
                        <rect width="12" height="12" fill="rgb(164, 142, 118)" />
                        <rect x="12" y="12" width="12" height="12" fill="rgb(164, 142, 118)" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        `),
    )
        .png()
        .toBuffer();
}

/**
 * Simula a query privada usada para carregar fotografias ativas a substituir.
 *
 * @function selectMock
 * @param {unknown} result - Fotografias ativas devolvidas.
 * @returns {object} Query com `select()` resolvida.
 */
function selectMock(result) {
    return {
        select: vi.fn().mockResolvedValue(result),
    };
}

function unlockQueryMock(result = []) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(result),
    };
    query.select.mockReturnValue(query);
    return query;
}

/**
 * Gera um token de cliente para os endpoints faciais autenticados.
 *
 * @function makeToken
 * @param {string} [id=userId] - ID do utilizador a colocar no token.
 * @returns {string} Token opaco de sessão válido para os testes.
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
        version: "face-analysis-v2",
        acceptedAt: new Date("2026-06-01T10:00:00.000Z"),
        purpose: "analise_facial_cosmetica",
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: "openai-cosmetic-consultation-v2",
            acceptedAt: new Date("2026-06-01T10:00:00.000Z"),
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
        ...overrides,
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
        mode: "openai",
        providerName: "openai",
        requestedModel: "gpt-5.4-mini",
        effectiveModel: "gpt-5.4-mini",
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

describe("MF1 - fluxo facial", () => {
    beforeEach(async () => {
        vi.resetAllMocks();
        FacePhoto.find.mockReturnValue(selectMock([]));
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 0 });
        ReportUnlock.find.mockReturnValue(unlockQueryMock([]));
        readEncryptedFacePhotoFile.mockImplementation(async (photo) =>
            Buffer.from(`${photo.kind}-image-bytes`),
        );
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
            .send({
                accepted: true,
                version: "face-analysis-v2",
                providerConsentAccepted: true,
                provider: "openai",
                noticeVersion: "openai-cosmetic-consultation-v2",
            });

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

        const oversizedImage = Buffer.alloc(10 * 1024 * 1024 + 1, 1);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", oversizedImage, {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", await makePngImageBuffer(), {
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
            .attach("perfil", await makePngImageBuffer(), {
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
            .attach("frontal", await makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", await makePngImageBuffer(), {
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
            .attach("frontal", await makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", await makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        expect(response.status).toBe(500);
        expect(response.body.error.message).toBe("Erro interno do servidor");
        expect(FacePhoto.insertMany).toHaveBeenCalledOnce();
        await expect(fs.readdir(uploadDir)).resolves.toEqual([]);
    });

    it("remove a rota direta antiga de análise", async () => {
        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FacePhoto.find).not.toHaveBeenCalled();
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("não contorna a consulta direta quando não existe consentimento", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("remove a geração direta antiga de relatório", async () => {
        const response = await request(createApp())
            .post("/api/face-reports/latest")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FaceAnalysis.findOne).not.toHaveBeenCalled();
        expect(FaceReport.findOneAndUpdate).not.toHaveBeenCalled();
        expect(FaceReport.create).not.toHaveBeenCalled();
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
