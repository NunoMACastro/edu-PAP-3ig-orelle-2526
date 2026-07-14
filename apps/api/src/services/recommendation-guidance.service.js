/**
 * Orientação pública determinística para produtos já selecionados pelo ranking.
 *
 * Este módulo não decide produtos nem tenta inferir utilização a partir do nome.
 * Converte apenas enums estruturados do catálogo em frases PT-PT controladas.
 * Assim, aumentar o número de recomendações não aumenta o Structured Output da
 * OpenAI nem obriga o modelo a repetir identificadores internos.
 */

const MAKEUP_FUNCTION_LABELS = Object.freeze({
    primer: "primer",
    skin_tint: "tinte de pele",
    foundation: "base",
    color_corrector: "corretor de cor",
    concealer: "corretor",
    setting_powder: "pó de fixação",
    blush: "blush",
    bronzer: "bronzer",
    contour: "contorno",
    highlighter: "iluminador",
    eyeshadow: "sombra de olhos",
    eyeliner: "eyeliner",
    mascara: "máscara de pestanas",
    brow_product: "produto de sobrancelhas",
    lip_liner: "lápis de lábios",
    lipstick: "batom",
    lip_gloss: "gloss labial",
    setting_spray: "spray de fixação",
});

const APPLICATION_AREA_LABELS = Object.freeze({
    full_complexion: "todo o rosto",
    under_eyes: "zona das olheiras",
    blemishes: "imperfeições localizadas",
    t_zone: "zona T",
    cheek_apples: "maçãs do rosto",
    cheekbones: "maçãs e zonas altas do rosto",
    jawline: "linha do maxilar",
    temples: "têmporas",
    eyelids: "pálpebras",
    lash_line: "linha das pestanas",
    lashes: "pestanas",
    brows: "sobrancelhas",
    lip_contour: "contorno natural dos lábios",
    lips: "lábios",
});

const ROUTINE_STEP_LABELS = Object.freeze({
    cleanse: "limpeza",
    tone_exfoliate: "tonificação ou esfoliação",
    treat: "tratamento cosmético",
    moisturize: "hidratação",
    protect: "proteção solar",
    prime: "preparação da maquilhagem",
    set: "fixação",
    complexion: "complexion",
    cheeks: "maçãs do rosto",
    eyes: "olhos",
    brows: "sobrancelhas",
    lips: "lábios",
});

function controlledLabels(values, labels) {
    return [
        ...new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => labels[String(value)] ?? null)
                .filter(Boolean),
        ),
    ];
}

function joinPt(values) {
    if (values.length <= 1) return values[0] ?? "";
    return `${values.slice(0, -1).join(", ")} e ${values.at(-1)}`;
}

/**
 * Constrói instruções breves e cautelas exclusivamente a partir do snapshot
 * selecionado. A descrição comercial continua disponível para a redação global
 * do relatório, mas nunca é executada nem interpolada nestas frases controladas.
 *
 * @param {object[]} selections - Recomendações fechadas pelo ranking.
 * @returns {object[]} Orientação alinhada, pela mesma ordem, com cada seleção.
 */
export function buildDeterministicRecommendationGuidance(selections = []) {
    return selections.map((selection) => {
        const makeupFunctions = controlledLabels(
            selection.makeupFunctions ?? selection.makeup?.functions,
            MAKEUP_FUNCTION_LABELS,
        );
        const applicationAreas = controlledLabels(
            selection.makeup?.applicationAreas,
            APPLICATION_AREA_LABELS,
        );
        const routineSteps = controlledLabels(
            selection.routineSteps,
            ROUTINE_STEP_LABELS,
        );
        const isMakeup = makeupFunctions.length > 0;
        const usage = isMakeup
            ? `Usa como ${joinPt(makeupFunctions)}${
                  applicationAreas.length > 0
                      ? ` em ${joinPt(applicationAreas)}`
                      : " apenas nas regiões indicadas"
              }, começando por uma camada fina e modulando apenas se necessário.`
            : `Integra no passo de ${joinPt(routineSteps) || "rotina cosmética"}, segundo a frequência e o modo de utilização indicados na embalagem.`;
        const cautions = [
            "Interrompe a utilização se surgir irritação ou desconforto.",
        ];
        if (selection.variantId) {
            cautions.push(
                "A variante apresentada é uma sugestão inicial e deve ser confirmada antes da compra ou da pré-visualização.",
            );
        }

        return {
            productId: String(selection.productId),
            variantId: selection.variantId ?? null,
            usage,
            cautions,
        };
    });
}
