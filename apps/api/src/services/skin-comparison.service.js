import { FaceAnalysis } from "../models/face-analysis.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMPARABLE_METRICS = ["skinType", "acne", "spots", "wrinkles", "oiliness"];

/**
 * Calcula a distância inteira em dias entre duas datas.
 * @param {Date | string} a - Primeira data da comparação.
 * @param {Date | string} b - Segunda data da comparação.
 * @returns {number} Número absoluto de dias entre as datas.
 */
function daysBetween(a, b) {
    return Math.floor(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

/**
 * Constrói a lista de diferenças observáveis entre duas análises faciais.
 * @param {{ findings?: Record<string, unknown> }} baseline - Análise inicial.
 * @param {{ findings?: Record<string, unknown> }} followUp - Análise final.
 * @returns {Array<{ metric: string, baselineValue: unknown, followUpValue: unknown, changeLabel: string }>}
 */
function buildMetricDeltas(baseline, followUp) {
    return COMPARABLE_METRICS.map((metric) => {
        const baselineValue = baseline.findings?.[metric] ?? "sem dados";
        const followUpValue = followUp.findings?.[metric] ?? "sem dados";
        return {
            metric,
            baselineValue,
            followUpValue,
            changeLabel: baselineValue === followUpValue ? "sem alteração observável" : "alteração observada",
        };
    });
}

/**
 * Cria ou atualiza uma comparação facial para o cliente autenticado.
 * @param {string} userId - ID do utilizador vindo da sessão autenticada.
 * @param {{ baselineAnalysisId: string, followUpAnalysisId: string }} payload - IDs das análises a comparar.
 * @returns {Promise<{ id: string, daysBetween: number, metricDeltas: Array<object>, summary: string, limitations: string[] }>}
 * @throws {AppError} Quando as análises não pertencem ao cliente ou não respeitam o intervalo mínimo.
 */
export async function createSkinComparison(userId, { baselineAnalysisId, followUpAnalysisId }) {
    // O filtro por userId aplica ownership; análises de outro cliente são tratadas como inexistentes.
    const [baseline, followUp] = await Promise.all([
        FaceAnalysis.findOne({ _id: baselineAnalysisId, userId }).select("findings createdAt"),
        FaceAnalysis.findOne({ _id: followUpAnalysisId, userId }).select("findings createdAt"),
    ]);

    if (!baseline || !followUp) {
        throw new AppError(404, "Análise não encontrada");
    }

    const intervalDays = daysBetween(baseline.createdAt, followUp.createdAt);
    if (intervalDays < 30) {
        throw new AppError(400, "A comparação exige pelo menos 30 dias entre análises");
    }

    const metricDeltas = buildMetricDeltas(baseline, followUp);
    const comparison = await SkinComparison.findOneAndUpdate(
        { userId, baselineAnalysisId, followUpAnalysisId },
        {
            userId,
            baselineAnalysisId,
            followUpAnalysisId,
            daysBetween: intervalDays,
            metricDeltas,
            summary: "Comparação cosmética entre duas análises do histórico pessoal.",
            limitations: [
                "Esta comparação não é diagnóstico médico.",
                "Resultados dependem da qualidade das fotografias e das condições de luz.",
            ],
        },
        { new: true, upsert: true },
    );

    return {
        id: comparison._id.toString(),
        daysBetween: comparison.daysBetween,
        metricDeltas: comparison.metricDeltas,
        summary: comparison.summary,
        limitations: comparison.limitations,
    };
}