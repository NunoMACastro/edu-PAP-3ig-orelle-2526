import { beforeEach, describe, expect, it, vi } from "vitest";

// Os mocks ficam hoisted para o Vitest substituir models e provider antes de carregar os imports reais do service.
const mocks = vi.hoisted(() => ({
    metricCreate: vi.fn(),
    consentFindOne: vi.fn(),
    photoFind: vi.fn(),
    analysisCreate: vi.fn(),
    analyzeSkinPhotos: vi.fn(),
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: mocks.metricCreate,
    },
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

vi.mock("../src/providers/skin-analysis.provider.js", () => ({
    analyzeSkinPhotos: mocks.analyzeSkinPhotos,
}));

import {
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "../src/services/performance-budget.service.js";
import { createFaceAnalysisForUser } from "../src/services/face-analysis.service.js";

function mockActivePhotos(photos) {
    // Replica o encadeamento sort().select() do model para testar o contrato sem tocar na base de dados.
    const select = vi.fn().mockResolvedValue(photos);
    const sort = vi.fn().mockReturnValue({ select });

    mocks.photoFind.mockReturnValue({ sort });
}

describe("BK-MF6-01 face analysis performance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.metricCreate.mockResolvedValue({});
    });

    it("regista sucesso dentro do orçamento sem dados sensíveis", async () => {
        const result = await runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
            task: async () => "ok",
        });

        expect(result).toBe("ok");
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "success",
                budgetMs: 10_000,
            }),
        );

        const metric = mocks.metricCreate.mock.calls[0][0];
        expect(metric).not.toHaveProperty("userId");
        expect(metric).not.toHaveProperty("storageKey");
        expect(metric).not.toHaveProperty("photo");
        expect(metric).not.toHaveProperty("report");
        expect(metric).not.toHaveProperty("token");
    });

    it("devolve timeout controlado quando o orçamento é ultrapassado", async () => {
        await expect(
            runWithPerformanceBudget({
                operation: FACE_ANALYSIS_OPERATION,
                budgetMs: 1,
                task: () => new Promise((resolve) => {
                    setTimeout(resolve, 20);
                }),
            }),
        ).rejects.toMatchObject({
            statusCode: 503,
            message: "A análise facial demorou demasiado. Tenta novamente.",
        });

        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "timeout",
                budgetMs: 1,
            }),
        );
    });

    it("bloqueia análise sem consentimento ativo antes de chamar o provider", async () => {
        mocks.consentFindOne.mockResolvedValue(null);

        await expect(createFaceAnalysisForUser("user-1")).rejects.toMatchObject({
            statusCode: 403,
            message: "Consentimento facial em falta",
        });

        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error" }),
        );
    });

    it("bloqueia análise sem fotografias frontal e de perfil", async () => {
        // Este negativo prova que a otimização não pode contornar os requisitos biométricos mínimos.
        mocks.consentFindOne.mockResolvedValue({ _id: "consent-1" });
        mockActivePhotos([
            {
                _id: "front-1",
                kind: "frontal",
                storageKey: "private/front.jpg",
            },
        ]);

        await expect(createFaceAnalysisForUser("user-1")).rejects.toMatchObject({
            statusCode: 400,
            message: "Fotografias frontal e de perfil obrigatórias",
        });

        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error" }),
        );
    });

    it("cria análise válida e preserva resposta pública minimizada", async () => {
        const createdAt = new Date("2026-06-23T10:00:00.000Z");

        mocks.consentFindOne.mockResolvedValue({ _id: "consent-1" });
        mockActivePhotos([
            {
                _id: "front-1",
                kind: "frontal",
                storageKey: "private/front.jpg",
            },
            {
                _id: "side-1",
                kind: "perfil",
                storageKey: "private/side.jpg",
            },
        ]);
        mocks.analyzeSkinPhotos.mockResolvedValue({
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
        });
        mocks.analysisCreate.mockResolvedValue({
            _id: { toString: () => "analysis-1" },
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
            status: "completed",
            createdAt,
        });

        const result = await createFaceAnalysisForUser("user-1");

        expect(mocks.analysisCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user-1",
                photoIds: ["front-1", "side-1"],
                consentId: "consent-1",
            }),
        );
        expect(result).toEqual({
            id: "analysis-1",
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
            status: "completed",
            createdAt,
        });
        expect(result).not.toHaveProperty("storageKey");
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "success" }),
        );
    });
});