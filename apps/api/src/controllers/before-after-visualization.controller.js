/**
 * Controller de visualizacao antes/depois.
 */
import { createBeforeAfterVisualizationForUser } from "../services/before-after-visualization.service.js";
import { validateBeforeAfterVisualizationInput } from "../validators/before-after-visualization.validator.js";

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
