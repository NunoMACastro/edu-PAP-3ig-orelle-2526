/**
 * Catálogo versionado de objetivos e factos mínimos da consulta cosmética.
 *
 * O modelo pode escolher a próxima pergunta, mas apenas entre estes slots. O
 * backend continua a ser a autoridade sobre tipos, opções, limites e momento
 * em que a recolha está completa.
 */

export const AI_CONSULTATION_GOALS_VERSION = "cosmetic-goals-v5";
export const AI_CONSULTATION_QUESTION_PLAN_VERSION = "guided-question-plan-v5";
export const AI_CONSULTATION_MIN_QUESTIONS = 10;
export const AI_CONSULTATION_MAX_QUESTIONS = 17;

/**
 * Respostas controladas para confirmar que o perfil continua autoritativo.
 * Texto livre nunca deve ser interpretado como uma alergia clínica.
 */
export const PROFILE_RESTRICTIONS_CONFIRMATION = Object.freeze({
    CONFIRMED: "profile_restrictions_confirmed",
    NEEDS_UPDATE: "profile_restrictions_needs_update",
});

export const AI_CONSULTATION_GOAL_CODES = Object.freeze({
    ACNE: "acne_imperfections",
    HYDRATION: "hydration_barrier",
    OIL_CONTROL: "oil_control",
    SENSITIVITY: "sensitivity_redness",
    TONE: "spots_tone_luminosity",
    SUN_PROTECTION: "sun_protection",
    MAKEUP: "makeup",
});

const commonSlots = Object.freeze([
    Object.freeze({
        code: "budget_cents",
        label: "Qual é o orçamento aproximado para a rotina recomendada?",
        type: "number",
        required: true,
        min: 0,
        max: 100_000,
        presentation: Object.freeze({
            control: "currency",
            currency: "EUR",
            scale: 100,
            displayMin: 0,
            displayMax: 1_000,
            helper: "Indica o valor aproximado que pretendes investir no conjunto da rotina.",
        }),
    }),
    Object.freeze({
        code: "current_routine",
        label: "Que produtos utilizas atualmente e em que momentos do dia?",
        type: "short_text",
        required: true,
        maxLength: 600,
        presentation: Object.freeze({
            control: "textarea",
            helper: "Podes indicar produtos, marcas e se os usas de manhã ou à noite.",
            example: "Ex.: gel de limpeza de manhã e hidratante à noite.",
        }),
    }),
    Object.freeze({
        code: "allergies_restrictions",
        label: "As alergias, ingredientes a evitar e restrições do teu perfil estão atualizados?",
        type: "single_select",
        required: true,
        options: Object.freeze([
            PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
            PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE,
        ]),
        presentation: Object.freeze({
            control: "option_cards",
            helper: "O perfil é a fonte segura usada para filtrar produtos. Atualiza-o antes de continuares se existir alguma alteração.",
            recommendedOption:
                PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
        }),
    }),
    Object.freeze({
        code: "routine_preferences",
        label: "Que preferências queres aplicar à rotina?",
        type: "multi_select",
        required: false,
        options: Object.freeze([
            "short_routine",
            "fragrance_free",
            "light_texture",
            "vegan_preference",
            "no_preference",
        ]),
        presentation: Object.freeze({
            control: "option_cards",
            helper: "Podes escolher várias preferências.",
        }),
    }),
]);
const commonSlotCodes = new Set(commonSlots.map(({ code }) => code));

/**
 * Labels de apresentação dos valores canónicos.
 *
 * Os códigos continuam estáveis na base de dados e nos filtros do relatório;
 * esta tabela impede que detalhes internos em inglês cheguem à interface.
 */
export const AI_CONSULTATION_OPTION_LABELS = Object.freeze({
    [PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED]:
        "Sim, o meu perfil está atualizado",
    [PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE]:
        "Não, preciso de atualizar o perfil",
    short_routine: "Rotina curta",
    fragrance_free: "Sem perfume",
    light_texture: "Texturas leves",
    vegan_preference: "Preferência vegan",
    no_preference: "Sem preferência",
    rare: "Raramente",
    monthly: "Uma vez por mês",
    weekly: "Semanalmente",
    daily: "Diariamente",
    forehead: "Testa",
    nose: "Nariz",
    cheeks: "Bochechas",
    chin: "Queixo",
    jaw: "Linha do maxilar",
    other: "Outra zona",
    never: "Nunca",
    sometimes: "Às vezes",
    often: "Frequentemente",
    none: "Nenhuma",
    around_mouth: "À volta da boca",
    morning: "De manhã",
    midday: "Ao meio do dia",
    afternoon: "Durante a tarde",
    all_day: "Ao longo de todo o dia",
    all_face: "Todo o rosto",
    products: "Produtos cosméticos",
    weather: "Alterações do tempo",
    heat: "Calor",
    cold: "Frio",
    friction: "Fricção ou toque",
    unknown: "Não sei identificar",
    continuous: "De forma contínua",
    spots: "Manchas visíveis",
    post_imperfection_marks: "Marcas após imperfeições",
    dullness: "Falta de luminosidade",
    uneven_tone: "Tom pouco uniforme",
    under_month: "Há menos de um mês",
    one_to_six_months: "Entre um e seis meses",
    six_to_twelve_months: "Entre seis e doze meses",
    over_year: "Há mais de um ano",
    minimal: "Exposição mínima",
    under_hour: "Menos de uma hora",
    one_to_three_hours: "Entre uma e três horas",
    over_three_hours: "Mais de três horas",
    indoor_commute: "Maioritariamente em espaços interiores",
    outdoor_daily: "Atividades diárias no exterior",
    sport: "Desporto ao ar livre",
    beach_pool: "Praia ou piscina",
    invisible: "Invisível",
    matte: "Mate",
    hydrating: "Hidratante",
    tinted: "Com cor",
    work_school: "Trabalho ou escola",
    event: "Evento",
    photography: "Fotografia",
    light: "Leve e discreta",
    medium: "Média e definida",
    full: "Completa e intensa",
    natural: "Natural",
    luminous: "Luminoso",
    complexion: "Pele do rosto",
    eyes: "Olhos",
    lips: "Lábios",
    brows: "Sobrancelhas",
    active_imperfections: "Imperfeições ativas visíveis",
    blackheads: "Pontos negros",
    recent_marks: "Marcas recentes",
    comfort: "Conforto",
    whiteheads: "Pontos brancos",
    surface_bumps: "Pequenas irregularidades superficiais",
    inflamed_visible: "Imperfeições visivelmente inflamadas",
    not_used: "Ainda não utilizei",
    well_tolerated: "Costumo tolerar bem",
    reactive: "A pele reage com facilidade",
    tightness: "Repuxamento",
    flaking: "Descamação",
    roughness: "Aspeto áspero",
    after_cleansing: "Depois da limpeza",
    end_of_day: "Ao fim do dia",
    cold_weather: "Com tempo frio ou seco",
    rich: "Rica e envolvente",
    low: "Baixa",
    high: "Alta",
    stinging: "Ardor ou picada",
    warmth: "Sensação de calor",
    itching: "Comichão",
    immediate: "Imediata",
    within_hours: "Nas horas seguintes",
    next_day: "No dia seguinte",
    variable: "Varia",
    stable: "Estável",
    seasonal: "Sazonal",
    after_sun: "Após exposição solar",
    after_imperfections: "Após imperfeições",
    once: "Uma vez",
    twice_or_more: "Duas ou mais vezes",
    depends: "Depende do dia",
    without_makeup: "Sem maquilhagem",
    under_makeup: "Sob maquilhagem",
    both: "Com e sem maquilhagem",
    natural_everyday: "Natural quotidiano",
    soft_classic: "Clássico suave",
    soft_glam: "Soft glam",
    gala_evening: "Gala ou noite",
    modern_editorial: "Moderno editorial",
    primer: "Primer",
    skin_tint: "Skin tint",
    foundation: "Base",
    color_corrector: "Corretor de cor",
    concealer: "Corretor de olheiras e imperfeições",
    setting_powder: "Pó fixador",
    blush: "Blush",
    bronzer: "Bronzer",
    contour: "Contorno",
    highlighter: "Iluminador",
    eyeshadow: "Sombra",
    eyeliner: "Eyeliner",
    mascara: "Máscara de pestanas",
    brow_product: "Produto de sobrancelhas",
    lip_liner: "Lápis de lábios",
    lipstick: "Batom",
    lip_gloss: "Gloss ou óleo labial",
    setting_spray: "Spray fixador",
    neutral_palette: "Neutra",
    warm_palette: "Quente",
    cool_palette: "Fria",
    rose_mauve: "Rosa e ameixa",
    bold: "Marcante",
    longwear: "Longa duração",
    hydrating_wear: "Conforto hidratante",
    photo_ready: "Preparada para fotografia",
    oil_control: "Controlo de oleosidade",
    micellar: "Água micelar",
    oil_cleanser: "Óleo ou bálsamo desmaquilhante",
    double_cleanse: "Dupla limpeza",
    essential: "Essencial",
    balanced: "Equilibrado",
    elaborate: "Elaborado",
    custom: "Personalizar",
});

/** Devolve o label PT-PT de um valor permitido ou falha de forma explícita. */
export function getAiConsultationOptionLabel(value) {
    const label = AI_CONSULTATION_OPTION_LABELS[value];
    if (!label) {
        throw new TypeError(`Opção canónica sem label PT-PT: ${value}`);
    }
    return label;
}

const definitions = [
    {
        code: AI_CONSULTATION_GOAL_CODES.ACNE,
        label: "Acne e imperfeições",
        description: "Apoio cosmético para borbulhas, pontos negros e marcas recentes.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["acne_priority", "affected_areas"],
        slots: [
            { code: "acne_priority", label: "Que aspeto queres priorizar?", type: "single_select", required: true, options: ["active_imperfections", "blackheads", "recent_marks", "comfort"] },
            { code: "acne_frequency", label: "Com que frequência surgem novas imperfeições?", type: "single_select", required: true, options: ["rare", "monthly", "weekly", "daily"] },
            { code: "affected_areas", label: "Em que zonas notas mais imperfeições?", type: "multi_select", required: true, options: ["forehead", "nose", "cheeks", "chin", "jaw", "other"] },
            { code: "visible_imperfection_types", label: "Que sinais superficiais estão visíveis neste momento?", type: "multi_select", required: true, options: ["whiteheads", "blackheads", "surface_bumps", "inflamed_visible", "recent_marks"] },
            { code: "current_irritation", label: "Qual é o desconforto ou irritação atual?", type: "scale", required: true, min: 1, max: 5, presentation: { minLabel: "Sem desconforto", maxLabel: "Muito intenso" } },
            { code: "product_tolerance", label: "Como costuma a tua pele reagir a produtos para imperfeições?", type: "single_select", required: true, options: ["not_used", "well_tolerated", "reactive", "unknown"] },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.HYDRATION,
        label: "Hidratação e barreira",
        description: "Apoio cosmético para secura, repuxamento e conforto da barreira.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["tightness_frequency", "flaking_areas"],
        slots: [
            { code: "hydration_priority", label: "Que sinal de desidratação queres priorizar?", type: "single_select", required: true, options: ["tightness", "flaking", "roughness", "comfort"] },
            { code: "tightness_frequency", label: "Com que frequência sentes repuxamento?", type: "single_select", required: true, options: ["never", "sometimes", "often", "daily"] },
            { code: "flaking_areas", label: "Em que zonas notas secura ou descamação?", type: "multi_select", required: true, options: ["none", "forehead", "nose", "cheeks", "chin", "around_mouth"] },
            { code: "discomfort_timing", label: "Quando notas mais desconforto ou secura?", type: "single_select", required: true, options: ["after_cleansing", "morning", "end_of_day", "cold_weather", "continuous"] },
            { code: "comfort_level", label: "Como classificas o conforto atual da pele?", type: "scale", required: true, min: 1, max: 5, presentation: { minLabel: "Muito desconfortável", maxLabel: "Muito confortável" } },
            { code: "texture_richness", label: "Que riqueza de textura preferes?", type: "single_select", required: true, options: ["light", "medium", "rich", "no_preference"] },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.OIL_CONTROL,
        label: "Controlo de oleosidade",
        description: "Apoio cosmético para brilho, poros visíveis e equilíbrio da rotina.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["shine_timing", "oily_areas"],
        slots: [
            { code: "shine_timing", label: "Quando aparece mais brilho durante o dia?", type: "single_select", required: true, options: ["morning", "midday", "afternoon", "all_day"] },
            { code: "oily_areas", label: "Em que zonas notas mais oleosidade?", type: "multi_select", required: true, options: ["forehead", "nose", "cheeks", "chin", "all_face"] },
            { code: "shine_intensity", label: "Qual é a intensidade habitual do brilho?", type: "scale", required: true, min: 1, max: 5, presentation: { minLabel: "Muito ligeiro", maxLabel: "Muito intenso" } },
            { code: "pore_congestion", label: "Como classificas a presença de poros obstruídos?", type: "single_select", required: true, options: ["none", "low", "medium", "high"] },
            { code: "post_cleanse_tightness", label: "Sentes repuxamento depois de limpar o rosto?", type: "single_select", required: true, options: ["never", "sometimes", "often", "daily"] },
            { code: "cleansing_frequency", label: "Quantas vezes limpas o rosto por dia?", type: "number", required: true, min: 0, max: 6, presentation: { control: "number", unit: "vezes por dia" } },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.SENSITIVITY,
        label: "Sensibilidade e vermelhidão",
        description: "Apoio cosmético conservador para desconforto e reatividade visível.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["redness_frequency", "redness_areas"],
        slots: [
            { code: "sensitivity_triggers", label: "Que fatores costumam desencadear desconforto?", type: "multi_select", required: true, options: ["products", "weather", "heat", "cold", "friction", "unknown"] },
            { code: "redness_frequency", label: "Com que frequência notas vermelhidão?", type: "single_select", required: true, options: ["rare", "sometimes", "often", "continuous"] },
            { code: "redness_areas", label: "Em que zonas notas vermelhidão?", type: "multi_select", required: true, options: ["forehead", "nose", "cheeks", "chin", "around_mouth", "all_face"] },
            { code: "sensitivity_sensations", label: "Que sensações acompanham a sensibilidade?", type: "multi_select", required: true, options: ["stinging", "warmth", "itching", "tightness", "none"] },
            { code: "sensitivity_intensity", label: "Qual é a intensidade do desconforto atual?", type: "scale", required: true, min: 1, max: 5, presentation: { minLabel: "Muito ligeiro", maxLabel: "Muito intenso" } },
            { code: "reaction_timing", label: "Quando costuma surgir uma reação a um produto?", type: "single_select", required: true, options: ["immediate", "within_hours", "next_day", "variable", "unknown"] },
            { code: "previous_cosmetic_reaction", label: "Como descreves a tua tolerância recente a cosméticos?", type: "single_select", required: false, options: ["not_used", "well_tolerated", "reactive", "unknown"] },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.TONE,
        label: "Manchas, tom e luminosidade",
        description: "Apoio cosmético para uniformidade aparente e luminosidade.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["tone_concern", "tone_areas"],
        slots: [
            { code: "tone_concern", label: "Que alteração de tom pretendes priorizar?", type: "single_select", required: true, options: ["spots", "post_imperfection_marks", "dullness", "uneven_tone"] },
            { code: "tone_areas", label: "Em que zonas notas mais esta preocupação?", type: "multi_select", required: true, options: ["forehead", "nose", "cheeks", "chin", "jaw", "all_face"] },
            { code: "concern_duration", label: "Há quanto tempo notas esta preocupação?", type: "single_select", required: true, options: ["under_month", "one_to_six_months", "six_to_twelve_months", "over_year"] },
            { code: "daily_sun_exposure", label: "Quanto tempo de exposição solar tens num dia normal?", type: "single_select", required: true, options: ["minimal", "under_hour", "one_to_three_hours", "over_three_hours"] },
            { code: "tone_pattern", label: "Como tem evoluído a alteração de tom?", type: "single_select", required: true, options: ["stable", "seasonal", "after_sun", "after_imperfections", "variable"] },
            { code: "brightening_tolerance", label: "Como toleras produtos destinados à uniformidade e luminosidade?", type: "single_select", required: true, options: ["not_used", "well_tolerated", "reactive", "unknown"] },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.SUN_PROTECTION,
        label: "Proteção solar",
        description: "Seleção cosmética de proteção solar adequada ao uso quotidiano.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 6,
        secondarySlotCodes: ["daily_sun_exposure", "spf_texture_preference"],
        slots: [
            { code: "daily_sun_exposure", label: "Quanto tempo de exposição solar tens num dia normal?", type: "single_select", required: true, options: ["minimal", "under_hour", "one_to_three_hours", "over_three_hours"] },
            { code: "sun_activity", label: "Qual é o contexto principal de exposição?", type: "single_select", required: true, options: ["indoor_commute", "outdoor_daily", "sport", "beach_pool"] },
            { code: "spf_texture_preference", label: "Que acabamento preferes num protetor solar?", type: "single_select", required: true, options: ["invisible", "matte", "hydrating", "tinted", "no_preference"] },
            { code: "reapplication_frequency", label: "Com que frequência consegues reaplicar proteção solar?", type: "single_select", required: true, options: ["never", "once", "twice_or_more", "depends"] },
            { code: "water_sweat_exposure", label: "Qual é a exposição habitual a água ou transpiração?", type: "single_select", required: true, options: ["low", "medium", "high"] },
            { code: "sunscreen_makeup_layering", label: "Como pretendes usar o protetor em relação à maquilhagem?", type: "single_select", required: true, options: ["without_makeup", "under_makeup", "both", "no_preference"] },
        ],
    },
    {
        code: AI_CONSULTATION_GOAL_CODES.MAKEUP,
        label: "Maquilhagem",
        description: "Seleção de produtos e variantes para um resultado de maquilhagem pretendido.",
        supportsMakeupPreview: true,
        primaryQuestionLimit: 8,
        secondarySlotCodes: ["makeup_style", "makeup_regions"],
        slots: [
            { code: "makeup_context", label: "Para que contexto procuras a maquilhagem?", type: "single_select", required: true, options: ["daily", "work_school", "event", "photography"] },
            { code: "makeup_style", label: "Que estilo de maquilhagem procuras?", type: "single_select", required: true, options: ["natural_everyday", "soft_classic", "soft_glam", "gala_evening", "modern_editorial", "no_preference"] },
            { code: "makeup_regions", label: "Que zonas queres incluir na pré-visualização?", type: "multi_select", required: true, options: ["complexion", "cheeks", "eyes", "brows", "lips"] },
            {
                code: "makeup_plan_depth",
                label: "Quão elaborado queres o teu plano de maquilhagem?",
                type: "single_select",
                required: true,
                options: ["essential", "balanced", "elaborate", "custom"],
                presentation: {
                    control: "descriptive_cards",
                    helper: "A Orélle transforma esta escolha num plano coerente usando o estilo, as regiões, a cobertura, o acabamento e a duração.",
                    recommendedOption: "balanced",
                    optionDescriptions: {
                        essential: "Poucos passos, aplicação rápida e apenas os elementos principais.",
                        balanced: "Look completo e coerente, sem camadas desnecessárias.",
                        elaborate: "Mais preparação, definição, detalhe e fixação.",
                        custom: "Escolher manualmente os elementos do plano.",
                    },
                },
            },
            {
                code: "makeup_functions",
                label: "Que elementos queres incluir no plano personalizado?",
                type: "multi_select",
                required: false,
                options: ["primer", "skin_tint", "foundation", "color_corrector", "concealer", "setting_powder", "blush", "bronzer", "contour", "highlighter", "eyeshadow", "eyeliner", "mascara", "brow_product", "lip_liner", "lipstick", "lip_gloss", "setting_spray"],
                presentation: {
                    control: "grouped_option_cards",
                    helper: "Esta escolha avançada só aparece porque selecionaste Personalizar.",
                    groups: [
                        { label: "Preparação e pele", options: ["primer", "skin_tint", "foundation", "color_corrector", "concealer", "setting_powder"] },
                        { label: "Bochechas", options: ["blush", "bronzer", "contour", "highlighter"] },
                        { label: "Olhos e sobrancelhas", options: ["eyeshadow", "eyeliner", "mascara", "brow_product"] },
                        { label: "Lábios", options: ["lip_liner", "lipstick", "lip_gloss"] },
                        { label: "Fixação", options: ["setting_spray"] },
                    ],
                    exclusiveGroups: [
                        ["skin_tint", "foundation"],
                    ],
                },
            },
            { code: "coverage_preference", label: "Que nível de cobertura e intensidade preferes?", type: "single_select", required: true, options: ["light", "medium", "full", "no_preference"] },
            { code: "finish_preference", label: "Que acabamento preferes?", type: "single_select", required: true, options: ["matte", "natural", "luminous", "no_preference"] },
            { code: "makeup_colour_direction", label: "Que direção de cor preferes?", type: "single_select", required: true, options: ["neutral_palette", "warm_palette", "cool_palette", "rose_mauve", "bold", "no_preference"] },
            { code: "makeup_wear_priority", label: "Qual é a prioridade de utilização?", type: "single_select", required: true, options: ["comfort", "longwear", "oil_control", "hydrating_wear", "photo_ready", "no_preference"] },
            { code: "makeup_removal_method", label: "Como preferes remover a maquilhagem?", type: "single_select", required: false, options: ["micellar", "oil_cleanser", "double_cleanse", "no_preference"] },
        ],
    },
];

function freezeDefinition(definition) {
    return Object.freeze({
        ...definition,
        requiresPhotos: true,
        supportsCosmeticVisualization: true,
        slots: Object.freeze(
            [...commonSlots, ...definition.slots].map((slot) =>
                Object.freeze({
                    ...slot,
                    options: slot.options ? Object.freeze([...slot.options]) : undefined,
                    presentation: slot.presentation
                        ? Object.freeze({ ...slot.presentation })
                        : undefined,
                }),
            ),
        ),
    });
}

export const AI_CONSULTATION_GOALS = Object.freeze(
    definitions.map(freezeDefinition),
);

const goalByCode = new Map(AI_CONSULTATION_GOALS.map((goal) => [goal.code, goal]));
const goalOrder = new Map(AI_CONSULTATION_GOALS.map((goal, index) => [goal.code, index]));

/** Devolve a definição imutável de um objetivo conhecido. */
export function getAiConsultationGoal(code) {
    return goalByCode.get(code) ?? null;
}

/** Constrói o conjunto permitido de slots para uma seleção de objetivos. */
export function buildGoalSlotPlan(primaryGoal, secondaryGoals = []) {
    const selectedGoals = [primaryGoal, ...secondaryGoals]
        .map(getAiConsultationGoal)
        .filter(Boolean);
    const seen = new Set();

    return selectedGoals
        .flatMap((goal, goalIndex) =>
            goal.slots
                .filter((slot) => {
                    if (seen.has(slot.code)) return false;
                    seen.add(slot.code);
                    return true;
                })
                .map((slot) => {
                    const common = commonSlotCodes.has(slot.code);
                    const priority = common
                        ? slot.required
                            ? "common_required"
                            : "common_optional"
                        : goalIndex === 0
                          ? slot.required
                              ? "primary_required"
                              : "primary_optional"
                          : slot.required
                            ? "secondary_required"
                            : "secondary_optional";
                    const priorityRank = {
                        common_required: 0,
                        primary_required: 1,
                        secondary_required: 2,
                        common_optional: 3,
                        primary_optional: 4,
                        secondary_optional: 5,
                    }[priority];
                    return {
                        ...slot,
                        priority,
                        priorityRank,
                        objectiveCode: common ? null : goal.code,
                    };
                }),
        )
        .sort((left, right) => left.priorityRank - right.priorityRank);
}

/**
 * Cria o guião finito da consulta sem depender de rede ou do conteúdo das
 * respostas. O algoritmo recolhe até seis perguntas do objetivo principal
 * (oito em maquilhagem), duas por objetivo secundário e até duas reservas.
 */
export function buildDeterministicQuestionPlan(primaryGoal, secondaryGoals = []) {
    const primary = getAiConsultationGoal(primaryGoal);
    if (!primary) return [];

    const secondaries = [...new Set(secondaryGoals)]
        .filter((code) => code !== primaryGoal && getAiConsultationGoal(code))
        .sort((left, right) => goalOrder.get(left) - goalOrder.get(right))
        .map(getAiConsultationGoal);
    const commonRequired = commonSlots.filter((slot) => slot.required);
    const specificSlots = (goal) => goal.slots.filter((slot) => !commonSlotCodes.has(slot.code));
    const primarySlots = specificSlots(primary);
    const selected = [];
    const selectedCodes = new Set();

    function add(slot) {
        if (!slot || selectedCodes.has(slot.code) || selected.length >= AI_CONSULTATION_MAX_QUESTIONS) {
            return false;
        }
        selectedCodes.add(slot.code);
        selected.push(slot);
        return true;
    }

    const primaryQuestions = primarySlots
        .filter((slot) => slot.required)
        .slice(0, primary.primaryQuestionLimit ?? 6);

    commonRequired.forEach(add);
    primaryQuestions.forEach(add);

    for (const goal of secondaries) {
        const goalSlots = specificSlots(goal);
        const preferred = (goal.secondarySlotCodes ?? [])
            .map((code) => goalSlots.find((slot) => slot.code === code))
            .filter(Boolean);
        const fallbacks = goalSlots.filter((slot) => !preferred.includes(slot));
        let addedForGoal = 0;
        for (const slot of [...preferred, ...fallbacks]) {
            if (addedForGoal >= 2) break;
            if (add(slot)) addedForGoal += 1;
        }
    }

    const makeupSelected = [primary, ...secondaries].some(
        ({ code }) => code === AI_CONSULTATION_GOAL_CODES.MAKEUP,
    );
    const reserveCodes = primary.code === AI_CONSULTATION_GOAL_CODES.MAKEUP
        ? ["makeup_functions", "routine_preferences"]
        : makeupSelected
          ? ["makeup_plan_depth", "coverage_preference"]
          : secondaries.some(({ code }) => code === AI_CONSULTATION_GOAL_CODES.SENSITIVITY)
            ? ["previous_cosmetic_reaction", "routine_preferences"]
            : ["routine_preferences"];
    const allAvailable = new Map(
        [...commonSlots, ...[primary, ...secondaries].flatMap(specificSlots)].map((slot) => [slot.code, slot]),
    );
    reserveCodes.slice(0, 2).forEach((code) => add(allAvailable.get(code)));

    const byCode = new Map(selected.map((slot) => [slot.code, slot]));
    const presentationCodes = [
        primarySlots[0]?.code,
        "current_routine",
        primarySlots[1]?.code,
        "allergies_restrictions",
        primarySlots[2]?.code,
        "budget_cents",
    ];
    const ordered = [];
    for (const code of presentationCodes) {
        const slot = byCode.get(code);
        if (slot && !ordered.some((item) => item.code === slot.code)) ordered.push(slot);
    }
    for (const slot of selected) {
        if (!ordered.some((item) => item.code === slot.code)) ordered.push(slot);
    }
    return ordered;
}

/** Cria o snapshot mínimo que fica guardado dentro do campo encriptado. */
export function createQuestionPlanSnapshot(primaryGoal, secondaryGoals = []) {
    return Object.freeze({
        version: AI_CONSULTATION_QUESTION_PLAN_VERSION,
        slotCodes: buildDeterministicQuestionPlan(primaryGoal, secondaryGoals).map(
            ({ code }) => code,
        ),
    });
}

/** Resolve os slots de um snapshot sem confiar em dados fornecidos pelo cliente. */
export function resolveQuestionPlanSlots(goalSelection, questionPlan = null) {
    const allowed = new Map(
        buildGoalSlotPlan(
            goalSelection?.primaryGoal,
            goalSelection?.secondaryGoals,
        ).map((slot) => [slot.code, slot]),
    );
    const snapshotCodes = Array.isArray(questionPlan?.slotCodes)
        ? questionPlan.slotCodes
        : createQuestionPlanSnapshot(
              goalSelection?.primaryGoal,
              goalSelection?.secondaryGoals,
          ).slotCodes;
    return [...new Set(snapshotCodes)].map((code) => allowed.get(code)).filter(Boolean);
}

/**
 * Remove perguntas condicionais que não se aplicam às respostas atuais.
 * Planos legacy sem `makeup_plan_depth` continuam a apresentar a seleção
 * detalhada original, preservando consultas já iniciadas.
 */
export function resolveApplicableQuestionPlanSlots(
    goalSelection,
    questionPlan = null,
    facts = {},
) {
    const slots = resolveQuestionPlanSlots(goalSelection, questionPlan);
    const hasDepthQuestion = slots.some(
        ({ code }) => code === "makeup_plan_depth",
    );
    return slots.filter(({ code }) => {
        if (code !== "makeup_functions" || !hasDepthQuestion) return true;
        return facts.makeup_plan_depth === "custom";
    });
}

/** Verifica em arranque/teste que todas as opções públicas têm tradução. */
export function assertAiConsultationOptionLabelsComplete() {
    for (const goal of AI_CONSULTATION_GOALS) {
        for (const slot of goal.slots) {
            for (const option of slot.options ?? []) getAiConsultationOptionLabel(option);
        }
    }
    return true;
}

/**
 * Expõe ao modelo apenas o tier mais importante ainda não respondido.
 *
 * @param {object[]} slotPlan - Plano criado pelo backend.
 * @param {Record<string, unknown>} facts - Factos já persistidos.
 * @returns {object[]} Slots equivalentes que a OpenAI pode escolher agora.
 */
export function selectHighestPriorityUnansweredSlots(slotPlan, facts = {}) {
    const remaining = slotPlan.filter(
        ({ code }) => !Object.hasOwn(facts, code),
    );
    if (remaining.length === 0) return [];
    return [remaining[0]];
}

/** DTO público sem detalhes de prompts internos. */
export function getPublicAiConsultationGoals() {
    return {
        version: AI_CONSULTATION_GOALS_VERSION,
        selection: { primary: 1, secondaryMax: 2 },
        questions: {
            min: AI_CONSULTATION_MIN_QUESTIONS,
            max: AI_CONSULTATION_MAX_QUESTIONS,
        },
        goals: AI_CONSULTATION_GOALS.map((goal) => ({
            code: goal.code,
            label: goal.label,
            description: goal.description,
            requiresPhotos: goal.requiresPhotos,
            supportsMakeupPreview: goal.supportsMakeupPreview,
        })),
    };
}
