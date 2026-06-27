/**
 * Validadores do fluxo de consentimento e upload facial.
 */
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida consentimento facial explícito.
 *
 * @function validateFaceConsentInput
 * @param {Record<string, unknown>} body - Corpo JSON do pedido.
 * @returns {{version: string}} Consentimento normalizado.
 * @throws {AppError} Quando o consentimento não foi aceite.
 */
export function validateFaceConsentInput(body) {
    if (body.accepted !== true) {
        // A API exige ação afirmativa; texto visível no frontend não chega para cumprir RNF12.
        throw new AppError(400, "Consentimento facial obrigatório");
    }

    return {
        version: String(body.version ?? "face-analysis-v1"),
    };
}

/**
 * Valida que chegaram exatamente as fotografias frontal e de perfil.
 *
 * @function validateUploadedFaceFiles
 * @param {Record<string, Express.Multer.File[]>|undefined} files - Ficheiros recebidos por Multer.
 * @returns {{kind: "frontal"|"perfil", file: Express.Multer.File}[]} Ficheiros normalizados.
 * @throws {AppError} Quando falta uma fotografia obrigatoria.
 */
export function validateUploadedFaceFiles(files) {
    const frontal = files?.frontal?.[0];
    const perfil = files?.perfil?.[0];

    if (!frontal || !perfil) {
        throw new AppError(
            400,
            "Fotografia frontal e de perfil são obrigatórias",
        );
    }

    return [
        { kind: "frontal", file: frontal },
        { kind: "perfil", file: perfil },
    ];
}
