/**
 * Testes do BK-MF8-05 para explicabilidade de recomendacoes.
 */
import { describe, expect, it } from "vitest";
import {
    assertSafePublicExplanation,
    buildPublicSourceLabels,
    buildRecommendationReason,
} from "../src/services/recommendation-reason.service.js";

const product = {
    _id: "66c000000000000000000001",
    name: "Gel controlo oleosidade",
    storageKey: "/private/not-public.png",
    consentId: "66c000000000000000000099",
};

describe("BK-MF8-05 - explicabilidade de recomendacoes", () => {
    it("gera explicacao publica com motivos, fontes e limitacoes", () => {
        const reason = buildRecommendationReason({
            product,
            reasonCodes: [
                "skin_type_match",
                "oiliness_support",
                "skin_type_match",
            ],
            sourceSignals: [
                "skinType:mista",
                "oleosidade:moderada",
                "report:relatorio_cosmetico",
            ],
            profile: { lightMedicalRestrictions: ["evitar acidos fortes"] },
        });

        expect(reason.reasonCodes).toEqual([
            "skin_type_match",
            "oiliness_support",
        ]);
        expect(reason.sourceLabels).toContain(
            "tipo de pele estimado na análise facial: mista",
        );
        expect(reason.explanation).toContain("Gel controlo oleosidade");
        expect(reason.limitations.join(" ")).toContain(
            "Restrição declarada respeitada",
        );
        expect(JSON.stringify(reason)).not.toContain("storageKey");
        expect(JSON.stringify(reason)).not.toContain("consentId");
    });

    it("recusa recomendacao sem motivo ou sem fonte publica", () => {
        expect(() =>
            buildRecommendationReason({
                product,
                reasonCodes: [],
                sourceSignals: ["skinType:mista"],
            }),
        ).toThrow("Recomendacao sem motivo cosmetico suficiente");

        expect(() =>
            buildRecommendationReason({
                product,
                reasonCodes: ["skin_type_match"],
                sourceSignals: ["fontePrivada:/storage/photo.png"],
            }),
        ).toThrow("Fonte de recomendação fora do contrato público");
    });

    it("nao transforma sinais desconhecidos em fontes publicas", () => {
        expect(() =>
            buildPublicSourceLabels([
                "skinType:mista",
                "prompt:segredo-interno",
                "storageKey:/private/photo.png",
            ]),
        ).toThrow("Fonte de recomendação fora do contrato público");
    });

    it("bloqueia texto publico com promessa clinica ou certeza excessiva", () => {
        expect(() =>
            assertSafePublicExplanation("Este produto garante cura definitiva."),
        ).toThrow("Explicacao de recomendacao fora do dominio cosmetico");
    });
});
