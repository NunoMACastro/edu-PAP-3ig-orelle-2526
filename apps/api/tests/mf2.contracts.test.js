/**
 * Testes unitarios da MF2 para contratos sem abrir servidor HTTP.
 */
import { describe, expect, it } from "vitest";
import { createBeforeAfterVisualizationPreview } from "../src/providers/before-after-visualization.provider.js";
import { createMakeupPreview } from "../src/providers/makeup-simulation.provider.js";
import { buildRecommendationReason } from "../src/services/recommendation-reason.service.js";
import { validateBeforeAfterVisualizationInput } from "../src/validators/before-after-visualization.validator.js";
import { validateMakeupSimulationInput } from "../src/validators/makeup-simulation.validator.js";
import { validateRecommendationFeedbackInput } from "../src/validators/recommendation-feedback.validator.js";
import { validateRecommendationReviewInput } from "../src/validators/recommendation-review.validator.js";

const productId = "66c000000000000000000001";
const simulationId = "66c000000000000000000002";
const recommendationId = "66c000000000000000000003";

function makeProduct(overrides = {}) {
    return {
        _id: productId,
        name: "Gel controlo oleosidade",
        brandName: "Orélle",
        stock: 8,
        ...overrides,
    };
}

describe("MF2 - contratos unitarios", () => {
    it("gera motivo publico apenas com sinais cosmeticos validados", () => {
        const reason = buildRecommendationReason({
            product: makeProduct(),
            reasonCodes: ["skin_type_match", "oiliness_support"],
            sourceSignals: ["skinType:mista", "oleosidade:moderada"],
        });

        expect(reason.reasonCodes).toEqual([
            "skin_type_match",
            "oiliness_support",
        ]);
        expect(reason.explanation).toContain("Gel controlo oleosidade");
        expect(reason.explanation).toContain("cosmetica");
    });

    it("rejeita recomendacao sem motivo cosmetico", () => {
        expect(() =>
            buildRecommendationReason({
                product: makeProduct(),
                reasonCodes: [],
                sourceSignals: [],
            }),
        ).toThrow("Recomendacao sem motivo cosmetico suficiente");
    });

    it("valida feedback e bloqueia valores livres", () => {
        expect(
            validateRecommendationFeedbackInput(
                { recommendationId },
                { value: "util" },
            ),
        ).toEqual({ recommendationId, feedback: "util" });

        expect(
            validateRecommendationFeedbackInput(
                { recommendationId },
                { feedback: "nao_relevante" },
            ),
        ).toEqual({ recommendationId, feedback: "nao_relevante" });

        expect(() =>
            validateRecommendationFeedbackInput(
                { recommendationId },
                { value: "talvez" },
            ),
        ).toThrow("Feedback inválido");
    });

    it("valida revisao manual e exige explicacao quando ajustada", () => {
        expect(
            validateRecommendationReviewInput(
                { recommendationId },
                {
                    status: "approved",
                    note: "Recomendação coerente com a análise.",
                },
            ),
        ).toEqual({
            recommendationId,
            status: "approved",
            note: "Recomendação coerente com a análise.",
            adjustedExplanation: null,
        });

        expect(() =>
            validateRecommendationReviewInput(
                { recommendationId },
                { status: "adjusted", note: "Ajustar motivo." },
            ),
        ).toThrow("Explicação ajustada obrigatória");
    });

    it("cria preview de maquilhagem sem devolver fotografia privada", () => {
        const preview = createMakeupPreview({
            facePhoto: { _id: "66f000000000000000000001" },
            product: makeProduct(),
        });

        expect(preview.providerName).toBe("local-makeup-simulation-v1");
        expect(preview.beforePanel.description).toContain("privada");
        expect(preview.overlay.style).toBe("baseline_visual_seguro");
        expect(preview.visual.beforeImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(preview.visual.afterImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(JSON.stringify(preview)).not.toContain("storageKey");
    });

    it("valida IDs de simulacao e visualizacao", () => {
        expect(validateMakeupSimulationInput({ productId })).toEqual({ productId });
        expect(validateBeforeAfterVisualizationInput({ simulationId })).toEqual({
            simulationId,
        });

        expect(() => validateMakeupSimulationInput({ productId: "x" })).toThrow(
            "ID de produto inválido",
        );
        expect(() =>
            validateBeforeAfterVisualizationInput({ simulationId: "x" }),
        ).toThrow("ID de simulação inválido");
    });

    it("cria visualizacao antes/depois apenas com recomendacoes validas", () => {
        const visualization = createBeforeAfterVisualizationPreview({
            simulation: {
                preview: {
                    beforePanel: {
                        label: "Antes",
                        description: "Fotografia privada validada.",
                        accentColor: "#94a3b8",
                    },
                    afterPanel: {
                        label: "Depois",
                        description: "Preview baseline.",
                        accentColor: "#123456",
                    },
                    visual: {
                        type: "safe_svg_preview",
                        beforeImageUrl:
                            "data:image/svg+xml;charset=utf-8,%3Csvg%3Eantes%3C%2Fsvg%3E",
                        afterImageUrl:
                            "data:image/svg+xml;charset=utf-8,%3Csvg%3Edepois%3C%2Fsvg%3E",
                        altText: "Preview visual seguro.",
                    },
                    limitations: ["Baseline seguro."],
                },
            },
            recommendations: [
                {
                    productId: {
                        name: "Gel controlo oleosidade",
                    },
                },
            ],
        });

        expect(visualization.recommendedProductNames).toEqual([
            "Gel controlo oleosidade",
        ]);
        expect(visualization.visualComparison.beforeImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(visualization.visualComparison.afterImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(JSON.stringify(visualization)).not.toContain("facePhotoId");
    });
});
