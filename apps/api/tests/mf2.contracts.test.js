/**
 * Testes unitários da MF2 para contratos sem abrir servidor HTTP.
 */
import { describe, expect, it } from "vitest";
import { GENERATIVE_MAKEUP_NOTICE_VERSION } from "../src/constants/purpose-grants.js";
import { buildRecommendationReason } from "../src/services/recommendation-reason.service.js";
import {
    validateMakeupSimulationId,
    validateMakeupSimulationInput,
} from "../src/validators/makeup-simulation.validator.js";
import { validateRecommendationFeedbackInput } from "../src/validators/recommendation-feedback.validator.js";
import { validateRecommendationReviewInput } from "../src/validators/recommendation-review.validator.js";

const productId = "66c000000000000000000001";
const reportId = "66c000000000000000000002";
const simulationId = "66c000000000000000000004";
const recommendationId = "66c000000000000000000003";

/**
 * Cria um produto mock suficiente para validar contratos unitários da MF2.
 *
 * @function makeProduct
 * @param {object} [overrides={}] - Campos a sobrepor no produto base.
 * @returns {object} Produto mock.
 */
function makeProduct(overrides = {}) {
    return {
        _id: productId,
        name: "Gel controlo oleosidade",
        brandName: "Orélle",
        stock: 8,
        ...overrides,
    };
}

describe("MF2 - contratos unitários", () => {
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
        expect(reason.explanation).toContain("cosmética");
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

        expect(() =>
            validateRecommendationReviewInput(
                { recommendationId },
                {
                    status: "adjusted",
                    note: "Ajustar motivo.",
                    adjustedExplanation: "x".repeat(601),
                },
            ),
        ).toThrow("Explicação ajustada inválida");

        expect(
            validateRecommendationReviewInput(
                { recommendationId },
                {
                    status: "approved",
                    note: "Recomendação coerente.",
                    adjustedExplanation: "texto que não deve ser persistido",
                },
            ).adjustedExplanation,
        ).toBeNull();
    });

    it("exige relatório próprio e consentimento pontual na edição OpenAI", () => {
        expect(
            validateMakeupSimulationInput({
                reportId,
                generativeEditAccepted: true,
                generativeEditNoticeVersion: GENERATIVE_MAKEUP_NOTICE_VERSION,
            }),
        ).toEqual({
            reportId,
            generativeEditAccepted: true,
            generativeEditNoticeVersion: GENERATIVE_MAKEUP_NOTICE_VERSION,
        });
        expect(validateMakeupSimulationId({ simulationId })).toBe(simulationId);

        expect(() =>
            validateMakeupSimulationInput({
                reportId,
                generativeEditAccepted: false,
                generativeEditNoticeVersion: GENERATIVE_MAKEUP_NOTICE_VERSION,
            }),
        ).toThrow("Consentimento generativo pontual obrigatório");
        expect(() => validateMakeupSimulationId({ simulationId: "x" })).toThrow(
            "ID de simulação inválido",
        );
    });
});
