/**
 * Service de explicabilidade publica para recomendacoes.
 *
 * O ranking calcula sinais tecnicos; este service converte esses sinais em
 * texto seguro para o cliente, sem revelar imagens, prompts ou paths internos.
 */
import { AppError } from "../middlewares/error.middleware.js";

const REASON_TEXT = Object.freeze({
    skin_type_match: "compatível com o tipo de pele declarado",
    goal_primary_match: "diretamente alinhado com o objetivo principal",
    goal_secondary_match: "alinhado com um objetivo complementar",
    routine_preference_match: "compatível com as preferências da rotina",
    makeup_region_match: "adequado a uma região de maquilhagem pedida",
    makeup_function_match: "adequado a uma função de maquilhagem pedida",
    makeup_style_match: "compatível com o estilo de maquilhagem escolhido",
    makeup_wear_match: "compatível com a prioridade de utilização escolhida",
    finish_preference_match: "compatível com o acabamento escolhido",
    coverage_preference_match: "compatível com a cobertura escolhida",
    available_now: "disponível no catálogo no momento da consulta",
    within_budget: "compatível com o orçamento indicado",
    oiliness_support: "adequado para pele com tendência de oleosidade",
    acne_support: "apoia uma rotina cosmética orientada a pele com acne",
    spots_support: "apoia uma rotina cosmética orientada a manchas",
    wrinkles_support: "apoia uma rotina cosmética orientada a rugas",
    guided_context_match: "alinhado com respostas da avaliação guiada",
});

const SOURCE_PREFIX_TEXT = Object.freeze({
    skinType: "tipo de pele estimado na análise facial",
    oleosidade: "nível de oleosidade observado na análise facial",
    acne: "sinais de acne observados na análise facial",
    manchas: "sinais de manchas observados na análise facial",
    rugas: "sinais de rugas observados na análise facial",
    report: "relatório cosmético mais recente",
    restriction: "restrições declaradas no perfil",
    guidedContext: "respostas da avaliação guiada",
    consultation_goal: "objetivo selecionado na consulta",
    profile_skin_type: "tipo de pele declarado no perfil",
    consultation_preference: "preferência estruturada da consulta",
    catalog_metadata: "característica estruturada do catálogo",
    catalog_availability: "disponibilidade verificada no catálogo",
    catalog_budget: "orçamento verificado pelo catálogo",
    catalog: "seleção validada no catálogo",
    goal: "objetivo da consulta",
});

const CONTROLLED_SOURCE_VALUES = Object.freeze({
    consultation_goal: new Set([
        "acne_imperfections",
        "hydration_barrier",
        "oil_control",
        "sensitivity_redness",
        "spots_tone_luminosity",
        "sun_protection",
        "makeup",
    ]),
    profile_skin_type: new Set(["oleosa", "seca", "mista", "normal", "sensivel"]),
    catalog_availability: new Set(["available"]),
    catalog_budget: new Set(["within"]),
    catalog: new Set(["allowlist"]),
    goal: new Set([
        "acne_imperfections",
        "hydration_barrier",
        "oil_control",
        "sensitivity_redness",
        "spots_tone_luminosity",
        "sun_protection",
        "makeup",
    ]),
});

const CONTROLLED_PREFERENCE_VALUES = Object.freeze({
    routine_preferences: new Set(["fragrance_free", "light_texture"]),
    makeup_regions: new Set(["complexion", "cheeks", "eyes", "brows", "lips"]),
    makeup_functions: new Set([
        "primer", "skin_tint", "foundation", "color_corrector", "concealer",
        "setting_powder", "blush", "bronzer", "contour", "highlighter",
        "eyeshadow", "eyeliner", "mascara", "brow_product", "lip_liner",
        "lipstick", "lip_gloss", "setting_spray",
    ]),
    makeup_plan_depth: new Set([
        "essential", "balanced", "elaborate", "custom",
    ]),
    makeup_style: new Set([
        "natural_everyday", "soft_classic", "soft_glam", "gala_evening",
        "modern_editorial",
    ]),
    makeup_wear_priority: new Set([
        "comfort", "longwear", "oil_control", "hydrating_wear", "photo_ready",
    ]),
    finish_preference: new Set(["matte", "natural", "luminous"]),
    coverage_preference: new Set(["light", "medium", "full"]),
});

const SOURCE_VALUE_LABELS = Object.freeze({
    acne_imperfections: "acne e imperfeições",
    hydration_barrier: "hidratação e barreira",
    oil_control: "controlo de oleosidade",
    sensitivity_redness: "sensibilidade e vermelhidão",
    spots_tone_luminosity: "manchas, tom e luminosidade",
    sun_protection: "proteção solar",
    makeup: "maquilhagem",
    oleosa: "oleosa",
    seca: "seca",
    mista: "mista",
    normal: "normal",
    sensivel: "sensível",
    fragrance_free: "sem perfume",
    light_texture: "textura leve",
    complexion: "pele do rosto",
    cheeks: "bochechas",
    eyes: "olhos",
    brows: "sobrancelhas",
    lips: "lábios",
    primer: "primer",
    skin_tint: "skin tint",
    foundation: "base",
    color_corrector: "corretor de cor",
    concealer: "corretor",
    setting_powder: "pó fixador",
    blush: "blush",
    bronzer: "bronzer",
    contour: "contorno",
    highlighter: "iluminador",
    eyeshadow: "sombra",
    eyeliner: "eyeliner",
    mascara: "máscara de pestanas",
    brow_product: "produto de sobrancelhas",
    lip_liner: "lápis de lábios",
    lipstick: "batom",
    lip_gloss: "gloss ou óleo labial",
    setting_spray: "spray fixador",
    essential: "plano essencial",
    balanced: "plano equilibrado",
    elaborate: "plano elaborado",
    custom: "plano personalizado",
    natural_everyday: "natural quotidiano",
    soft_classic: "clássico suave",
    soft_glam: "soft glam",
    gala_evening: "gala ou noite",
    modern_editorial: "moderno editorial",
    comfort: "conforto",
    longwear: "longa duração",
    hydrating_wear: "conforto hidratante",
    photo_ready: "preparada para fotografia",
    matte: "mate",
    natural: "natural",
    luminous: "luminoso",
    light: "leve",
    medium: "média",
    full: "completa",
    available: "disponível agora",
    within: "dentro do orçamento",
    allowlist: "produto elegível",
});

const DEFAULT_LIMITATIONS = Object.freeze([
    "A sugestão é cosmética e deve ser confirmada pelo cliente antes da compra.",
    "A recomendação não adiciona produtos automaticamente ao carrinho.",
]);

const UNSAFE_PUBLIC_TEXT =
    /(cura|diagn[óo]stico|garantia|resultado garantido|tratamento definitivo)/i;

/**
 * Remove valores repetidos e vazios sem alterar a ordem original.
 *
 * @function uniqueCleanStrings
 * @param {unknown} values - Lista recebida de outro service.
 * @returns {string[]} Lista limpa e sem duplicados.
 */
function uniqueCleanStrings(values) {
    return [
        ...new Set(
            (Array.isArray(values) ? values : []).map((value) =>
                String(value).trim(),
            ),
        ),
    ].filter(Boolean);
}

/**
 * Valida se uma frase publica fica dentro do dominio cosmetico.
 *
 * @function assertSafePublicExplanation
 * @param {string} text - Texto que sera devolvido ao frontend.
 * @returns {void}
 * @throws {AppError} Quando o texto contem promessa clinica ou linguagem insegura.
 */
export function assertSafePublicExplanation(text) {
    if (UNSAFE_PUBLIC_TEXT.test(String(text ?? ""))) {
        throw new AppError(
            400,
            "Explicacao de recomendacao fora do dominio cosmetico",
        );
    }
}

/**
 * Converte sinais tecnicos em labels publicos.
 *
 * @function buildPublicSourceLabels
 * @param {string[]} sourceSignals - Sinais internos controlados pelo backend.
 * @returns {string[]} Labels seguros para o frontend.
 */
export function buildPublicSourceLabels(sourceSignals) {
    return uniqueCleanStrings(sourceSignals)
        .map((signal) => {
            const [prefix, fieldOrValue, nestedValue] = signal.split(":");
            const label = SOURCE_PREFIX_TEXT[prefix];
            if (!label || !fieldOrValue) {
                throw new AppError(500, "Fonte de recomendação fora do contrato público");
            }

            if (Object.hasOwn(CONTROLLED_SOURCE_VALUES, prefix)) {
                if (!CONTROLLED_SOURCE_VALUES[prefix].has(fieldOrValue) || nestedValue) {
                    throw new AppError(500, "Valor de fonte fora do contrato público");
                }
                return `${label}: ${SOURCE_VALUE_LABELS[fieldOrValue]}`;
            }
            if (prefix === "consultation_preference") {
                if (
                    !nestedValue ||
                    !CONTROLLED_PREFERENCE_VALUES[fieldOrValue]?.has(nestedValue)
                ) {
                    throw new AppError(500, "Preferência fora do contrato público");
                }
                return `${label}: ${SOURCE_VALUE_LABELS[nestedValue]}`;
            }
            if (prefix === "catalog_metadata") {
                const allowed = {
                    fragranceFree: new Set(["true"]),
                    texture: new Set(["gel", "water", "serum", "gel_cream", "fluid"]),
                    finish: CONTROLLED_PREFERENCE_VALUES.finish_preference,
                    coverage: CONTROLLED_PREFERENCE_VALUES.coverage_preference,
                };
                if (!nestedValue || !allowed[fieldOrValue]?.has(nestedValue)) {
                    throw new AppError(500, "Metadata fora do contrato público");
                }
                return `${label}: ${SOURCE_VALUE_LABELS[nestedValue] ?? nestedValue}`;
            }

            // Contratos legacy finitos, preservados para recomendações MF2.
            const legacyAllowed = {
                skinType: new Set(["oleosa", "seca", "mista", "normal", "sensivel"]),
                oleosidade: new Set(["baixo", "ligeiro", "moderado", "moderada", "elevado"]),
                acne: new Set(["baixo", "ligeiro", "moderado", "moderada", "elevado"]),
                manchas: new Set(["baixo", "ligeiro", "moderado", "moderada", "elevado"]),
                rugas: new Set(["baixo", "ligeiro", "moderado", "moderada", "elevado"]),
                report: new Set(["relatorio_cosmetico"]),
                guidedContext: new Set([
                    "hidratar",
                    "mais conforto e hidratacao",
                    "reduzir_oleosidade",
                    "reduzir oleosidade",
                    "acalmar_sensibilidade",
                    "acalmar sensibilidade",
                    "equilibrar_rotina",
                    "equilibrar a rotina",
                    "textura_leve",
                    "textura leve",
                    "sem_perfume",
                    "sem perfume",
                    "rotina_curta",
                    "rotina curta",
                    "produto_pratico",
                    "produto pratico",
                    "1/5",
                    "2/5",
                    "3/5",
                    "4/5",
                    "5/5",
                ]),
            };
            const legacyValues =
                prefix === "guidedContext"
                    ? fieldOrValue.split(",").map((value) => value.trim())
                    : [fieldOrValue];
            if (
                nestedValue ||
                !legacyAllowed[prefix] ||
                legacyValues.some((value) => !legacyAllowed[prefix].has(value))
            ) {
                throw new AppError(500, "Fonte legacy fora do contrato público");
            }
            return `${label}: ${legacyValues.join(", ")}`;
        })
        .filter(Boolean);
}

/**
 * Constroi explicacao publica de uma recomendacao.
 *
 * @function buildRecommendationReason
 * @param {{reasonCodes: string[], sourceSignals: string[], product: object, profile?: object|null}} input - Sinais validados.
 * @returns {{reasonCodes: string[], sourceSignals: string[], sourceLabels: string[], explanation: string, limitations: string[]}} Motivo publico.
 * @throws {AppError} Quando faltam motivos, fontes publicas ou o texto fica inseguro.
 */
export function buildRecommendationReason({
    reasonCodes,
    sourceSignals,
    product,
    profile = null,
}) {
    const validCodes = uniqueCleanStrings(reasonCodes).filter(
        (code) => REASON_TEXT[code],
    );
    const validSignals = uniqueCleanStrings(sourceSignals);
    const sourceLabels = buildPublicSourceLabels(validSignals);

    if (validCodes.length === 0 || sourceLabels.length === 0) {
        throw new AppError(400, "Recomendacao sem motivo cosmetico suficiente");
    }

    const productName = String(product?.name ?? "Produto recomendado")
        .replace(/[<>]/g, "")
        .slice(0, 80);
    const readableReasons = validCodes.map((code) => REASON_TEXT[code]);
    const explanation = `${productName} foi recomendado porque é ${readableReasons.join(
        " e ",
    )}. Esta sugestão é cosmética e usa apenas sinais cosméticos autorizados.`;

    assertSafePublicExplanation(explanation);

    const restrictions = uniqueCleanStrings(profile?.lightMedicalRestrictions).map(
        (restriction) =>
            `Restrição declarada respeitada: ${restriction.slice(0, 80)}.`,
    );

    return {
        reasonCodes: validCodes,
        sourceSignals: validSignals,
        sourceLabels,
        explanation,
        limitations: [...new Set([...restrictions, ...DEFAULT_LIMITATIONS])],
    };
}
