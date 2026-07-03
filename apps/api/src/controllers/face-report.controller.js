/**
 * Controller de relatorios faciais personalizados.
 */
import { generateReportFromLatestAnalysis } from "../services/face-report.service.js";

/**
 * Gera relatorio da analise concluida mais recente do utilizador.
 *
 * @async
 * @function generateLatestFaceReportController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function generateLatestFaceReportController(req, res, next) {
    try {
        const report = await generateReportFromLatestAnalysis(req.user.id);
        return res.status(201).json({ report });
    } catch (err) {
        return next(err);
    }
}
