import { createMakeupSimulationForUser } from "../services/makeup-simulation.service.js";
import { validateMakeupSimulationInput } from "../validators/makeup-simulation.validator.js";

export async function createMakeupSimulationController(req, res, next) {
    try {
        const input = validateMakeupSimulationInput(req.body);
        const result = await createMakeupSimulationForUser({
            userId: req.user.id,
            consent: req.faceConsent,
            productId: input.productId,
        });

        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}