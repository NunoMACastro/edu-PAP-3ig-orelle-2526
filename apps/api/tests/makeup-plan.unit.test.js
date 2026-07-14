/** Contratos do plano de maquilhagem simplificado e da personalização avançada. */
import { describe, expect, it } from "vitest";
import {
    buildDeterministicQuestionPlan,
    resolveApplicableQuestionPlanSlots,
} from "../src/constants/ai-consultation-goals.js";
import {
    buildResolvedMakeupFacts,
    constrainMakeupFunctionSlot,
    resolveMakeupPlan,
} from "../src/services/makeup-plan.service.js";
import { normalizeAnswerForQuestion } from "../src/validators/ai-consultation.validator.js";

const GOALS = {
    primaryGoal: "makeup",
    secondaryGoals: ["hydration_barrier", "spots_tone_luminosity"],
};

function snapshot() {
    return {
        slotCodes: buildDeterministicQuestionPlan(
            GOALS.primaryGoal,
            GOALS.secondaryGoals,
        ).map(({ code }) => code),
    };
}

describe("plano de maquilhagem do wizard", () => {
    it("omite a lista avançada nos perfis simples e só a abre em Personalizar", () => {
        const balanced = resolveApplicableQuestionPlanSlots(
            GOALS,
            snapshot(),
            { makeup_plan_depth: "balanced" },
        );
        const custom = resolveApplicableQuestionPlanSlots(
            GOALS,
            snapshot(),
            { makeup_plan_depth: "custom" },
        );

        expect(balanced).toHaveLength(16);
        expect(balanced.map(({ code }) => code)).not.toContain(
            "makeup_functions",
        );
        expect(custom).toHaveLength(17);
        expect(custom.map(({ code }) => code)).toContain("makeup_functions");
    });

    it("aumenta o detalhe de forma coerente sem combinar skin tint e base", () => {
        const facts = {
            makeup_context: "event",
            makeup_style: "soft_glam",
            makeup_regions: ["complexion", "cheeks", "eyes", "brows", "lips"],
            coverage_preference: "medium",
            finish_preference: "luminous",
            makeup_wear_priority: "longwear",
        };
        const essential = resolveMakeupPlan({
            ...facts,
            makeup_plan_depth: "essential",
        });
        const balanced = resolveMakeupPlan({
            ...facts,
            makeup_plan_depth: "balanced",
        });
        const elaborate = resolveMakeupPlan({
            ...facts,
            makeup_plan_depth: "elaborate",
        });

        expect(essential.functions.length).toBeLessThan(
            balanced.functions.length,
        );
        expect(balanced.functions.length).toBeLessThan(
            elaborate.functions.length,
        );
        for (const plan of [essential, balanced, elaborate]) {
            expect(
                plan.functions.filter((item) =>
                    ["skin_tint", "foundation"].includes(item),
                ),
            ).toHaveLength(1);
        }
        expect(essential.functions).not.toContain("contour");
        expect(elaborate.functions).toEqual(
            expect.arrayContaining(["contour", "lip_liner", "setting_spray"]),
        );
    });

    it("limita a personalização às regiões pedidas e preserva a escolha explícita", () => {
        const plan = resolveMakeupPlan({
            makeup_plan_depth: "custom",
            makeup_regions: ["eyes", "lips"],
            makeup_functions: [
                "foundation",
                "eyeshadow",
                "mascara",
                "lip_liner",
                "lipstick",
                "setting_spray",
            ],
        });

        expect(plan.customized).toBe(true);
        expect(plan.functions).toEqual([
            "eyeshadow",
            "mascara",
            "lip_liner",
            "lipstick",
            "setting_spray",
        ]);
        expect(
            buildResolvedMakeupFacts({
                makeup_plan_depth: "custom",
                makeup_regions: ["eyes"],
                makeup_functions: ["foundation", "eyeliner"],
            }).makeup_functions,
        ).toEqual(["eyeliner"]);
    });

    it("agrupa apenas opções relevantes e rejeita duas bases equivalentes", () => {
        const slot = buildDeterministicQuestionPlan("makeup", []).find(
            ({ code }) => code === "makeup_functions",
        );
        const constrained = constrainMakeupFunctionSlot(slot, {
            makeup_regions: ["complexion"],
        });

        expect(constrained.options).toContain("foundation");
        expect(constrained.options).not.toContain("eyeliner");
        expect(constrained.presentation.groups.map(({ label }) => label)).toEqual([
            "Preparação e pele",
            "Fixação",
        ]);
        expect(() =>
            normalizeAnswerForQuestion(constrained, [
                "skin_tint",
                "foundation",
            ]),
        ).toThrow("alternativas equivalentes");
        expect(
            normalizeAnswerForQuestion(constrained, [
                "foundation",
                "concealer",
            ]),
        ).toEqual(["foundation", "concealer"]);
    });
});
