/**
 * Controller da leitura de insights públicos do consultor pelo cliente.
 */
import { listPublishedConsultantInsightsForClient } from "../services/ai-consultation-review.service.js";
import { validateClientInsightQuery } from "../validators/client-ai-insight.validator.js";

/**
 * Lista os insights públicos publicados para o cliente autenticado.
 *
 * @async
 * @function listMyClientAiInsightsController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com insights públicos.
 */
export async function listMyClientAiInsightsController(req, res, next) {
    try {
        const filters = validateClientInsightQuery(req.query);
        // O cliente nunca envia userId: ownership vem sempre da sessão HttpOnly.
        const insights = await listPublishedConsultantInsightsForClient(
            req.user.id,
            filters,
        );

        return res.status(200).json({ insights });
    } catch (err) {
        return next(err);
    }
}
