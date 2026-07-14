/**
 * Testes MF6/BK-MF6-01 para budget temporal da analise facial.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { ROLES } from "../src/constants/roles.js";
import { AppError } from "../src/middlewares/error.middleware.js";
import {
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "../src/services/performance-budget.service.js";
import { createFaceAnalysisForUser } from "../src/services/face-analysis.service.js";
import { createSessionToken } from "../src/services/session.service.js";

const mocks = vi.hoisted(() => ({
    consentFindOne: vi.fn(),
    photoFind: vi.fn(),
    analysisFindOne: vi.fn(),
    analysisCreate: vi.fn(),
    metricCreate: vi.fn(),
    analyzeSkinPhotos: vi.fn(),
    readEncryptedFacePhotoFile: vi.fn(),
}));

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: mocks.consentFindOne,
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        find: mocks.photoFind,
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        findOne: mocks.analysisFindOne,
        create: mocks.analysisCreate,
    },
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: mocks.metricCreate,
    },
}));

vi.mock("../src/providers/skin-analysis.provider.js", () => ({
    analyzeSkinPhotos: mocks.analyzeSkinPhotos,
}));

vi.mock("../src/services/face-secure-storage.service.js", () => ({
    readEncryptedFacePhotoFile: mocks.readEncryptedFacePhotoFile,
}));

const userId = "66a000000000000000000001";
const consentId = "66b000000000000000000001";
const frontalId = "66f000000000000000000001";
const perfilId = "66f000000000000000000002";
const analysisId = "66e000000000000000000001";

/**
 * Cria um identificador mínimo com interface `toString`.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver.
 * @returns {{toString: Function}} ObjectId simulado.
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
 * Gera token de cliente autenticado para endpoints faciais.
 *
 * @function makeToken
 * @returns {string} Token opaco de sessao válido para os testes.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria uma query mock equivalente a `find().sort().select()`.
 *
 * @function sortSelectMock
 * @param {unknown[]} result - Resultado final da query.
 * @returns {object} Query encadeavel.
 */
function sortSelectMock(result) {
    return {
        sort: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue(result),
        }),
    };
}

/**
 * Cria fotografia facial mock com campos sensiveis para validar minimizacao.
 *
 * @function makePhoto
 * @param {"frontal"|"perfil"} kind - Tipo de fotografia.
 * @param {string} id - Identificador da fotografia.
 * @returns {object} Fotografia facial mock.
 */
function makePhoto(kind, id) {
    return {
        _id: objectId(id),
        kind,
        storageKey: `/private/${kind}.png.enc`,
        encryption: {
            algorithm: "aes-256-gcm",
            keyVersion: 2,
            aadHash: `${kind}-aad-hash`,
            iv: `${kind}-iv`,
            authTag: `${kind}-auth-tag`,
        },
        originalName: `${kind}.png`,
        mimeType: "image/png",
        sizeBytes: 12,
        status: "active",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

/**
 * Cria resultado OpenAI controlado para isolar o transporte nos testes.
 *
 * @function makeProviderResult
 * @returns {object} Resultado do provider.
 */
function makeProviderResult() {
    return {
        mode: "openai",
        isDemo: false,
        providerName: "openai",
        providerVersion: "responses-v1",
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
        photoQuality: { status: "pass", issues: [], warnings: [] },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Não é diagnóstico médico."],
        safetyFlags: [],
        provenance: {
            requestedModel: "gpt-5.4-mini",
            effectiveModel: "gpt-5.4-mini",
            requestId: "req_test_performance",
            promptVersion: "cosmetic-consultation-v2",
            schemaVersion: "face-analysis-v2",
        },
    };
}

/**
 * Cria documento de analise facial publico.
 *
 * @function makeAnalysis
 * @returns {object} Analise mock.
 */
function makeAnalysis() {
    return {
        _id: objectId(analysisId),
        ...makeProviderResult(),
        status: "completed",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

/**
 * Configura mocks para uma analise facial completa.
 *
 * @function arrangeValidAnalysis
 * @returns {{frontalPhoto: object, perfilPhoto: object}} Fotografias usadas.
 */
function arrangeValidAnalysis() {
    const frontalPhoto = makePhoto("frontal", frontalId);
    const perfilPhoto = makePhoto("perfil", perfilId);

    mocks.consentFindOne.mockResolvedValue({
        _id: objectId(consentId),
        userId,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: "openai-cosmetic-consultation-v2",
            acceptedAt: new Date("2026-07-11T10:00:00.000Z"),
            revokedAt: null,
        },
        purposes: { openAiAnalysis: true },
    });
    mocks.photoFind.mockReturnValue(sortSelectMock([frontalPhoto, perfilPhoto]));
    mocks.readEncryptedFacePhotoFile.mockImplementation(async (photo) =>
        Buffer.from(`${photo.kind}-image-bytes`),
    );
    mocks.analyzeSkinPhotos.mockResolvedValue(makeProviderResult());
    mocks.analysisFindOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
    });
    mocks.analysisCreate.mockResolvedValue(makeAnalysis());

    return { frontalPhoto, perfilPhoto };
}

describe("MF6/BK-MF6-01 - budget da analise facial", () => {
    beforeEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        mocks.metricCreate.mockResolvedValue({});
    });

    it("regista metrica minimizada de sucesso para a operacao completa", async () => {
        const result = await runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
            task: async () => "ok",
        });

        expect(result.value).toBe("ok");
        expect(result.durationMs).toEqual(expect.any(Number));
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                durationMs: expect.any(Number),
                status: "success",
                budgetMs: 10000,
            }),
        );
        expect(mocks.metricCreate.mock.calls[0][0]).not.toEqual(
            expect.objectContaining({
                userId: expect.anything(),
                storageKey: expect.anything(),
                token: expect.anything(),
                report: expect.anything(),
            }),
        );
    });

    it("devolve 503 e regista timeout quando o provider excede o budget", async () => {
        vi.useFakeTimers();
        arrangeValidAnalysis();
        mocks.analyzeSkinPhotos.mockImplementation(
            () =>
                new Promise((resolve) => {
                    setTimeout(resolve, FACE_ANALYSIS_BUDGET_MS + 1);
                }),
        );

        const promise = createFaceAnalysisForUser(userId, {
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
        });
        const expectation = expect(promise).rejects.toMatchObject({
            statusCode: 503,
            message: "A análise facial demorou demasiado. Tenta novamente.",
        });

        await vi.advanceTimersByTimeAsync(FACE_ANALYSIS_BUDGET_MS);
        await expectation;
        await vi.advanceTimersByTimeAsync(1);

        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "timeout",
                budgetMs: 10000,
            }),
        );
    });

    it("não escreve análise quando o pedido aborta após o provider responder", async () => {
        const controller = new AbortController();
        arrangeValidAnalysis();
        mocks.analyzeSkinPhotos.mockImplementation(async () => {
            controller.abort(
                new AppError(503, "Pedido excedeu o tempo limite."),
            );
            return makeProviderResult();
        });

        await expect(
            createFaceAnalysisForUser(userId, {
                signal: controller.signal,
            }),
        ).rejects.toMatchObject({
            statusCode: 503,
            message: "Pedido excedeu o tempo limite.",
        });
        await Promise.resolve();

        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.readEncryptedFacePhotoFile).toHaveBeenCalledWith(
            expect.any(Object),
            { signal: expect.any(AbortSignal) },
        );
    });

    it("remove POST /api/face-analyses antes de ler consentimento", async () => {
        mocks.consentFindOne.mockResolvedValue(null);

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(mocks.consentFindOne).not.toHaveBeenCalled();
        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "http_request",
                route: "/api/face-analyses",
                status: "client_error",
                statusCode: 404,
            }),
        );
    });

    it("não revela a existência das fotografias através do endpoint substituído", async () => {
        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(mocks.photoFind).not.toHaveBeenCalled();
        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "http_request",
                route: "/api/face-analyses",
                status: "client_error",
                statusCode: 404,
            }),
        );
    });

    it("não devolve dados sensíveis no erro de migração do endpoint antigo", async () => {
        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain(userId);
        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.analysisCreate).not.toHaveBeenCalled();
    });

    it("classifica falhas inesperadas como erro sem mascarar AppError", async () => {
        await expect(
            runWithPerformanceBudget({
                operation: FACE_ANALYSIS_OPERATION,
                budgetMs: FACE_ANALYSIS_BUDGET_MS,
                task: async () => {
                    throw new AppError(400, "Falha controlada");
                },
            }),
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "error",
                budgetMs: 10000,
            }),
        );
    });

    it("compõe cancelamento do pedido com o budget e rejeita tarefa não cooperativa", async () => {
        const controller = new AbortController();
        let taskSignal;
        const neverFinishes = runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
            signal: controller.signal,
            task: async ({ signal }) => {
                taskSignal = signal;
                return new Promise(() => undefined);
            },
        });

        controller.abort(new AppError(503, "Pedido excedeu o tempo limite."));

        await expect(neverFinishes).rejects.toMatchObject({
            statusCode: 503,
            message: "Pedido excedeu o tempo limite.",
        });
        expect(taskSignal.aborted).toBe(true);
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error" }),
        );
    });
});
