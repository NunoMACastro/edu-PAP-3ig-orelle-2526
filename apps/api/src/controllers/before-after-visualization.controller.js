/**
 * Controller de visualização antes/depois.
 */
import { createBeforeAfterVisualizationForUser } from "../services/before-after-visualization.service.js";
import { validateBeforeAfterVisualizationInput } from "../validators/before-after-visualization.validator.js";

/**
 * Cria a visualização antes/depois para uma simulação pertencente ao utilizador.
 *
 * @async
 * @function createBeforeAfterVisualizationController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado com o ID da simulação no body.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com a visualização pública.
 */
export async function createBeforeAfterVisualizationController(req, res, next) {
    try {
        const input = validateBeforeAfterVisualizationInput(req.body);
        const visualization = await createBeforeAfterVisualizationForUser(
            req.user.id,
            input.simulationId,
        );
        return res.status(201).json({ visualization });
    } catch (err) {
        return next(err);
    }
}
