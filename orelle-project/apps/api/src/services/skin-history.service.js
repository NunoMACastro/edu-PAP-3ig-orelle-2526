import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";

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

export async function getPersonalSkinHistory(userId) {
    const [analyses, reports] = await Promise.all([
        FaceAnalysis.find({ userId })
            .select("providerName findings limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
        FaceReport.find({ userId })
            .select("analysisId cosmeticSummary routineSuggestions limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
    ]);

    return [...analyses.map(toAnalysisHistoryItem), ...reports.map(toReportHistoryItem)]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}