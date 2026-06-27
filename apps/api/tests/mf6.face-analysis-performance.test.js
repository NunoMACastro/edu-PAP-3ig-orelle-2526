/**
 * Testes MF6/BK-MF6-01 para budget temporal da analise facial.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
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
    analysisCreate: vi.fn(),
    metricCreate: vi.fn(),
    analyzeSkinPhotos: vi.fn(),
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
        toString() {
            return id;
        },
    };
}

/**
 * Gera token de cliente autenticado para endpoints faciais.
 *
 * @function makeToken
 * @returns {string} JWT de sessao.
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
        originalName: `${kind}.png`,
        mimeType: "image/png",
        sizeBytes: 12,
        status: "active",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

/**
 * Cria resultado controlado do provider cosmetico local.
 *
 * @function makeProviderResult
 * @returns {object} Resultado do provider.
 */
function makeProviderResult() {
    return {
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
            "Resultado de provider local controlado.",
        ],
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
        revokedAt: null,
    });
    mocks.photoFind.mockReturnValue(sortSelectMock([frontalPhoto, perfilPhoto]));
    mocks.analyzeSkinPhotos.mockResolvedValue(makeProviderResult());
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

        const promise = createFaceAnalysisForUser(userId);
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

    it("bloqueia POST /api/face-analyses sem consentimento ativo", async () => {
        mocks.consentFindOne.mockResolvedValue(null);

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe("Consentimento facial em falta");
        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "error",
            }),
        );
    });

    it("bloqueia POST /api/face-analyses sem fotografia de perfil", async () => {
        mocks.consentFindOne.mockResolvedValue({
            _id: objectId(consentId),
            userId,
            revokedAt: null,
        });
        mocks.photoFind.mockReturnValue(
            sortSelectMock([makePhoto("frontal", frontalId)]),
        );

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Fotografias frontal e de perfil obrigatórias",
        );
        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.analysisCreate).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "error",
            }),
        );
    });

    it("mantem resposta publica com performance e sem dados sensiveis", async () => {
        const { frontalPhoto, perfilPhoto } = arrangeValidAnalysis();

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(201);
        expect(response.body.analysis.performance).toEqual({
            durationMs: expect.any(Number),
            budgetMs: 10000,
        });
        expect(response.body.analysis.storageKey).toBeUndefined();
        expect(response.body.analysis.userId).toBeUndefined();
        expect(mocks.analyzeSkinPhotos).toHaveBeenCalledWith({
            frontalPhoto,
            perfilPhoto,
        });
        expect(mocks.analysisCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                photoIds: [frontalPhoto._id, perfilPhoto._id],
                consentId: expect.any(Object),
                providerName: "local-skin-analysis-v1",
            }),
        );
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "success",
                budgetMs: 10000,
            }),
        );
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
});
