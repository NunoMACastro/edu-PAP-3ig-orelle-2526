import { createSkinComparison } from "../services/skin-comparison.service.js";
import { validateSkinComparisonPayload } from "../validators/skin-comparison.validator.js";

/**
 * Handler HTTP que cria uma comparação facial para o utilizador autenticado.
 * @param {import("express").Request} req - Pedido Express com sessão em `req.user`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function createSkinComparisonController(req, res, next) {
    try {
        const payload = validateSkinComparisonPayload(req.body);
        const comparison = await createSkinComparison(req.user.id, payload);
        return res.status(201).json({ comparison });
    } catch (err) {
        return next(err);
    }
}