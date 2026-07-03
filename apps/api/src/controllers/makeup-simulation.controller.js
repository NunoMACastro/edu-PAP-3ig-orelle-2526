/**
 * Controller de simulação de maquilhagem.
 */
import { createMakeupSimulationForUser } from "../services/makeup-simulation.service.js";
import { validateMakeupSimulationInput } from "../validators/makeup-simulation.validator.js";

/**
 * Cria uma simulação de maquilhagem para o utilizador autenticado.
 *
 * @async
 * @function createMakeupSimulationController
 * @param {import("express").Request & {user: {id: string}, faceConsent?: object}} req - Pedido autenticado com consentimento facial ativo.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com a simulação pública.
 */
export async function createMakeupSimulationController(req, res, next) {
    try {
        const input = validateMakeupSimulationInput(req.body);
        const simulation = await createMakeupSimulationForUser(
            req.user.id,
            input,
            req.faceConsent,
        );
        return res.status(201).json({ simulation });
    } catch (err) {
        return next(err);
    }
}
