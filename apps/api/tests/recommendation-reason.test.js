import { describe, expect, it } from "vitest";
import { buildRecommendationReason } from "../src/services/recommendation-reason.service.js";

const baseProduct = {
    name: "Gel Seborregulador",
};

function createAnalysis(overrides = {}) {
    return {
        findings: {
            skinType: { label: "oleosa" },
            acne: { label: "moderada" },
            manchas: { label: "nao_conclusivo" },
            rugas: { label: "nao_conclusivo" },
            oleosidade: { label: "alta" },
            ...overrides,
        },
    };
}
describe("BK-MF2-03 / RF19 - motivos de recomendação", () => {
    it("gera códigos e explicação pública a partir do ranking verificado", () => {
        const reason = buildRecommendationReason({
            analysis: createAnalysis(),
            product: baseProduct,
            ranking: {
                reasonCodes: ["skin_type_oleosa", "oleosidade_alta"],
                sourceSignals: ["skinType", "oleosidade"],
            },
        });

        expect(reason.reasonCodes).toContain("skin_type_oleosa");
        expect(reason.sourceSignals).toContain("oleosidade");
        expect(reason.explanation).toContain("Gel Seborregulador");
        expect(reason.explanation).toContain("não é diagnóstico médico");
    });

    it("bloqueia recomendação com motivo apenas comercial", () => {
        expect(() =>
            buildRecommendationReason({
                analysis: createAnalysis(),
                product: baseProduct,
                ranking: {
                    reasonCodes: ["stock_available"],
                    sourceSignals: ["stock"],
                },
            }),
        ).toThrow("A recomendação precisa de pelo menos um motivo cosmético");
    });

    it("bloqueia recomendação sem fonte verificável", () => {
        expect(() =>
            buildRecommendationReason({
                analysis: createAnalysis(),
                product: baseProduct,
                ranking: {
                    reasonCodes: ["skin_type_oleosa"],
                    sourceSignals: [],
                },
            }),
        ).toThrow("A recomendação precisa de pelo menos uma fonte verificável");
    });
});