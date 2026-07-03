/**
 * Controller de evolução temporal da pele.
 */
import { getMySkinEvolution } from "../services/skin-evolution.service.js";

/**
 * Devolve os pontos de evolução cosmética da pele do utilizador autenticado.
 *
 * @async
 * @function getMySkinEvolutionController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a evolução pública.
 */
export async function getMySkinEvolutionController(req, res, next) {
    try {
        const evolution = await getMySkinEvolution(req.user.id);
        return res.status(200).json({ evolution });
    } catch (err) {
        return next(err);
    }
}
