/**
 * Service de comparacao temporal de pele.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";

const MIN_DAYS_BETWEEN_ANALYSES = 30;
const METRIC_LABELS = {
    skinType: "Tipo de pele",
    acne: "Acne",
    manchas: "Manchas",
    rugas: "Rugas",
    oleosidade: "Oleosidade",
};

/**
 * Calcula dias completos entre duas datas.
 *
 * @function getDaysBetween
 * @param {Date} start - Data inicial.
 * @param {Date} end - Data final.
 * @returns {number} Dias completos entre datas.
 */
function getDaysBetween(start, end) {
    const milliseconds = new Date(end).getTime() - new Date(start).getTime();
    return Math.floor(milliseconds / (24 * 60 * 60 * 1000));
}

/**
 * Extrai label publico de um finding de analise facial.
 *
 * @function getFindingLabel
 * @param {{label?: string}|undefined} finding - Finding guardado na analise.
 * @returns {string} Label seguro para DTO.
 */
function getFindingLabel(finding) {
    return String(finding?.label ?? "sem registo");
}

/**
 * Cria descritor textual da alteracao de uma metrica.
 *
 * @function buildChangeLabel
 * @param {string} baselineValue - Valor inicial.
 * @param {string} followUpValue - Valor final.
 * @returns {string} Alteracao em linguagem segura.
 */
function buildChangeLabel(baselineValue, followUpValue) {
    if (baselineValue === followUpValue) {
        return "manteve-se";
    }

    return `alterou de ${baselineValue} para ${followUpValue}`;
}

/**
 * Converte documento de comparacao para DTO minimizado.
 *
 * @function toSkinComparisonResponse
 * @param {object} comparison - Documento Mongoose ou mock equivalente.
 * @returns {object} Comparacao sem dados biometricos brutos.
 */
function toSkinComparisonResponse(comparison) {
    return {
        id: comparison._id.toString(),
        baselineAnalysisId: comparison.baselineAnalysisId.toString(),
        followUpAnalysisId: comparison.followUpAnalysisId.toString(),
        daysBetween: comparison.daysBetween,
        metricDeltas: comparison.metricDeltas,
        summary: comparison.summary,
        limitations: comparison.limitations,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
    };
}

/**
 * Cria ou atualiza a comparacao temporal entre duas analises do proprio cliente.
 *
 * @async
 * @function createSkinComparison
 * @param {string} userId - ID do utilizador autenticado.
 * @param {{baselineAnalysisId: string, followUpAnalysisId: string}} input - IDs validados.
 * @returns {Promise<object>} Comparacao minimizada.
 * @throws {AppError} Quando as analises nao existem, nao pertencem ao utilizador ou nao cumprem 30 dias.
 */
export async function createSkinComparison(userId, input) {
    const [baselineAnalysis, followUpAnalysis] = await Promise.all([
        FaceAnalysis.findOne({
            _id: input.baselineAnalysisId,
            userId,
            status: "completed",
        }),
        FaceAnalysis.findOne({
            _id: input.followUpAnalysisId,
            userId,
            status: "completed",
        }),
    ]);

    if (!baselineAnalysis || !followUpAnalysis) {
        throw new AppError(404, "Analises nao encontradas");
    }

    const daysBetween = getDaysBetween(
        baselineAnalysis.createdAt,
        followUpAnalysis.createdAt,
    );

    if (daysBetween < MIN_DAYS_BETWEEN_ANALYSES) {
        throw new AppError(
            400,
            "A comparacao exige pelo menos 30 dias entre analises",
        );
    }

    const metricDeltas = Object.entries(METRIC_LABELS).map(([metric, label]) => {
        const baselineValue = getFindingLabel(baselineAnalysis.findings?.[metric]);
        const followUpValue = getFindingLabel(followUpAnalysis.findings?.[metric]);

        return {
            metric: label,
            baselineValue,
            followUpValue,
            changeLabel: buildChangeLabel(baselineValue, followUpValue),
        };
    });

    const changedMetrics = metricDeltas.filter(
        (delta) => delta.baselineValue !== delta.followUpValue,
    ).length;

    const comparison = await SkinComparison.findOneAndUpdate(
        {
            userId,
            baselineAnalysisId: input.baselineAnalysisId,
            followUpAnalysisId: input.followUpAnalysisId,
        },
        {
            $set: {
                userId,
                baselineAnalysisId: input.baselineAnalysisId,
                followUpAnalysisId: input.followUpAnalysisId,
                daysBetween,
                metricDeltas,
                summary:
                    changedMetrics === 0
                        ? "As metricas cosmeticas mantiveram-se semelhantes no periodo observado."
                        : `${changedMetrics} metricas cosmeticas tiveram alteracao observavel no periodo.`,
                limitations: [
                    "Comparacao cosmetica baseada em analises historicas, sem diagnostico medico.",
                    "A evolucao observada nao garante resultado clinico nem substitui aconselhamento profissional.",
                ],
            },
        },
        { new: true, upsert: true, runValidators: true },
    );

    return toSkinComparisonResponse(comparison);
}
