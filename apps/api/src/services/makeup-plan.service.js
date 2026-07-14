/**
 * Derivação determinística do plano de maquilhagem a partir de intenções simples.
 *
 * A fotografia nunca decide o que a pessoa "precisa" de esconder. Este módulo
 * usa apenas escolhas explícitas do wizard e enums fechados do catálogo. O
 * resultado é partilhado por ranking, relatório e pré-visualização.
 */
import { PRODUCT_MAKEUP_FUNCTIONS } from "../constants/domain.constants.js";
import { getAiConsultationOptionLabel } from "../constants/ai-consultation-goals.js";

export const MAKEUP_PLAN_DEPTHS = Object.freeze([
    "essential",
    "balanced",
    "elaborate",
    "custom",
]);

const FUNCTION_ORDER = new Map(
    PRODUCT_MAKEUP_FUNCTIONS.map((makeupFunction, index) => [
        makeupFunction,
        index,
    ]),
);
const MAKEUP_REGIONS = new Set([
    "complexion",
    "cheeks",
    "eyes",
    "brows",
    "lips",
]);
const FUNCTION_REGION = Object.freeze({
    primer: "complexion",
    skin_tint: "complexion",
    foundation: "complexion",
    color_corrector: "complexion",
    concealer: "complexion",
    setting_powder: "complexion",
    blush: "cheeks",
    bronzer: "cheeks",
    contour: "cheeks",
    highlighter: "cheeks",
    eyeshadow: "eyes",
    eyeliner: "eyes",
    mascara: "eyes",
    brow_product: "brows",
    lip_liner: "lips",
    lipstick: "lips",
    lip_gloss: "lips",
    setting_spray: "global",
});

function list(value) {
    return [
        ...new Set(
            (Array.isArray(value) ? value : [])
                .map(String)
                .filter(Boolean),
        ),
    ];
}

function hasRegion(regions, region) {
    return regions.includes(region);
}

/** Devolve apenas funções coerentes com as regiões explicitamente pedidas. */
export function getMakeupFunctionsForRegions(regionsValue) {
    const regions = list(regionsValue).filter((value) =>
        MAKEUP_REGIONS.has(value),
    );
    if (regions.length === 0) return [...PRODUCT_MAKEUP_FUNCTIONS];
    return PRODUCT_MAKEUP_FUNCTIONS.filter((makeupFunction) => {
        const region = FUNCTION_REGION[makeupFunction];
        return region === "global" || regions.includes(region);
    });
}

/** Ajusta a pergunta avançada às regiões já escolhidas no wizard. */
export function constrainMakeupFunctionSlot(slot, facts = {}) {
    if (slot?.code !== "makeup_functions") return slot;
    const allowed = new Set(getMakeupFunctionsForRegions(facts.makeup_regions));
    return {
        ...slot,
        options: (slot.options ?? []).filter((option) => allowed.has(option)),
        presentation: {
            ...(slot.presentation ?? {}),
            groups: (slot.presentation?.groups ?? [])
                .map((group) => ({
                    ...group,
                    options: (group.options ?? []).filter((option) =>
                        allowed.has(option),
                    ),
                }))
                .filter((group) => group.options.length > 0),
        },
    };
}

function preferredComplexionBase(facts, depth) {
    const coverage = String(facts?.coverage_preference ?? "no_preference");
    const style = String(facts?.makeup_style ?? "no_preference");
    if (depth === "elaborate" || ["medium", "full"].includes(coverage)) {
        return "foundation";
    }
    return coverage === "light" || style === "natural_everyday"
        ? "skin_tint"
        : "foundation";
}

/**
 * Resolve as funções pedidas sem permitir combinações automáticas incoerentes.
 * `custom` e sessões legacy preservam a escolha explícita; os restantes perfis
 * são construídos por região, cobertura, estilo, acabamento e duração.
 *
 * @param {Record<string, unknown>} facts - Factos estruturados da consulta.
 * @returns {{depth: string, functions: string[], customized: boolean}}
 */
export function resolveMakeupPlan(facts = {}) {
    const rawDepth = String(facts.makeup_plan_depth ?? "");
    const allowedForRegions = new Set(
        getMakeupFunctionsForRegions(facts.makeup_regions),
    );
    const legacyFunctions = list(facts.makeup_functions).filter(
        (value) => FUNCTION_ORDER.has(value) && allowedForRegions.has(value),
    );
    const legacy = !rawDepth && legacyFunctions.length > 0;
    const depth = MAKEUP_PLAN_DEPTHS.includes(rawDepth)
        ? rawDepth
        : legacy
          ? "custom"
          : "balanced";

    if (depth === "custom") {
        return {
            depth,
            functions: legacyFunctions.sort(
                (left, right) =>
                    FUNCTION_ORDER.get(left) - FUNCTION_ORDER.get(right),
            ),
            customized: true,
        };
    }

    const regions = list(facts.makeup_regions).filter((value) =>
        MAKEUP_REGIONS.has(value),
    );
    const functions = new Set();
    const style = String(facts.makeup_style ?? "no_preference");
    const finish = String(facts.finish_preference ?? "no_preference");
    const coverage = String(facts.coverage_preference ?? "no_preference");
    const wear = String(facts.makeup_wear_priority ?? "no_preference");
    const context = String(facts.makeup_context ?? "");
    const longWear = ["longwear", "photo_ready", "oil_control"].includes(wear);
    const eventContext = ["event", "photography"].includes(context);

    if (hasRegion(regions, "complexion")) {
        if (
            depth === "elaborate" ||
            (depth === "balanced" && (longWear || eventContext))
        ) {
            functions.add("primer");
        }
        functions.add(preferredComplexionBase(facts, depth));
        if (
            depth === "elaborate" ||
            ["medium", "full"].includes(coverage)
        ) {
            functions.add("concealer");
        }
        if (
            depth === "elaborate" ||
            (depth === "balanced" &&
                (finish === "matte" || longWear))
        ) {
            functions.add("setting_powder");
        }
    }

    if (hasRegion(regions, "cheeks")) {
        functions.add("blush");
        if (depth !== "essential") functions.add("bronzer");
        if (depth === "elaborate") functions.add("contour");
        if (
            depth === "elaborate" ||
            (depth === "balanced" &&
                ["luminous", "soft_glam", "gala_evening"].includes(
                    finish === "luminous" ? finish : style,
                ))
        ) {
            functions.add("highlighter");
        }
    }

    if (hasRegion(regions, "eyes")) {
        if (depth !== "essential") functions.add("eyeshadow");
        if (
            depth === "elaborate" ||
            (depth === "balanced" && style !== "natural_everyday")
        ) {
            functions.add("eyeliner");
        }
        functions.add("mascara");
    }

    if (hasRegion(regions, "brows")) functions.add("brow_product");

    if (hasRegion(regions, "lips")) {
        const prefersGloss =
            coverage === "light" ||
            finish === "luminous" ||
            style === "natural_everyday";
        if (depth === "essential") {
            functions.add(prefersGloss ? "lip_gloss" : "lipstick");
        } else {
            if (depth === "elaborate") functions.add("lip_liner");
            functions.add("lipstick");
            if (prefersGloss || style === "soft_glam") {
                functions.add("lip_gloss");
            }
        }
    }

    if (
        regions.length > 0 &&
        (depth === "elaborate" ||
            (depth === "balanced" && (longWear || eventContext)))
    ) {
        functions.add("setting_spray");
    }

    return {
        depth,
        functions: [...functions].sort(
            (left, right) =>
                FUNCTION_ORDER.get(left) - FUNCTION_ORDER.get(right),
        ),
        customized: false,
    };
}

/**
 * DTO público compacto usado na revisão final do wizard.
 *
 * @param {Record<string, unknown>} facts - Factos estruturados da consulta.
 * @returns {{depth: string, depthLabel: string, customized: boolean, functions: Array<{code: string, label: string}>}}
 */
export function buildPublicMakeupPlan(facts = {}) {
    const plan = resolveMakeupPlan(facts);
    return {
        depth: plan.depth,
        depthLabel: getAiConsultationOptionLabel(plan.depth),
        customized: plan.customized,
        functions: plan.functions.map((code) => ({
            code,
            label: getAiConsultationOptionLabel(code),
        })),
    };
}

/**
 * Materializa as funções deduzidas apenas no snapshot operacional enviado ao
 * catálogo e aos providers. As respostas originais do utilizador permanecem
 * intactas na sessão, incluindo a escolha simples de profundidade.
 *
 * @param {Record<string, unknown>} facts - Factos persistidos da consulta.
 * @returns {Record<string, unknown>} Snapshot com funções canónicas resolvidas.
 */
export function buildResolvedMakeupFacts(facts = {}) {
    return {
        ...facts,
        makeup_functions: resolveMakeupPlan(facts).functions,
    };
}
