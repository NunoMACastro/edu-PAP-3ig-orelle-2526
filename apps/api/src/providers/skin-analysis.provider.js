/**
 * Boundary OpenAI-only da análise cosmética.
 *
 * A validação local impede fotografias incompletas, aprendizagem externa e
 * finalidades diferentes da que recebeu consentimento. O único provider de
 * runtime é a Responses API; testes podem injetar um cliente apenas através do
 * provider v2, que recusa transportes fora de `NODE_ENV=test`.
 */
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { analyzeSkinPhotosWithOpenAiV2 } from "./openai-responses.provider.js";

function assertPreparedPhoto(photo) {
    return Boolean(
        photo &&
        typeof photo.mimeType === "string" &&
        /^image\/(?:jpeg|png|webp)$/.test(photo.mimeType) &&
        Number.isSafeInteger(Number(photo.sizeBytes)) &&
        Number(photo.sizeBytes) > 0 &&
        typeof photo.imageBase64 === "string" &&
        photo.imageBase64.length > 0,
    );
}

/** Valida fotos e política de finalidade antes de qualquer rede. */
export function assertValidAnalysisPhotos(input) {
    if (!assertPreparedPhoto(input?.frontalPhoto) || !assertPreparedPhoto(input?.perfilPhoto)) {
        throw new AppError(400, "Fotografias preparadas inválidas para análise");
    }
    if (input.requestedPurpose !== FACE_ANALYSIS_CONSENT_PURPOSE) {
        throw new AppError(403, "Finalidade da análise facial não autorizada");
    }
    if (input.allowModelLearning !== false) {
        throw new AppError(403, "Aprendizagem por terceiros não autorizada");
    }
    return input;
}

/** Executa exclusivamente a análise OpenAI real. */
export async function analyzeSkinPhotos(input, options = {}) {
    const validInput = assertValidAnalysisPhotos(input);
    if (validInput.signal?.aborted) {
        throw validInput.signal.reason ?? new AppError(503, "Análise cancelada");
    }
    return analyzeSkinPhotosWithOpenAiV2(validInput, options);
}
