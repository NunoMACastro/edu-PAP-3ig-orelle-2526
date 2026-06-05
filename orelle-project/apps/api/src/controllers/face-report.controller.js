import { generateReportFromLatestAnalysis } from "../services/face-report.service.js";

export async function generateLatestFaceReportController(req, res, next) {
    try {
        const report = await generateReportFromLatestAnalysis(req.user.id);
        return res.status(201).json({ report });
    } catch (err) {
        return next(err);
    }
}