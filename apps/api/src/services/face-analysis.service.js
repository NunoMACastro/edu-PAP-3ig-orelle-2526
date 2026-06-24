import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { analyzeSkinPhotos } from "../providers/skin-analysis.provider.js";
import {
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "./performance-budget.service.js";

/**
 * Encontra a fotografia ativa mais recente de um tipo.
 *
 * @function latestByKind
 * @param {object[]} photos - Fotografias ordenadas por data decrescente.
 * @param {"frontal"|"perfil"} kind - Tipo pretendido.
 * @returns {object|undefined} Fotografia mais recente.
 */
function latestByKind(photos, kind) {
    return photos.find((photo) => photo.kind === kind);
}

/**
 * Converte análise para resposta segura.
 *
 * @function toFaceAnalysisResponse
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, providerName: string, findings: object, sources: string[], limitations: string[], status: string, createdAt: Date|undefined}} Análise pública.
 */
function toFaceAnalysisResponse(analysis) {
    return {
        id: analysis._id.toString(),
        providerName: analysis.providerName,
        findings: analysis.findings,
        sources: analysis.sources,
        limitations: analysis.limitations,
        status: analysis.status,
        createdAt: analysis.createdAt,
    };
}

/**
 * Cria uma análise para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Análise criada.
 */
export async function createFaceAnalysisForUser(userId) {
    return runWithPerformanceBudget({
        operation: FACE_ANALYSIS_OPERATION,
        budgetMs: FACE_ANALYSIS_BUDGET_MS,
        task: async () => {
            const consent = await FaceConsent.findOne({
                userId,
                revokedAt: null,
            });

            if (!consent) {
                throw new AppError(403, "Consentimento facial em falta");
            }

            const photos = await FacePhoto.find({ userId, status: "active" })
                .sort({ createdAt: -1 })
                .select("+storageKey");

            const frontalPhoto = latestByKind(photos, "frontal");
            const perfilPhoto = latestByKind(photos, "perfil");

            if (!frontalPhoto || !perfilPhoto) {
                throw new AppError(
                    400,
                    "Fotografias frontal e de perfil obrigatórias",
                );
            }

            // O provider recebe documentos internos, mas a resposta pública
            // continua a ser minimizada por toFaceAnalysisResponse.
            const result = await analyzeSkinPhotos({
                frontalPhoto,
                perfilPhoto,
            });

            const analysis = await FaceAnalysis.create({
                userId,
                photoIds: [frontalPhoto._id, perfilPhoto._id],
                consentId: consent._id,
                providerName: result.providerName,
                findings: result.findings,
                sources: result.sources,
                limitations: result.limitations,
            });

            return toFaceAnalysisResponse(analysis);
        },
    });
}