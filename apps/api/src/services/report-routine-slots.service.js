/**
 * Contrato determinístico entre passos da rotina e produtos recomendados.
 *
 * Os slots são derivados exclusivamente de metadata estruturada do catálogo.
 * A OpenAI pode redigir o conteúdo de cada passo, mas não pode inventar slots,
 * escolher produtos ou construir associações através de texto livre.
 */
import {
    GENERIC_REPORT_ROUTINE_SLOT,
    PRODUCT_MAKEUP_FUNCTIONS,
    PRODUCT_ROUTINE_STEPS,
    REPORT_ROUTINE_SLOT_CODES,
} from "../constants/domain.constants.js";

export const GENERIC_ROUTINE_SLOT = GENERIC_REPORT_ROUTINE_SLOT;
export const ROUTINE_SLOT_CODES = REPORT_ROUTINE_SLOT_CODES;

const ROUTINE_SLOT_SET = new Set(ROUTINE_SLOT_CODES);
const MAKEUP_FUNCTION_SET = new Set(PRODUCT_MAKEUP_FUNCTIONS);

/** Ordem cosmética de apresentação; não concede autoridade de seleção. */
const ROUTINE_SLOT_ORDER = Object.freeze([
    GENERIC_ROUTINE_SLOT,
    "cleanse",
    "tone_exfoliate",
    "treat",
    "moisturize",
    "protect",
    "prime",
    "primer",
    "color_corrector",
    "skin_tint",
    "foundation",
    "concealer",
    "complexion",
    "setting_powder",
    "bronzer",
    "contour",
    "blush",
    "cheeks",
    "highlighter",
    "eyeshadow",
    "eyeliner",
    "mascara",
    "eyes",
    "brow_product",
    "brows",
    "lip_liner",
    "lipstick",
    "lip_gloss",
    "lips",
    "setting_spray",
    "set",
]);

const SLOT_ORDER_INDEX = new Map(
    ROUTINE_SLOT_ORDER.map((slotCode, index) => [slotCode, index]),
);
const PERIOD_ORDER_INDEX = new Map([
    ["manha", 0],
    ["noite", 1],
    ["ocasional", 2],
]);

function uniqueControlled(values, allowed) {
    return [
        ...new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => String(value ?? "").trim())
                .filter((value) => allowed.has(value)),
        ),
    ];
}

/**
 * Extrai slots de um produto ou snapshot. Produtos de maquilhagem usam funções
 * específicas; os restantes usam os passos estruturados da rotina.
 */
export function buildRoutineSlotCodesForProduct(product = {}) {
    const makeupFunctions = uniqueControlled(
        product.makeupFunctions ?? product.makeup?.functions,
        MAKEUP_FUNCTION_SET,
    );
    if (makeupFunctions.length > 0) return makeupFunctions;

    const routineSteps = uniqueControlled(
        product.routineSteps,
        new Set(PRODUCT_ROUTINE_STEPS),
    );
    return routineSteps;
}

/** Constrói a allowlist fechada que acompanha uma geração de relatório. */
export function buildAllowedRoutineSlots(selections = []) {
    const slots = new Map();
    for (const selection of Array.isArray(selections) ? selections : []) {
        for (const code of buildRoutineSlotCodesForProduct(selection)) {
            if (!slots.has(code)) {
                slots.set(code, {
                    code,
                    source: MAKEUP_FUNCTION_SET.has(code)
                        ? "makeup_function"
                        : "routine_step",
                });
            }
        }
    }
    if (slots.size === 0) {
        slots.set(GENERIC_ROUTINE_SLOT, {
            code: GENERIC_ROUTINE_SLOT,
            source: "generic",
        });
    }
    return [...slots.values()].sort(
        (left, right) =>
            (SLOT_ORDER_INDEX.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
                (SLOT_ORDER_INDEX.get(right.code) ?? Number.MAX_SAFE_INTEGER) ||
            left.code.localeCompare(right.code, "pt"),
    );
}

/** Ordena os passos aceites sem depender da ordem devolvida pelo modelo. */
export function sortRoutineSteps(routine = []) {
    return [...(Array.isArray(routine) ? routine : [])].sort(
        (left, right) =>
            (PERIOD_ORDER_INDEX.get(left?.period) ?? Number.MAX_SAFE_INTEGER) -
                (PERIOD_ORDER_INDEX.get(right?.period) ??
                    Number.MAX_SAFE_INTEGER) ||
            (SLOT_ORDER_INDEX.get(left?.routineSlotCode) ??
                Number.MAX_SAFE_INTEGER) -
                (SLOT_ORDER_INDEX.get(right?.routineSlotCode) ??
                    Number.MAX_SAFE_INTEGER),
    );
}

/**
 * Valida a cobertura semântica do Structured Output v6.
 *
 * @throws {TypeError} Quando o modelo inventa, omite ou duplica um slot.
 */
export function assertRoutineMatchesAllowedSlots(routine, allowedSlots) {
    const steps = Array.isArray(routine) ? routine : [];
    const allowedCodes = new Set(
        (Array.isArray(allowedSlots) ? allowedSlots : []).map(({ code }) => code),
    );
    const represented = new Set();
    const seenPeriodSlots = new Set();

    for (const step of steps) {
        const slotCode = String(step?.routineSlotCode ?? "");
        if (!ROUTINE_SLOT_SET.has(slotCode) || !allowedCodes.has(slotCode)) {
            throw new TypeError("Rotina contém um slot não autorizado");
        }
        const periodSlot = `${String(step?.period ?? "")}:${slotCode}`;
        if (seenPeriodSlots.has(periodSlot)) {
            throw new TypeError("Rotina contém um slot duplicado no mesmo período");
        }
        seenPeriodSlots.add(periodSlot);
        represented.add(slotCode);
    }

    const missing = [...allowedCodes].filter((code) => !represented.has(code));
    if (missing.length > 0) {
        throw new TypeError("Rotina omite slots obrigatórios dos produtos");
    }
}

/**
 * Enriquece uma rotina pública com IDs de recomendações pertencentes ao mesmo
 * relatório. A correspondência é feita por slots previamente derivados dos
 * snapshots congelados e nunca pelo nome ou descrição do produto.
 */
export function attachRecommendationIdsToRoutine(
    routine = [],
    recommendations = [],
) {
    const sourceRoutine = Array.isArray(routine) ? routine : [];
    if (!sourceRoutine.some(({ routineSlotCode }) => Boolean(routineSlotCode))) {
        return sourceRoutine.map((step) => ({ ...step }));
    }

    const recommendationIdsBySlot = new Map();
    for (const recommendation of Array.isArray(recommendations)
        ? recommendations
        : []) {
        for (const slotCode of recommendation.routineSlotCodes ?? []) {
            const ids = recommendationIdsBySlot.get(slotCode) ?? [];
            if (!ids.includes(recommendation.id)) ids.push(recommendation.id);
            recommendationIdsBySlot.set(slotCode, ids);
        }
    }

    const enriched = sourceRoutine.map((step) => ({
        ...step,
        recommendationIds: step?.routineSlotCode
            ? [...(recommendationIdsBySlot.get(step.routineSlotCode) ?? [])]
            : [],
    }));
    return sortRoutineSteps(enriched);
}
