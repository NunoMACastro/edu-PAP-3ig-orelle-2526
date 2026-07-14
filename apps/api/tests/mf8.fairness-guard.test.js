/**
 * Testes de RNF24 para o guard de fairness de recomendacoes.
 */
import { describe, expect, it } from "vitest";
import {
    assertRecommendationFairness,
    assertRespectfulPublicText,
    buildFairnessSafeRankingInputs,
} from "../src/services/ai-fairness-guard.service.js";

/**
 * Cria uma recomendacao segura suficiente para testar RNF24.
 *
 * @function makeSafeRecommendation
 * @param {object} [overrides={}] - Campos a substituir no cenario base.
 * @returns {object} Recomendacao de teste.
 */
function makeSafeRecommendation(overrides = {}) {
    return {
        reasonCodes: ["skin_type_match", "oiliness_support"],
        sourceSignals: [
            "skinType:mista",
            "oleosidade:moderada",
            "report:relatorio_cosmetico",
        ],
        explanation:
            "Gel controlo oleosidade foi recomendado porque é compatível com sinais cosméticos autorizados.",
        limitations: [
            "A sugestão é cosmética e deve ser confirmada pelo cliente antes da compra.",
        ],
        ...overrides,
    };
}

describe("BK-MF8-06 - fairness guard RNF24", () => {
    it("aceita recomendacao baseada apenas em sinais cosmeticos", () => {
        const result = assertRecommendationFairness(makeSafeRecommendation());

        expect(result).toEqual({
            status: "checked",
            policyVersion: "fair-ranking-v2",
            protectedAttributes: ["genero", "idade", "tom_de_pele"],
            limitations: [
                "A verificação cobre apenas os campos e sinais usados pelo ranking; não prova ausência total de enviesamento.",
                "Providers reais podem refletir limitações dos respetivos dados e modelos.",
            ],
        });
    });

    it("remove atributos protegidos do perfil antes do ranking", () => {
        const result = buildFairnessSafeRankingInputs({
            profile: {
                genero: "feminino",
                idade: 19,
                tomDePele: "escuro",
                allergies: ["Lanolina"],
                avoidIngredients: ["Perfume"],
                objetivos: ["luminosidade"],
            },
        });

        expect(result.restrictionProfile).toEqual({
            allergies: ["Lanolina"],
            avoidIngredients: ["Perfume"],
        });
        expect(JSON.stringify(result)).not.toContain("feminino");
        expect(JSON.stringify(result)).not.toContain("19");
        expect(JSON.stringify(result)).not.toContain("escuro");
        expect(JSON.stringify(result)).not.toContain("objetivos");
    });

    it("aceita apenas valores guiados estruturados e ignora texto livre ou atributos protegidos", () => {
        const result = buildFairnessSafeRankingInputs({
            historyContext: [
                {
                    safeSignals: [
                        {
                            key: "main_goal",
                            label: "Objetivo principal",
                            value: "Mais conforto e hidratação",
                        },
                        {
                            key: "genero",
                            label: "Género",
                            value: "feminino hidratar",
                        },
                        {
                            key: "current_routine",
                            label: "Rotina livre",
                            value: "produto para mulheres",
                        },
                        {
                            key: "main_goal",
                            label: "Objetivo adulterado",
                            value: "produto para pele clara",
                        },
                    ],
                },
            ],
        });

        expect(result.historyContext).toEqual([
            {
                safeSignals: [
                    {
                        key: "main_goal",
                        label: "Objetivo cosmético principal",
                        value: "Mais conforto e hidratação",
                    },
                ],
            },
        ]);
    });

    it("bloqueia fonte sensivel usada como origem da recomendacao", () => {
        expect(() =>
            assertRecommendationFairness(
                makeSafeRecommendation({
                    sourceSignals: ["skinType:mista", "genero:feminino"],
                }),
            ),
        ).toThrow("Recomendação usa atributo sensível como fonte");
    });

    it("bloqueia motivo tecnico baseado em atributo sensivel", () => {
        expect(() =>
            assertRecommendationFairness(
                makeSafeRecommendation({
                    reasonCodes: ["skin_type_match", "age_match"],
                }),
            ),
        ).toThrow("Recomendação usa atributo sensível como motivo");
    });

    it("bloqueia texto publico discriminatorio por genero", () => {
        expect(() =>
            assertRespectfulPublicText(
                "Mulheres não devem usar este produto por serem inadequadas para esta rotina.",
            ),
        ).toThrow("Texto público discrimina por género");
    });
});
