/**
 * Validator do pedido de geração de recomendações enriquecidas.
 *
 * O body é opcional. A sessão guiada nunca vem do browser: o backend escolhe a
 * última sessão submetida do utilizador autenticado.
 */
import { AppError } from "../middlewares/error.middleware.js";

const DEFAULT_HISTORY_LIMIT = 5;
const MAX_HISTORY_LIMIT = 10;

/**
 * Normaliza limite de histórico usado para enriquecer recomendações.
 *
 * @function normalizeHistoryLimit
 * @param {unknown} value - Valor recebido do body.
 * @returns {number} Limite seguro.
 */
function normalizeHistoryLimit(value) {
    const parsed = Number.parseInt(String(value ?? DEFAULT_HISTORY_LIMIT), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_HISTORY_LIMIT;
    }

    return Math.min(parsed, MAX_HISTORY_LIMIT);
}

/**
 * Valida o pedido de geração de recomendações.
 *
 * @function validateRecommendationGenerationInput
 * @param {object|undefined} body - Body enviado pelo frontend.
 * @returns {{historyLimit: number}} Input normalizado sem identificadores técnicos.
 * @throws {AppError} Quando o body não cumpre o contrato.
 */
export function validateRecommendationGenerationInput(body = {}) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError(400, "Pedido de recomendação inválido");
    }

    if (Object.hasOwn(body, "consultationSessionId")) {
        throw new AppError(
            400,
            "A sessão guiada é selecionada automaticamente pelo backend",
        );
    }

    return {
        historyLimit: normalizeHistoryLimit(body.historyLimit),
    };
}
