/**
 * Service de historico pessoal de pele da MF1.
 */
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";

/**
 * Converte analise em item cronologico seguro.
 *
 * @function toAnalysisHistoryItem
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {object} Item de historico de analise.
 */
function toAnalysisHistoryItem(analysis, { unlocked = false, reportId = null } = {}) {
    const metadata = {
        id: analysis._id.toString(),
        type: "analysis",
        createdAt: analysis.createdAt,
        mode: analysis.mode,
        isDemo: analysis.isDemo,
        providerName: analysis.providerName,
        providerVersion: analysis.providerVersion,
        reportId,
        locked: !unlocked,
    };

    return unlocked
        ? {
              ...metadata,
              findings: analysis.findings,
              limitations: analysis.limitations,
          }
        : metadata;
}

/**
 * Converte relatorio em item cronologico seguro.
 *
 * @function toReportHistoryItem
 * @param {object} report - Documento Mongoose ou mock equivalente.
 * @returns {object} Item de historico de relatorio.
 */
function toReportHistoryItem(report, { unlocked = false } = {}) {
    const metadata = {
        id: report._id.toString(),
        type: "report",
        analysisId: report.analysisId.toString(),
        createdAt: report.createdAt,
        mode: report.analysisMode,
        isDemo: report.analysisIsDemo,
        providerVersion: report.analysisProviderVersion,
        lifecycleStatus: report.lifecycleStatus ?? null,
        objectives: report.objectives ?? [],
        locked: !unlocked,
    };

    return unlocked
        ? {
              ...metadata,
              cosmeticSummary: report.cosmeticSummary,
              routineSuggestions: report.routineSuggestions,
              limitations: report.limitations,
          }
        : metadata;
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
            .select("userId mode isDemo providerName providerVersion findings limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
        // Pedidos de eliminacao/anonymizacao mantem esses relatorios fora do historico.
        FaceReport.find({ userId, privacyStatus: "active" })
            .select(
                "userId schemaVersion analysisId analysisMode analysisIsDemo analysisProviderVersion lifecycleStatus objectives cosmeticSummary routineSuggestions limitations createdAt",
            )
            .sort({ createdAt: -1 })
            .limit(30),
    ]);

    const unlocks = await ReportUnlock.find({
        userId,
        reportId: { $in: reports.map(({ _id }) => _id) },
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
    })
        .select("reportId status")
        .lean();
    const unlockedReportIds = new Set(
        unlocks.map(({ reportId }) => reportId.toString()),
    );
    const reportByAnalysisId = new Map(
        reports.map((report) => [report.analysisId.toString(), report]),
    );

    return [
        ...analyses.map((analysis) => {
            const report = reportByAnalysisId.get(analysis._id.toString());
            const unlocked = Boolean(
                report && unlockedReportIds.has(report._id.toString()),
            );
            return toAnalysisHistoryItem(analysis, {
                unlocked,
                reportId: report?._id?.toString?.() ?? null,
            });
        }),
        ...reports.map((report) =>
            toReportHistoryItem(report, {
                unlocked: unlockedReportIds.has(report._id.toString()),
            }),
        ),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
