/**
 * Validadores HTTP para pedidos de privacidade biometrica.
 */
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
} from "../models/biometric-data-request.model.js";

const ACTIONS = new Set(Object.values(BIOMETRIC_REQUEST_ACTIONS));
const RESOURCES = new Set(Object.values(BIOMETRIC_REQUEST_RESOURCES));
const DECISIONS = new Set(["approved", "rejected"]);

/**
 * Normaliza texto curto vindo do frontend sem o transformar em requisito novo.
 *
 * @function normalizeShortText
 * @param {unknown} value - Valor recebido no body.
 * @returns {string} Texto aparado e limitado.
 */
function normalizeShortText(value) {
    return String(value ?? "").trim().slice(0, 500);
}

/**
 * Valida o pedido criado pelo proprio cliente.
 *
 * @function validateCreateBiometricDataRequestInput
 * @param {Record<string, unknown>} body - Corpo recebido pela API.
 * @returns {{action: string, resources: string[], reason: string}} Dados normalizados.
 * @throws {AppError} Quando a acao ou os recursos sao invalidos.
 */
export function validateCreateBiometricDataRequestInput(body = {}) {
    const action = String(body.action ?? "").trim();
    const resources = Array.isArray(body.resources)
        ? [...new Set(body.resources.map((item) => String(item).trim()))]
        : [];
    const reason = normalizeShortText(body.reason);

    if (!ACTIONS.has(action)) {
        throw new AppError(400, "Tipo de pedido inválido.");
    }

    if (!resources.length || resources.some((resource) => !RESOURCES.has(resource))) {
        throw new AppError(400, "Recursos do pedido inválidos.");
    }

    return { action, resources, reason };
}

/**
 * Valida a decisao tomada por consultor ou administrador.
 *
 * @function validateBiometricDataRequestDecisionInput
 * @param {Record<string, unknown>} body - Corpo recebido pela API.
 * @returns {{decision: "approved"|"rejected", decisionReason: string}} Decisao normalizada.
 * @throws {AppError} Quando a decisao e invalida.
 */
export function validateBiometricDataRequestDecisionInput(body = {}) {
    const decision = String(body.decision ?? "").trim();
    const decisionReason = normalizeShortText(body.decisionReason);

    if (!DECISIONS.has(decision)) {
        throw new AppError(400, "Decisão do pedido inválida.");
    }

    if (decision === "rejected" && decisionReason.length < 5) {
        throw new AppError(400, "Justificação obrigatória ao rejeitar pedido.");
    }

    return { decision, decisionReason };
}
