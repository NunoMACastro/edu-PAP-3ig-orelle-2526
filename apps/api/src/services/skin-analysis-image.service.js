/**
 * Leitura controlada da fotografia frontal usada numa análise cosmética.
 *
 * Os bytes só saem por um endpoint autenticado e apenas quando análise,
 * consentimento e fotografia pertencem ao mesmo titular. Paths e metadados de
 * cifra nunca fazem parte do contrato público.
 */
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";

const SAFE_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

/**
 * Lê em memória uma vista cifrada pertencente à análise e ao titular.
 *
 * A revogação bloqueia novo processamento, mas não a leitura dos dados já
 * existentes pelo próprio titular. Uma fotografia eliminada devolve 404.
 *
 * @async
 * @function getOwnedSkinAnalysisImage
 * @param {string} userId - Titular autenticado.
 * @param {string} analysisId - Análise indicada no URL.
 * @param {"frontal"|"perfil"} [kind="frontal"] - Vista pedida.
 * @param {{signal?: AbortSignal}} [options] - Cancelamento do pedido.
 * @returns {Promise<{bytes: Buffer, mimeType: string}>} Imagem descifrada.
 * @throws {AppError} Quando a leitura segura não é possível.
 */
export async function getOwnedSkinAnalysisImage(
    userId,
    analysisId,
    kind = "frontal",
    { signal } = {},
) {
    const analysis = await FaceAnalysis.findOne({
        _id: analysisId,
        userId,
        status: "completed",
    }).select("photoIds consentId");

    if (!analysis) {
        throw new AppError(404, "Imagem de análise não encontrada");
    }

    const consent = await FaceConsent.findOne({
        _id: analysis.consentId,
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    }).select("_id");

    if (!consent) {
        throw new AppError(404, "Imagem de análise não encontrada");
    }

    const photo = await FacePhoto.findOne({
        _id: { $in: analysis.photoIds },
        userId,
        consentId: consent._id,
        kind,
        status: "active",
    }).select(
        "+storageKey +encryption +encryption.iv +encryption.authTag",
    );

    if (!photo || !SAFE_IMAGE_MIME_TYPES.has(photo.mimeType)) {
        throw new AppError(404, "Imagem de análise não encontrada");
    }

    return {
        bytes: await readEncryptedFacePhotoFile(photo, { signal }),
        mimeType: photo.mimeType,
    };
}
