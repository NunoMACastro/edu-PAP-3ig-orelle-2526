/**
 * Controllers de comparacao temporal de pele.
 */
import { createSkinComparison } from "../services/skin-comparison.service.js";
import { validateSkinComparisonPayload } from "../validators/skin-comparison.validator.js";

/**
 * Cria comparacao temporal para o utilizador autenticado.
 *
 * @async
 * @function createSkinComparisonController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function createSkinComparisonController(req, res, next) {
    try {
        const input = validateSkinComparisonPayload(req.body);
        const comparison = await createSkinComparison(req.user.id, input);

        return res.status(201).json({ comparison });
    } catch (err) {
        return next(err);
    }
}
