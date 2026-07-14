/**
 * Constrói o plano visual determinístico usado pela pré-visualização cosmética.
 * A OpenAI recebe apenas este contrato fechado e nunca decide objetivos,
 * regiões, variantes obrigatórias ou precedências.
 */
import { COSMETIC_VISUAL_INTENSITIES } from "../constants/cosmetic-visualization.js";
import { resolveMakeupPlan } from "./makeup-plan.service.js";

export { COSMETIC_VISUAL_INTENSITIES } from "../constants/cosmetic-visualization.js";
export const COSMETIC_VISUAL_INTENT_VERSION = "cosmetic-visual-intent-v2";
export const COSMETIC_PRESERVATION_INVARIANTS = Object.freeze([
    "identity",
    "face_structure",
    "skin_microtexture",
    "permanent_identifying_marks",
    "hair",
    "background",
    "lighting",
    "framing",
]);

const MAKEUP_REGIONS = new Set(["complexion", "cheeks", "eyes", "brows", "lips"]);
const MAKEUP_LAYER_ORDER = Object.freeze({
    primer: 10,
    skin_tint: 20,
    foundation: 20,
    color_corrector: 30,
    concealer: 40,
    setting_powder: 50,
    bronzer: 60,
    contour: 70,
    blush: 80,
    highlighter: 90,
    eyeshadow: 100,
    eyeliner: 110,
    mascara: 120,
    brow_product: 130,
    lip_liner: 140,
    lipstick: 150,
    lip_gloss: 160,
    setting_spray: 170,
});

function list(value) {
    return [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))];
}

function objectivePriority(objective) {
    return objective?.priority === "primary" ? "primary" : "secondary";
}

function addObjective(target, objective, effect, regions) {
    target.push({
        code: objective.code,
        priority: objectivePriority(objective),
        effect,
        regions: list(regions),
    });
}

/** Cria um plano visual combinado para todos os objetivos aplicáveis. */
export function buildCosmeticVisualizationSpec({
    objectives = [],
    facts = {},
    recommendations = [],
} = {}) {
    const visualObjectives = [];
    const limitations = [];
    const omittedEffects = [];
    const requestedMakeupRegions = list(facts.makeup_regions).filter((region) =>
        MAKEUP_REGIONS.has(region),
    );
    const requestedMakeupFunctions = resolveMakeupPlan(facts).functions.filter((value) =>
        Object.hasOwn(MAKEUP_LAYER_ORDER, value),
    );
    const makeupLayers = recommendations
        .flatMap((recommendation) => {
            const functions = list(
                recommendation.makeupFunctions ?? recommendation.makeup?.functions,
            );
            const productRegions = list(
                recommendation.makeup?.regions ?? recommendation.visualRoles,
            ).filter((region) => MAKEUP_REGIONS.has(region));
            const regions = requestedMakeupRegions.length > 0
                ? productRegions.filter((region) => requestedMakeupRegions.includes(region))
                : productRegions;
            const applicationAreas = list(recommendation.makeup?.applicationAreas);
            return functions
                .filter(
                    (makeupFunction) =>
                        requestedMakeupFunctions.length === 0 ||
                        requestedMakeupFunctions.includes(makeupFunction),
                )
                .map((makeupFunction) => ({
                    recommendationId: String(recommendation.recommendationId ?? recommendation.id),
                    function: makeupFunction,
                    regions,
                    applicationAreas,
                    order: MAKEUP_LAYER_ORDER[makeupFunction],
                }));
        })
        .filter(({ recommendationId, regions }) => recommendationId && regions.length > 0)
        .sort(
            (left, right) =>
                left.order - right.order ||
                left.recommendationId.localeCompare(right.recommendationId),
        );
    const legacyVisualRecommendations = recommendations.filter(
        (recommendation) =>
            list(recommendation.makeupFunctions ?? recommendation.makeup?.functions).length === 0 &&
            recommendation.concernTags?.includes("makeup") &&
            list(recommendation.visualRoles).some((region) =>
                requestedMakeupRegions.includes(region),
            ),
    );
    const supportedMakeupFunctions = new Set(
        makeupLayers.map(({ function: makeupFunction }) => makeupFunction),
    );
    const effectiveMakeupFunctions = requestedMakeupFunctions.filter((value) =>
        supportedMakeupFunctions.has(value),
    );
    const supportedMakeupRegions = new Set(
        [
            ...makeupLayers.flatMap(({ regions }) => regions),
            ...legacyVisualRecommendations.flatMap(({ visualRoles = [] }) => visualRoles),
        ],
    );
    const effectiveMakeupRegions = requestedMakeupRegions.filter((region) =>
        supportedMakeupRegions.has(region),
    );

    for (const objective of objectives) {
        switch (objective.code) {
            case "acne_imperfections":
                addObjective(
                    visualObjectives,
                    objective,
                    "reduce_visible_superficial_imperfections",
                    list(facts.affected_areas),
                );
                break;
            case "hydration_barrier": {
                const regions = list(facts.flaking_areas).filter(
                    (region) => region !== "none",
                );
                if (regions.length === 0) {
                    omittedEffects.push("hydration_no_visible_flaking_regions");
                    limitations.push(
                        "A hidratação não força uma alteração visual porque não foram indicadas zonas com descamação.",
                    );
                } else {
                    addObjective(
                        visualObjectives,
                        objective,
                        "reduce_visible_dryness_and_flaking",
                        regions,
                    );
                }
                break;
            }
            case "oil_control":
                addObjective(
                    visualObjectives,
                    objective,
                    "reduce_excess_specular_shine",
                    list(facts.oily_areas),
                );
                break;
            case "sensitivity_redness":
                addObjective(
                    visualObjectives,
                    objective,
                    "reduce_visible_diffuse_redness",
                    ["visible_redness_only"],
                );
                break;
            case "spots_tone_luminosity": {
                const effects = {
                    spots: "reduce_visible_spot_contrast",
                    post_imperfection_marks: "reduce_recent_mark_contrast",
                    dullness: "improve_local_luminosity_without_exposure_change",
                    uneven_tone: "improve_local_tone_uniformity",
                };
                addObjective(
                    visualObjectives,
                    objective,
                    effects[facts.tone_concern] ?? "improve_local_tone_uniformity",
                    ["visible_relevant_areas_only"],
                );
                break;
            }
            case "sun_protection": {
                const preference = facts.spf_texture_preference;
                if (["invisible", "no_preference", undefined, null].includes(preference)) {
                    omittedEffects.push("sun_protection_no_credible_visible_effect");
                    limitations.push(
                        "A proteção solar invisível ou sem acabamento escolhido não produz uma alteração visual credível.",
                    );
                } else {
                    const effect = {
                        matte: "reduce_excess_specular_shine",
                        hydrating: "add_subtle_hydrated_finish",
                        tinted: "apply_sheer_tinted_complexion_coverage",
                    }[preference];
                    addObjective(visualObjectives, objective, effect, ["complexion"]);
                }
                break;
            }
            case "makeup":
                if (requestedMakeupRegions.length === 0 && requestedMakeupFunctions.length === 0) {
                    omittedEffects.push("makeup_regions_not_collected");
                    limitations.push(
                        "A maquilhagem foi omitida porque as regiões da pré-visualização não foram recolhidas na consulta.",
                    );
                }
                if (effectiveMakeupRegions.length > 0) {
                    addObjective(
                        visualObjectives,
                        objective,
                        "apply_confirmed_catalog_makeup",
                        effectiveMakeupRegions,
                    );
                }
                for (const region of requestedMakeupRegions) {
                    if (!supportedMakeupRegions.has(region)) {
                        omittedEffects.push(`makeup_region_without_product:${region}`);
                        limitations.push(
                            `A região ${region} foi omitida porque não existe um produto recomendado que a suporte.`,
                        );
                    }
                }
                for (const makeupFunction of requestedMakeupFunctions) {
                    if (!supportedMakeupFunctions.has(makeupFunction)) {
                        omittedEffects.push(`makeup_function_without_product:${makeupFunction}`);
                        limitations.push(
                            `A função ${makeupFunction} foi omitida porque não existe um produto recomendado que a suporte.`,
                        );
                    }
                }
                break;
            default:
                break;
        }
    }

    const tintedSunscreenConflictsWithComplexionMakeup =
        visualObjectives.some(({ code }) => code === "sun_protection") &&
        visualObjectives.some(({ code }) => code === "makeup") &&
        effectiveMakeupRegions.includes("complexion") &&
        facts.spf_texture_preference === "tinted";

    const visualRecommendationIds = list([
        ...makeupLayers.map(({ recommendationId }) => recommendationId),
        ...legacyVisualRecommendations.map(({ recommendationId, id }) =>
            String(recommendationId ?? id),
        ),
        ...recommendations
            .filter(
                (recommendation) =>
                    !tintedSunscreenConflictsWithComplexionMakeup &&
                    facts.spf_texture_preference === "tinted" &&
                    recommendation.concernTags?.includes("sun_protection"),
            )
            .map(({ recommendationId, id }) => String(recommendationId ?? id)),
    ]);
    const variantRecommendationIds = recommendations
        .filter((recommendation) => {
            if (!recommendation.variantId) return false;
            return visualRecommendationIds.includes(
                String(recommendation.recommendationId ?? recommendation.id),
            );
        })
        .map(({ recommendationId, id }) => String(recommendationId ?? id));

    if (tintedSunscreenConflictsWithComplexionMakeup) {
        const index = visualObjectives.findIndex(
            ({ code }) => code === "sun_protection",
        );
        if (index >= 0) visualObjectives.splice(index, 1);
        omittedEffects.push("tinted_sunscreen_conflicts_with_complexion_makeup");
        limitations.push(
            "O acabamento com cor do protetor foi omitido porque a maquilhagem de complexion confirmada prevalece.",
        );
    }

    return {
        version: COSMETIC_VISUAL_INTENT_VERSION,
        enabled: visualObjectives.length > 0,
        objectives: visualObjectives,
        effectOrder: ["local_corrections", "surface_finish", "makeup"],
        allowedIntensities: [...COSMETIC_VISUAL_INTENSITIES],
        defaultIntensity: "balanced",
        makeup: {
            requestedRegions: requestedMakeupRegions,
            effectiveRegions: effectiveMakeupRegions,
            requestedFunctions: requestedMakeupFunctions,
            effectiveFunctions: effectiveMakeupFunctions,
            style: facts.makeup_style ?? "no_preference",
            context: facts.makeup_context ?? null,
            colourDirection: facts.makeup_colour_direction ?? "no_preference",
            wearPriority: facts.makeup_wear_priority ?? "no_preference",
            layers: makeupLayers,
            requiresVariantConfirmation: variantRecommendationIds.length > 0,
        },
        visualRecommendationIds,
        variantRecommendationIds,
        preserve: [...COSMETIC_PRESERVATION_INVARIANTS],
        omittedEffects: list(omittedEffects),
        limitations: list(limitations),
    };
}
