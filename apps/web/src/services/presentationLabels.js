/**
 * Labels públicos para enums recebidos da API.
 *
 * Valores desconhecidos falham fechados para texto neutro e nunca são
 * apresentados diretamente ao utilizador.
 */

const USER_ROLE_LABELS = Object.freeze({
    cliente: "Cliente",
    consultor: "Consultor",
    administrador: "Administrador",
});

const PRODUCT_REVIEW_STATUS_LABELS = Object.freeze({
    published: "Publicada",
    hidden: "Oculta",
});

const ORDER_STATUS_LABELS = Object.freeze({
    pendente: "Pendente",
    enviado: "Enviada",
    entregue: "Entregue",
    cancelled: "Cancelada",
});

const VOUCHER_STATUS_LABELS = Object.freeze({
    active: "Disponível",
    used: "Utilizado",
});

const SKIN_TYPE_LABELS = Object.freeze({
    normal: "Normal",
    seca: "Seca",
    oleosa: "Oleosa",
    mista: "Mista",
    sensivel: "Sensível",
    nao_conclusivo: "Não conclusivo",
});

const PRODUCT_TEXTURE_LABELS = Object.freeze({
    gel: "Gel",
    foam: "Espuma",
    oil: "Óleo",
    water: "Água",
    serum: "Sérum",
    cream: "Creme",
    gel_cream: "Gel-creme",
    fluid: "Fluido",
    balm: "Bálsamo",
    powder: "Pó",
    liquid: "Líquido",
    other: "Outro",
});

const PRODUCT_FINISH_LABELS = Object.freeze({
    natural: "Natural",
    matte: "Mate",
    luminous: "Luminoso",
    satin: "Acetinado",
    dewy: "Viçoso",
    other: "Outro",
});

const PRODUCT_COVERAGE_LABELS = Object.freeze({
    none: "Sem cobertura",
    sheer: "Translúcida",
    light: "Leve",
    medium: "Média",
    full: "Alta",
});

const PRODUCT_UNDERTONE_LABELS = Object.freeze({
    neutral: "Neutro",
    warm: "Quente",
    cool: "Frio",
    olive: "Oliva",
    universal: "Universal",
});

const PRODUCT_UVA_LABELS = Object.freeze({
    none: "Sem classificação UVA",
    broad_spectrum: "Amplo espectro",
    "pa+++": "PA+++",
    "pa++++": "PA++++",
});

const PRIVACY_SCOPE_LABELS = Object.freeze({
    biometric: "Dados biométricos",
});

const PRIVACY_ACTION_LABELS = Object.freeze({
    delete: "Eliminar dados biométricos",
    anonymize: "Anonimizar dados biométricos",
});

const PRIVACY_STATUS_LABELS = Object.freeze({
    pending: "A aguardar revisão",
    processing: "Em processamento",
    approved: "Aprovado",
    rejected: "Rejeitado",
    failed: "Falhou — pode ser reprocessado",
    completed: "Concluído",
});

const PRIVACY_RESOURCE_LABELS = Object.freeze({
    photos: "Fotografias faciais",
    reports: "Relatórios cosméticos",
});

const BIOMETRIC_AUDIT_EVENT_LABELS = Object.freeze({
    list_requests: "Listagem de pedidos",
    decide_request: "Decisão sobre pedido",
    view_audit: "Consulta da auditoria",
    view_resource: "Consulta de recurso",
});

const BIOMETRIC_AUDIT_OUTCOME_LABELS = Object.freeze({
    allowed: "Permitido",
    denied: "Recusado",
});

const BIOMETRIC_AUDIT_RESOURCE_LABELS = Object.freeze({
    request: "Pedido de privacidade",
    photo: "Fotografia facial",
    report: "Relatório cosmético",
    audit: "Registo de auditoria",
});

/** Devolve o tipo de acesso humano sem refletir valores inesperados. */
export function getUserRoleLabel(role) {
    return USER_ROLE_LABELS[role] ?? "Perfil de acesso indisponível";
}

/** Devolve o estado público de moderação de uma avaliação. */
export function getProductReviewStatusLabel(status) {
    return PRODUCT_REVIEW_STATUS_LABELS[status] ?? "Estado indisponível";
}

/** Devolve o estado logístico humano de uma encomenda. */
export function getOrderStatusLabel(status) {
    return ORDER_STATUS_LABELS[status] ?? "Estado indisponível";
}

/** Devolve o estado de utilização humano de um voucher. */
export function getVoucherStatusLabel(status) {
    return VOUCHER_STATUS_LABELS[status] ?? "Estado indisponível";
}

/** Devolve o tipo de pele em português sem transformar enums desconhecidos. */
export function getSkinTypeLabel(skinType) {
    return SKIN_TYPE_LABELS[skinType] ?? "Tipo de pele indisponível";
}

/** Devolve a textura pública sem refletir enums desconhecidos. */
export function getProductTextureLabel(texture) {
    return PRODUCT_TEXTURE_LABELS[texture] ?? "Textura indisponível";
}

/** Devolve o acabamento público sem refletir enums desconhecidos. */
export function getProductFinishLabel(finish) {
    return PRODUCT_FINISH_LABELS[finish] ?? "Acabamento indisponível";
}

/** Devolve a cobertura pública sem refletir enums desconhecidos. */
export function getProductCoverageLabel(coverage) {
    return PRODUCT_COVERAGE_LABELS[coverage] ?? "Cobertura indisponível";
}

/** Devolve o subtom público sem refletir enums desconhecidos. */
export function getProductUndertoneLabel(undertone) {
    return PRODUCT_UNDERTONE_LABELS[undertone] ?? "Subtom indisponível";
}

/** Devolve a classificação UVA pública sem refletir enums desconhecidos. */
export function getProductUvaLabel(uvaRating) {
    return PRODUCT_UVA_LABELS[uvaRating] ?? "Proteção UVA indisponível";
}

/** Devolve o âmbito humano de um pedido de privacidade. */
export function getPrivacyScopeLabel(scope) {
    return PRIVACY_SCOPE_LABELS[scope] ?? "Âmbito indisponível";
}

/** Devolve a ação humana de um pedido de privacidade. */
export function getPrivacyActionLabel(action) {
    return PRIVACY_ACTION_LABELS[action] ?? "Ação indisponível";
}

/** Devolve o estado humano de um pedido de privacidade. */
export function getPrivacyStatusLabel(status) {
    return PRIVACY_STATUS_LABELS[status] ?? "Estado indisponível";
}

/** Devolve o recurso humano de um pedido de privacidade. */
export function getPrivacyResourceLabel(resource) {
    return PRIVACY_RESOURCE_LABELS[resource] ?? "Recurso indisponível";
}

/** Compatibilidade para consumidores legados que ainda não conhecem o campo. */
export function getPrivacyPresentationLabel(value) {
    return (
        PRIVACY_SCOPE_LABELS[value] ??
        PRIVACY_ACTION_LABELS[value] ??
        PRIVACY_STATUS_LABELS[value] ??
        PRIVACY_RESOURCE_LABELS[value] ??
        "Valor de privacidade indisponível"
    );
}

/** Devolve o evento biométrico auditado sem humanização heurística. */
export function getBiometricAuditEventLabel(eventType) {
    return BIOMETRIC_AUDIT_EVENT_LABELS[eventType] ?? "Evento indisponível";
}

/** Devolve o desfecho auditado sem refletir o enum recebido. */
export function getBiometricAuditOutcomeLabel(outcome) {
    return BIOMETRIC_AUDIT_OUTCOME_LABELS[outcome] ?? "Resultado indisponível";
}

/** Devolve o recurso auditado sem refletir o enum recebido. */
export function getBiometricAuditResourceLabel(resourceType) {
    return (
        BIOMETRIC_AUDIT_RESOURCE_LABELS[resourceType] ??
        "Recurso auditado indisponível"
    );
}
