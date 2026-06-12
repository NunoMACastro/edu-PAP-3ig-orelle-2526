/**
 * Controller de simulacao de maquilhagem.
 */
import { createMakeupSimulationForUser } from "../services/makeup-simulation.service.js";
import { validateMakeupSimulationInput } from "../validators/makeup-simulation.validator.js";

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
