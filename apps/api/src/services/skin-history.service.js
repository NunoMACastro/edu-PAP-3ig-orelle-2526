/**
 * Service de historico pessoal de pele da MF1.
 */
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";

/**
 * Converte analise em item cronologico seguro.
 *
 * @function toAnalysisHistoryItem
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {object} Item de historico de analise.
 */
function toAnalysisHistoryItem(analysis) {
    return {
        id: analysis._id.toString(),
        type: "analysis",
        createdAt: analysis.createdAt,
        providerName: analysis.providerName,
        findings: analysis.findings,
        limitations: analysis.limitations,
    };
}

/**
 * Converte relatorio em item cronologico seguro.
 *
 * @function toReportHistoryItem
 * @param {object} report - Documento Mongoose ou mock equivalente.
 * @returns {object} Item de historico de relatorio.
 */
function toReportHistoryItem(report) {
    return {
        id: report._id.toString(),
        type: "report",
        analysisId: report.analysisId.toString(),
        createdAt: report.createdAt,
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        limitations: report.limitations,
    };
}

/**
 * Lista historico pessoal do utilizador autenticado.
 *
 * @async
 * @function getPersonalSkinHistory
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Historico ordenado por data descrescente.
 */
export async function getPersonalSkinHistory(userId) {
    const [analyses, reports] = await Promise.all([
        FaceAnalysis.find({ userId })
            .select("providerName findings limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
        FaceReport.find({ userId })
            .select(
                "analysisId cosmeticSummary routineSuggestions limitations createdAt",
            )
            .sort({ createdAt: -1 })
            .limit(30),
    ]);

    return [
        ...analyses.map(toAnalysisHistoryItem),
        ...reports.map(toReportHistoryItem),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
