/**
 * Ranking determinístico do catálogo para relatórios cosméticos v4.
 *
 * Este módulo é deliberadamente puro: recebe snapshots já filtrados e devolve
 * uma seleção ordenada, explicável e independente da ordem da base de dados.
 * Disponibilidade, restrições e orçamento são gates externos; nenhum atributo
 * protegido ou texto livre participa no score.
 */
import { buildRecommendationReason } from "./recommendation-reason.service.js";
import { resolveMakeupPlan } from "./makeup-plan.service.js";

export const CATALOG_RANKING_POLICY_VERSION = "catalog-ranking-v3";

const MAKEUP_VISUAL_ROLES = Object.freeze([
    "complexion",
    "cheeks",
    "eyes",
    "brows",
    "lips",
]);
const LIGHT_TEXTURES = new Set(["gel", "water", "serum", "gel_cream", "fluid"]);

const WEIGHTS = Object.freeze({
    primaryGoal: 40,
    secondaryGoal: 15,
    skinType: 15,
    fragranceFree: 5,
    lightTexture: 5,
    makeupRegion: 15,
    makeupFunction: 18,
    makeupStyle: 8,
    makeupWear: 7,
    finish: 8,
    coverage: 7,
});

function cleanList(value) {
    return [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))];
}

function compareText(left, right) {
    return String(left ?? "").localeCompare(String(right ?? ""), "pt", {
        sensitivity: "base",
    });
}

function getVisualRoles(candidate) {
    const roles = cleanList([
        ...(candidate?.makeup?.regions ?? []),
        ...(candidate?.routineSteps ?? []),
    ]).filter((step) =>
        MAKEUP_VISUAL_ROLES.includes(step),
    );
    if (
        candidate?.concernTags?.includes("sun_protection") &&
        !roles.includes("complexion")
    ) {
        roles.push("complexion");
    }
    return roles;
}

function getMakeupFunctions(candidate) {
    return cleanList(candidate?.makeup?.functions);
}

function needsVariantColor(candidate, facts) {
    const requestedMakeupFunctions = resolveMakeupPlan(facts).functions;
    return (
        getMakeupFunctions(candidate).some((value) =>
            requestedMakeupFunctions.includes(value),
        ) ||
        getVisualRoles(candidate).some((role) =>
            cleanList(facts?.makeup_regions).includes(role),
        ) ||
        facts?.spf_texture_preference === "tinted"
    );
}

/**
 * Escolhe uma sugestão inicial entre variantes disponíveis, sem inferir tom
 * de pele ou subtom.
 */
export function selectInitialCatalogVariant(candidate, facts = {}) {
    const available = (candidate?.variants ?? []).filter(
        (variant) => variant?.available === true || Number(variant?.stock) > 0,
    );
    if (available.length === 0) return null;

    const preferredFinish = String(facts?.finish_preference ?? "");
    const preferredCoverage = String(facts?.coverage_preference ?? "");
    const colorNeeded = needsVariantColor(candidate, facts);

    return [...available]
        .map((variant) => ({
            ...variant,
            variantScore:
                (preferredFinish && preferredFinish !== "no_preference" &&
                variant.finish === preferredFinish
                    ? 4
                    : 0) +
                (preferredCoverage && preferredCoverage !== "no_preference" &&
                variant.coverage === preferredCoverage
                    ? 4
                    : 0) +
                (colorNeeded && /^#[0-9A-F]{6}$/iu.test(variant.colorHex ?? "")
                    ? 2
                    : 0),
        }))
        .sort((left, right) =>
            right.variantScore - left.variantScore ||
            Number(left.priceCents) - Number(right.priceCents) ||
            compareText(left.variantId, right.variantId),
        )[0];
}

function addCriterion(state, applicable, earned, weight, reasonCode, signal) {
    if (!applicable) return;
    state.applicableWeight += weight;
    if (!earned) return;
    state.earnedWeight += weight;
    if (reasonCode) state.reasonCodes.push(reasonCode);
    if (signal) state.sourceSignals.push(signal);
}

/** Calcula o score normalizado e todas as evidências de um candidato. */
export function scoreCatalogCandidate(
    candidate,
    { objectives, facts = {}, skinType = null } = {},
) {
    const primaryGoal = objectives?.find(({ priority }) => priority === "primary")?.code;
    const secondaryGoals = (objectives ?? [])
        .filter(({ priority }) => priority === "secondary")
        .map(({ code }) => code);
    const routinePreferences = cleanList(facts?.routine_preferences);
    const requestedMakeupRegions = cleanList(facts?.makeup_regions);
    const makeupPlan = resolveMakeupPlan(facts);
    const requestedMakeupFunctions = makeupPlan.functions;
    const visualRoles = getVisualRoles(candidate);
    const makeupFunctions = getMakeupFunctions(candidate);
    const supportsRequestedMakeupRegion = requestedMakeupRegions.some((region) =>
        visualRoles.includes(region),
    );
    const suggestedVariant = selectInitialCatalogVariant(candidate, facts);
    const finish = suggestedVariant?.finish ?? candidate?.attributes?.finish;
    const coverage = suggestedVariant?.coverage ?? candidate?.attributes?.coverage;
    const state = {
        earnedWeight: 0,
        applicableWeight: 0,
        reasonCodes: [],
        sourceSignals: [],
    };

    addCriterion(
        state,
        Boolean(primaryGoal),
        candidate.concernTags?.includes(primaryGoal),
        WEIGHTS.primaryGoal,
        "goal_primary_match",
        `consultation_goal:${primaryGoal}`,
    );
    const matchedMakeupFunction = requestedMakeupFunctions.find((value) =>
        makeupFunctions.includes(value),
    );
    addCriterion(
        state,
        requestedMakeupFunctions.length > 0,
        Boolean(matchedMakeupFunction),
        WEIGHTS.makeupFunction,
        "makeup_function_match",
        matchedMakeupFunction
            ? makeupPlan.customized
                ? `consultation_preference:makeup_functions:${matchedMakeupFunction}`
                : `consultation_preference:makeup_plan_depth:${makeupPlan.depth}`
            : null,
    );
    const requestedStyle = String(facts?.makeup_style ?? "");
    addCriterion(
        state,
        Boolean(requestedStyle && requestedStyle !== "no_preference" && makeupFunctions.length),
        candidate?.makeup?.styleTags?.includes(requestedStyle),
        WEIGHTS.makeupStyle,
        "makeup_style_match",
        `consultation_preference:makeup_style:${requestedStyle}`,
    );
    const requestedWear = String(facts?.makeup_wear_priority ?? "");
    const requestedWearProfile =
        requestedWear === "hydrating_wear" ? "hydrating" : requestedWear;
    addCriterion(
        state,
        Boolean(requestedWear && requestedWear !== "no_preference" && makeupFunctions.length),
        candidate?.makeup?.wearProfiles?.includes(requestedWearProfile),
        WEIGHTS.makeupWear,
        "makeup_wear_match",
        `consultation_preference:makeup_wear_priority:${requestedWear}`,
    );
    for (const goal of secondaryGoals) {
        addCriterion(
            state,
            true,
            candidate.concernTags?.includes(goal),
            WEIGHTS.secondaryGoal,
            "goal_secondary_match",
            `consultation_goal:${goal}`,
        );
    }
    addCriterion(
        state,
        Boolean(skinType),
        candidate.skinTypes?.includes(skinType),
        WEIGHTS.skinType,
        "skin_type_match",
        `profile_skin_type:${skinType}`,
    );
    addCriterion(
        state,
        routinePreferences.includes("fragrance_free"),
        candidate.attributes?.fragranceFree === true,
        WEIGHTS.fragranceFree,
        "routine_preference_match",
        "consultation_preference:routine_preferences:fragrance_free",
    );
    addCriterion(
        state,
        routinePreferences.includes("light_texture"),
        LIGHT_TEXTURES.has(candidate.attributes?.texture),
        WEIGHTS.lightTexture,
        "routine_preference_match",
        "consultation_preference:routine_preferences:light_texture",
    );
    addCriterion(
        state,
        requestedMakeupRegions.length > 0,
        supportsRequestedMakeupRegion,
        WEIGHTS.makeupRegion,
        "makeup_region_match",
        requestedMakeupRegions
            .filter((region) => visualRoles.includes(region))
            .map((region) => `consultation_preference:makeup_regions:${region}`)[0],
    );
    addCriterion(
        state,
        supportsRequestedMakeupRegion &&
            Boolean(facts?.finish_preference) &&
            facts.finish_preference !== "no_preference",
        finish === facts?.finish_preference,
        WEIGHTS.finish,
        "finish_preference_match",
        `consultation_preference:finish_preference:${facts?.finish_preference}`,
    );
    addCriterion(
        state,
        supportsRequestedMakeupRegion &&
            Boolean(facts?.coverage_preference) &&
            facts.coverage_preference !== "no_preference",
        coverage === facts?.coverage_preference,
        WEIGHTS.coverage,
        "coverage_preference_match",
        `consultation_preference:coverage_preference:${facts?.coverage_preference}`,
    );

    state.reasonCodes.push("available_now", "within_budget");
    state.sourceSignals.push(
        "catalog_availability:available",
        "catalog_budget:within",
    );

    const score = state.applicableWeight
        ? Number((state.earnedWeight / state.applicableWeight).toFixed(4))
        : 0;
    return {
        ...candidate,
        score,
        reasonCodes: cleanList(state.reasonCodes),
        sourceSignals: cleanList(state.sourceSignals),
        suggestedVariant,
        variantId: suggestedVariant?.variantId ?? null,
        visualRoles,
        makeupFunctions,
    };
}

function compareRankedCandidates(left, right) {
    return (
        right.score - left.score ||
        Number(left.suggestedVariant?.priceCents ?? left.priceCents) -
            Number(right.suggestedVariant?.priceCents ?? right.priceCents) ||
        compareText(left.name, right.name) ||
        compareText(left.productId, right.productId)
    );
}

function candidatePrice(candidate) {
    return Number(candidate.suggestedVariant?.priceCents ?? candidate.priceCents);
}

function coverageSlots(candidate, objectives, facts) {
    const slots = new Set();
    const requestedMakeupFunctions = resolveMakeupPlan(facts).functions;
    for (const objective of objectives ?? []) {
        if (!candidate.concernTags?.includes(objective.code)) continue;
        if (objective.code !== "makeup") {
            for (const step of cleanList(candidate.routineSteps)) {
                if (!MAKEUP_VISUAL_ROLES.includes(step) && step !== "prime") {
                    slots.add(`goal:${objective.code}:step:${step}`);
                }
            }
        }
    }
    for (const makeupFunction of requestedMakeupFunctions) {
        if (candidate.makeupFunctions.includes(makeupFunction)) {
            slots.add(`makeup-function:${makeupFunction}`);
        }
    }
    for (const region of cleanList(facts?.makeup_regions)) {
        if (
            requestedMakeupFunctions.length === 0 &&
            candidate.visualRoles.includes(region)
        ) {
            slots.add(`makeup-region:${region}`);
        }
    }
    return slots;
}

/**
 * Seleciona um plano complementar completo, sem teto numérico artificial.
 * Cada função de maquilhagem ou par objetivo/passo só precisa de um produto;
 * o orçamento agregado e o catálogo determinam o tamanho final.
 */
export function selectDeterministicRecommendations(
    candidates,
    { objectives = [], facts = {}, skinType = null } = {},
) {
    const ranked = candidates
        .map((candidate) =>
            scoreCatalogCandidate(candidate, { objectives, facts, skinType }),
        )
        .sort(compareRankedCandidates);
    const budget = Number(facts?.budget_cents ?? 0);
    const hasBudget = Number.isFinite(budget) && budget > 0;
    const primaryGoal = objectives.find(({ priority }) => priority === "primary")?.code;
    const requestedMakeupFunctions = resolveMakeupPlan(facts).functions;
    const requestedSlots = new Set(
        ranked.flatMap((candidate) => [
            ...coverageSlots(candidate, objectives, facts),
        ]),
    );
    for (const makeupFunction of requestedMakeupFunctions) {
        requestedSlots.add(`makeup-function:${makeupFunction}`);
    }
    if (requestedMakeupFunctions.length === 0) {
        for (const region of cleanList(facts?.makeup_regions)) {
            requestedSlots.add(`makeup-region:${region}`);
        }
    }
    const selected = [];
    const selectedIds = new Set();
    const coveredSlots = new Set();
    let totalCents = 0;

    const canAdd = (candidate) =>
        !selectedIds.has(candidate.productId) &&
        (!hasBudget || totalCents + candidatePrice(candidate) <= budget);
    const add = (candidate) => {
        if (!candidate || !canAdd(candidate)) return false;
        selected.push(candidate);
        selectedIds.add(candidate.productId);
        totalCents += candidatePrice(candidate);
        coverageSlots(candidate, objectives, facts).forEach((slot) =>
            coveredSlots.add(slot),
        );
        return true;
    };

    const primaryCandidates = ranked.filter((candidate) =>
        candidate.concernTags?.includes(primaryGoal),
    );
    const primaryCandidate = primaryCandidates.find(
        (candidate) => coverageSlots(candidate, objectives, facts).size > 0,
    ) ?? primaryCandidates[0];
    add(primaryCandidate);

    while (
        [...requestedSlots].some((slot) => !coveredSlots.has(slot))
    ) {
        const next = ranked
            .filter(canAdd)
            .map((candidate) => ({
                candidate,
                newCoverage: [...coverageSlots(candidate, objectives, facts)].filter(
                    (slot) => requestedSlots.has(slot) && !coveredSlots.has(slot),
                ).length,
            }))
            .filter(({ newCoverage }) => newCoverage > 0)
            .sort(
                (left, right) =>
                    right.newCoverage - left.newCoverage ||
                    compareRankedCandidates(left.candidate, right.candidate),
            )[0]?.candidate;
        if (!add(next)) break;
    }

    const limitations = [];
    if (
        primaryGoal &&
        !selected.some((candidate) => candidate.concernTags?.includes(primaryGoal))
    ) {
        limitations.push(
            `O catálogo não permitiu cobrir o objetivo principal ${primaryGoal} dentro do orçamento e stock atuais.`,
        );
    }
    for (const slot of requestedSlots) {
        if (!coveredSlots.has(slot)) {
            limitations.push(
                slot.startsWith("makeup-function:")
                    ? `A função de maquilhagem ${slot.slice(16)} não tem um produto elegível disponível dentro do orçamento.`
                    : slot.startsWith("makeup-region:")
                      ? `A região de maquilhagem ${slot.slice(14)} não tem um produto elegível disponível dentro do orçamento.`
                      : `O catálogo não permitiu cobrir o passo cosmético ${slot} dentro do orçamento e stock atuais.`,
            );
        }
    }
    if (cleanList(facts?.routine_preferences).includes("vegan_preference")) {
        limitations.push(
            "A preferência vegan não influenciou o ranking porque o catálogo não possui certificação estruturada suficiente.",
        );
    }
    return {
        policyVersion: CATALOG_RANKING_POLICY_VERSION,
        selected: selected.map((candidate, index) => {
            const reason = buildRecommendationReason({
                reasonCodes: candidate.reasonCodes,
                sourceSignals: candidate.sourceSignals,
                product: candidate,
            });
            return {
                ...candidate,
                selectionRank: index + 1,
                explanation: reason.explanation,
            };
        }),
        totalCents,
        limitations: cleanList(limitations),
    };
}
