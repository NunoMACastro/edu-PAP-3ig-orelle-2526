/**
 * Contratos puros da área de privacidade e eliminação de conta.
 *
 * Mantém endpoints, labels e confirmações destrutivas fora dos componentes
 * React. Assim, a UI pode validar os casos negativos sem duplicar regras ou
 * depender de identificadores técnicos apresentados ao utilizador.
 */
import {
    getPrivacyActionLabel,
    getPrivacyPresentationLabel,
    getPrivacyResourceLabel,
    getPrivacyStatusLabel,
} from "./presentationLabels.js";

export const PRIVACY_ENDPOINTS = Object.freeze({
    myRequests: "/me/privacy-requests",
    adminRequests: "/admin/privacy-requests",
    eraseAccount: "/me/account",
});

export const PRIVACY_ACTION_OPTIONS = Object.freeze([
    { value: "delete", label: getPrivacyActionLabel("delete") },
    { value: "anonymize", label: getPrivacyActionLabel("anonymize") },
]);

export const PRIVACY_RESOURCE_OPTIONS = Object.freeze([
    { value: "photos", label: getPrivacyResourceLabel("photos") },
    { value: "reports", label: getPrivacyResourceLabel("reports") },
]);

export const PRIVACY_STATUS_LABELS = Object.freeze({
    pending: getPrivacyStatusLabel("pending"),
    processing: getPrivacyStatusLabel("processing"),
    approved: getPrivacyStatusLabel("approved"),
    rejected: getPrivacyStatusLabel("rejected"),
    failed: getPrivacyStatusLabel("failed"),
    completed: getPrivacyStatusLabel("completed"),
});

export const ACCOUNT_ERASURE_CONFIRMATION = "ELIMINAR";
export const PRIVACY_RETRY_CONFIRMATION = "REPROCESSAR";

/**
 * Conta os bytes UTF-8 de uma password, tal como o validador da API.
 *
 * @param {unknown} value - Password ainda não validada.
 * @returns {number} Número de bytes UTF-8.
 */
export function getUtf8ByteLength(value) {
    return new TextEncoder().encode(String(value ?? "")).byteLength;
}

/**
 * Valida localmente a confirmação reforçada da eliminação terminal.
 *
 * A API continua a ser a autoridade. Esta validação serve apenas para impedir
 * submissões acidentais e manter a confirmação literal sem trim implícito.
 *
 * @param {{password?: string, confirmation?: string}} form - Formulário local.
 * @returns {{isValid: boolean, errors: {password?: string, confirmation?: string}}} Resultado seguro.
 */
export function validateAccountErasureForm(form = {}) {
    const passwordBytes = getUtf8ByteLength(form.password);
    const errors = {};

    if (passwordBytes < 8 || passwordBytes > 72) {
        errors.password = "A password deve ter entre 8 e 72 bytes UTF-8.";
    }

    if (form.confirmation !== ACCOUNT_ERASURE_CONFIRMATION) {
        errors.confirmation = `Escreve ${ACCOUNT_ERASURE_CONFIRMATION} exatamente como apresentado.`;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Devolve a confirmação exata esperada para uma decisão administrativa.
 *
 * @param {"approved"|"rejected"|string} decision - Decisão selecionada.
 * @returns {string} Palavra inequívoca a escrever.
 */
export function getPrivacyDecisionConfirmation(decision) {
    return decision === "rejected" ? "REJEITAR" : "APROVAR";
}

/**
 * Valida uma decisão antes do PATCH canónico.
 *
 * @param {{decision?: string, decisionReason?: string, confirmation?: string}} draft - Rascunho editável.
 * @returns {{isValid: boolean, errors: {decision?: string, decisionReason?: string, confirmation?: string}}} Resultado.
 */
export function validatePrivacyDecisionDraft(draft = {}) {
    const errors = {};
    const reason = String(draft.decisionReason ?? "").trim();
    const expectedConfirmation = getPrivacyDecisionConfirmation(draft.decision);

    if (!["approved", "rejected"].includes(draft.decision)) {
        errors.decision = "Escolhe aprovar ou rejeitar.";
    }

    if (draft.decision === "rejected" && reason.length < 5) {
        errors.decisionReason = "A rejeição exige uma justificação com pelo menos 5 caracteres.";
    }

    if (draft.confirmation !== expectedConfirmation) {
        errors.confirmation = `Escreve ${expectedConfirmation} exatamente como apresentado.`;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Indica se o workflow permite apresentar a ação idempotente de retry.
 *
 * @param {{status?: string}|null} request - Pedido selecionado.
 * @returns {boolean} Verdadeiro apenas para falhas recuperáveis visíveis.
 */
export function canRetryPrivacyRequest(request) {
    return request?.status === "failed";
}

/**
 * Traduz códigos do domínio para texto de produto sem expor detalhes internos.
 *
 * @param {string} value - Código de ação, recurso ou estado.
 * @returns {string} Label legível ou fallback neutro.
 */
export function getPrivacyLabel(value) {
    return getPrivacyPresentationLabel(value);
}

/**
 * Formata uma data da API sem falhar perante valores ausentes ou inválidos.
 *
 * @param {unknown} value - Data ISO da API.
 * @returns {string} Data local ou indicação neutra.
 */
export function formatPrivacyDate(value) {
    if (!value) return "Ainda não disponível";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Data indisponível";

    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
