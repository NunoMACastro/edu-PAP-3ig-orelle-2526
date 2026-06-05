import { createFaceAnalysisForUser } from "../services/face-analysis.service.js";

export async function createFaceAnalysisController(req, res, next) {
    try {
        const analysis = await createFaceAnalysisForUser(req.user.id);
        return res.status(201).json({ analysis });
    } catch (err) {
        return next(err);
    }
}