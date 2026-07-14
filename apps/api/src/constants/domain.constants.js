/**
 * Contratos de domínio partilhados entre models, validators, services e providers.
 *
 * Estes enums ficam fora dos models para que validação HTTP e regras de negócio
 * possam reutilizar os mesmos valores sem importar a camada de persistência.
 */
export const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];

export const PRODUCT_CONCERN_TAGS = Object.freeze([
    "acne_imperfections",
    "hydration_barrier",
    "oil_control",
    "sensitivity_redness",
    "spots_tone_luminosity",
    "sun_protection",
    "makeup",
]);

export const PRODUCT_ROUTINE_STEPS = Object.freeze([
    "cleanse",
    "tone_exfoliate",
    "treat",
    "moisturize",
    "protect",
    "prime",
    "set",
    "complexion",
    "cheeks",
    "eyes",
    "brows",
    "lips",
]);

/** Funções cosméticas visuais declaradas pelo catálogo, nunca inferidas do nome. */
export const PRODUCT_MAKEUP_FUNCTIONS = Object.freeze([
    "primer",
    "skin_tint",
    "foundation",
    "color_corrector",
    "concealer",
    "setting_powder",
    "blush",
    "bronzer",
    "contour",
    "highlighter",
    "eyeshadow",
    "eyeliner",
    "mascara",
    "brow_product",
    "lip_liner",
    "lipstick",
    "lip_gloss",
    "setting_spray",
]);

/** Slot neutro usado apenas quando nenhum produto declara um passo específico. */
export const GENERIC_REPORT_ROUTINE_SLOT = "general";

/**
 * Allowlist transversal do contrato de rotina v6. Mantê-la no domínio evita
 * dependências invertidas entre validators, services e providers.
 */
export const REPORT_ROUTINE_SLOT_CODES = Object.freeze([
    GENERIC_REPORT_ROUTINE_SLOT,
    ...PRODUCT_ROUTINE_STEPS,
    ...PRODUCT_MAKEUP_FUNCTIONS,
]);

export const PRODUCT_MAKEUP_REGIONS = Object.freeze([
    "complexion",
    "cheeks",
    "eyes",
    "brows",
    "lips",
]);

export const PRODUCT_MAKEUP_APPLICATION_AREAS = Object.freeze([
    "full_complexion",
    "under_eyes",
    "blemishes",
    "t_zone",
    "cheek_apples",
    "cheekbones",
    "jawline",
    "temples",
    "eyelids",
    "lash_line",
    "lashes",
    "brows",
    "lip_contour",
    "lips",
]);

export const PRODUCT_MAKEUP_STYLE_TAGS = Object.freeze([
    "natural_everyday",
    "soft_classic",
    "soft_glam",
    "gala_evening",
    "modern_editorial",
]);

export const PRODUCT_MAKEUP_WEAR_PROFILES = Object.freeze([
    "comfort",
    "longwear",
    "oil_control",
    "hydrating",
    "photo_ready",
]);

export const GENDERS = [
    "feminino",
    "masculino",
    "nao_binario",
    "prefiro_nao_dizer",
];

export const BIOMETRIC_REQUEST_ACTIONS = Object.freeze({
    DELETE: "delete",
    ANONYMIZE: "anonymize",
});

export const BIOMETRIC_REQUEST_RESOURCES = Object.freeze({
    PHOTOS: "photos",
    REPORTS: "reports",
});

export const BIOMETRIC_REQUEST_STATUSES = Object.freeze({
    PENDING: "pending",
    PROCESSING: "processing",
    FAILED: "failed",
    REJECTED: "rejected",
    COMPLETED: "completed",
});

// Pagamento e logística são estados independentes. A aplicação académica só
// suporta simulação explícita e nunca inicia uma transação financeira.
export const ORDER_STATUS = Object.freeze({
    PENDENTE: "pendente",
    ENVIADO: "enviado",
    ENTREGUE: "entregue",
    CANCELLED: "cancelled",
});

export const PAYMENT_MODE = Object.freeze({
    SIMULATED: "simulated",
    SIMULATED_LEGACY: "simulated_legacy",
});

export const PAYMENT_STATUS = Object.freeze({
    AWAITING_SIMULATION: "awaiting_simulation",
    SIMULATED_PAID: "simulated_paid",
    SIMULATED_FAILED: "simulated_failed",
    CANCELLED_LEGACY: "cancelled_legacy",
});

export const NOTIFICATION_TYPES = Object.freeze({
    PROMOTION: "promotion",
    NEW_PRODUCT: "new_product",
    ORDER_STATUS: "order_status",
    ROUTINE_ALERT: "routine_alert",
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(
    Object.values(NOTIFICATION_TYPES),
);
