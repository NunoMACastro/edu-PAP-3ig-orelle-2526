/**
 * Controller de evolucao temporal da pele.
 */
import { getMySkinEvolution } from "../services/skin-evolution.service.js";

export async function getMySkinEvolutionController(req, res, next) {
    try {
        const evolution = await getMySkinEvolution(req.user.id);
        return res.status(200).json({ evolution });
    } catch (err) {
        return next(err);
    }
}
