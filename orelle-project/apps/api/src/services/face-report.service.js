import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";

function buildCosmeticSummary(analysis) {
    const { skinType, acne, manchas, rugas, oleosidade } = analysis.findings;

    return [
        `Tipo de pele estimado: ${skinType.label}.`,
        `Acne: ${acne.label}.`,
        `Manchas: ${manchas.label}.`,
        `Rugas: ${rugas.label}.`,
        `Oleosidade: ${oleosidade.label}.`,
        "Esta leitura é cosmética e deve ser interpretada com as limitações indicadas.",
    ].join(" ");
}

function buildRoutineSuggestions(analysis) {
    const oleosidade = analysis.findings.oleosidade.label;

    return [
        {
            period: "manha",
            title: "Limpeza suave",
            reason: `Ajuda a preparar a pele sem assumir tratamento médico. Oleosidade observada: ${oleosidade}.`,
        },
        {
            period: "manha",
            title: "Cuidado emoliente leve",
            reason: "O cuidado emoliente apoia conforto da pele e não substitui avaliação profissional.",
        },
        {
            period: "noite",
            title: "Remover impurezas",
            reason: "A rotina noturna reduz acumulação de resíduos do dia.",
        },
        {
            period: "noite",
            title: "Reforçar cuidado noturno",
            reason: "Apoia consistência da rotina sem prometer resultado clínico.",
        },
    ];
}

function toFaceReportResponse(report) {
    return {
        id: report._id.toString(),
        analysisId: report.analysisId.toString(),
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        sources: report.sources,
        limitations: report.limitations,
        createdAt: report.createdAt,
    };
}

export async function generateReportFromLatestAnalysis(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" })
        .sort({ createdAt: -1 });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.create({
        userId,
        analysisId: analysis._id,
        cosmeticSummary: buildCosmeticSummary(analysis),
        routineSuggestions: buildRoutineSuggestions(analysis),
        sources: analysis.sources,
        limitations: analysis.limitations,
    });

    return toFaceReportResponse(report);
}