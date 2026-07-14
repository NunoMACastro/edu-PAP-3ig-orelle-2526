/**
 * Controller do historico seguro da interacao cliente-IA.
 */
import { listMyAiInteractionHistory } from "../services/ai-interaction-history.service.js";

/**
 * Lista o historico IA do utilizador autenticado.
 *
 * @async
 * @function getMyAiInteractionHistoryController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com timeline publica.
 */
export async function getMyAiInteractionHistoryController(req, res, next) {
    try {
        // O ownership vem da sessao autenticada para impedir leitura de historico de outro cliente.
        const history = await listMyAiInteractionHistory(req.user.id, {
            limit: req.query.limit,
        });

        return res.status(200).json({ history });
    } catch (err) {
        return next(err);
    }
}
