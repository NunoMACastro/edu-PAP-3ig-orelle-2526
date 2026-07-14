/**
 * Service de comparacao temporal de pele.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { listUnlockedAnalysisIds } from "./report-analysis-access.service.js";

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
function toSkinComparisonResponse(
    comparison,
    baselineAnalysis,
    followUpAnalysis,
) {
    return {
        id: comparison._id.toString(),
        baselineDate: baselineAnalysis.createdAt,
        followUpDate: followUpAnalysis.createdAt,
        daysBetween: comparison.daysBetween,
        metricDeltas: comparison.metricDeltas,
        summary: comparison.summary,
        limitations: comparison.limitations,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
    };
}

/**
 * Constrói as opções públicas de comparação sem expor paths de fotografias.
 *
 * Cada imagem disponível aponta exclusivamente para o endpoint autenticado do
 * titular. O identificador técnico faz parte do URL gerado pelo servidor, mas
 * nunca é apresentado como campo ou valor a introduzir manualmente.
 *
 * @async
 * @function listSkinComparisonOptions
 * @param {string} userId - Titular autenticado.
 * @returns {Promise<object[]>} Análises próprias ordenadas por data.
 */
export async function listSkinComparisonOptions(userId) {
    const unlockedAnalysisIds = await listUnlockedAnalysisIds(userId);
    const analyses = await FaceAnalysis.find({
        userId,
        status: "completed",
        _id: { $in: [...unlockedAnalysisIds] },
    })
        // `findings` é um payload cifrado contextual: o getter precisa do
        // envelope completo e de `userId` para autenticar o AAD antes de
        // aceder a `skinType`.
        .select("userId photoIds consentId findings createdAt")
        .sort({ createdAt: 1 })
        .limit(30);

    if (analyses.length === 0) return [];

    const consentIds = [
        ...new Set(analyses.map((analysis) => String(analysis.consentId))),
    ];
    const consents = await FaceConsent.find({
        _id: { $in: consentIds },
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    }).select("_id");
    const validConsentIds = new Set(
        consents.map((consent) => String(consent._id)),
    );
    const photoIds = analyses
        .filter((analysis) => validConsentIds.has(String(analysis.consentId)))
        .flatMap((analysis) => analysis.photoIds ?? []);
    const photos =
        photoIds.length === 0
            ? []
            : await FacePhoto.find({
                  _id: { $in: photoIds },
                  userId,
                  consentId: { $in: [...validConsentIds] },
                  kind: "frontal",
                  status: "active",
              }).select("_id");
    const availablePhotoIds = new Set(photos.map((photo) => String(photo._id)));

    return analyses.map((analysis) => {
        const imageAvailable = (analysis.photoIds ?? []).some((photoId) =>
            availablePhotoIds.has(String(photoId)),
        );

        return {
            selectionKey: analysis._id.toString(),
            date: analysis.createdAt,
            skinType: analysis.findings?.skinType?.label ?? "não conclusivo",
            imageUrl: imageAvailable
                ? `/api/me/skin-analyses/${analysis._id.toString()}/image`
                : null,
        };
    });
}

/**
 * Cria ou atualiza a comparacao temporal entre duas analises do proprio cliente.
 *
 * @async
 * @function createSkinComparison
 * @param {string} userId - ID do utilizador autenticado.
 * @param {{baselineSelection: string, followUpSelection: string}} input - Opções validadas.
 * @returns {Promise<object>} Comparacao minimizada.
 * @throws {AppError} Quando as analises nao existem, nao pertencem ao utilizador ou nao cumprem 30 dias.
 */
export async function createSkinComparison(userId, input) {
    const unlockedAnalysisIds = await listUnlockedAnalysisIds(userId, {
        analysisIds: [input.baselineSelection, input.followUpSelection],
    });
    if (
        !unlockedAnalysisIds.has(String(input.baselineSelection)) ||
        !unlockedAnalysisIds.has(String(input.followUpSelection))
    ) {
        throw new AppError(404, "Analises nao encontradas");
    }
    const [baselineAnalysis, followUpAnalysis] = await Promise.all([
        FaceAnalysis.findOne({
            _id: input.baselineSelection,
            userId,
            status: "completed",
        }),
        FaceAnalysis.findOne({
            _id: input.followUpSelection,
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

    if (daysBetween < 0) {
        throw new AppError(
            400,
            "A análise final deve ser posterior à análise inicial",
        );
    }

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
            baselineAnalysisId: baselineAnalysis._id,
            followUpAnalysisId: followUpAnalysis._id,
        },
        {
            $set: {
                userId,
                baselineAnalysisId: baselineAnalysis._id,
                followUpAnalysisId: followUpAnalysis._id,
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

    return toSkinComparisonResponse(
        comparison,
        baselineAnalysis,
        followUpAnalysis,
    );
}
