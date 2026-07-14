/**
 * Validadores da leitura pública de insights do consultor pelo cliente.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida filtros aceites por `GET /api/me/ai-consultation-insights`.
 *
 * @function validateClientInsightQuery
 * @param {object} query - Query string recebida pelo Express.
 * @returns {{consultationSessionId: string|null}} Filtros normalizados.
 * @throws {AppError} Quando a sessão de consulta não é um ObjectId válido.
 */
export function validateClientInsightQuery(query) {
    const consultationSessionId = String(
        query?.consultationSessionId ?? "",
    ).trim();

    if (!consultationSessionId) {
        return { consultationSessionId: null };
    }

    if (!mongoose.isValidObjectId(consultationSessionId)) {
        throw new AppError(400, "Sessão de consulta inválida");
    }

    return { consultationSessionId };
}
