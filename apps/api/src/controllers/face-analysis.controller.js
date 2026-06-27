/**
 * Controller de analise facial cosmética.
 */
import { createFaceAnalysisForUser } from "../services/face-analysis.service.js";

/**
 * Cria analise para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function createFaceAnalysisController(req, res, next) {
    try {
        const analysis = await createFaceAnalysisForUser(req.user.id);
        return res.status(201).json({ analysis });
    } catch (err) {
        return next(err);
    }
}
