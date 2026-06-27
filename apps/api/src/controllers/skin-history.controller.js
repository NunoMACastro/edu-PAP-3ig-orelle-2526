/**
 * Controller de historico pessoal de pele.
 */
import { getPersonalSkinHistory } from "../services/skin-history.service.js";

/**
 * Devolve historico pessoal do utilizador autenticado.
 *
 * @async
 * @function getMySkinHistoryController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function getMySkinHistoryController(req, res, next) {
    try {
        const history = await getPersonalSkinHistory(req.user.id);
        return res.status(200).json({ history });
    } catch (err) {
        return next(err);
    }
}
