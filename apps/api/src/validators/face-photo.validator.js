/**
 * Validadores do fluxo de consentimento e upload facial.
 */
import { AppError } from "../middlewares/error.middleware.js";

const DEFAULT_FACE_CONSENT_VERSION = "face-analysis-v2";
const FACE_CONSENT_VERSION_PATTERN = /^face-analysis-v[1-9]\d{0,5}$/;

/**
 * Valida consentimento facial explicito.
 *
 * @function validateFaceConsentInput
 * @param {Record<string, unknown>} body - Corpo JSON do pedido.
 * @returns {{version: string, providerConsentAccepted: boolean, provider: string|undefined, noticeVersion: string|undefined}} Consentimento normalizado.
 * @throws {AppError} Quando o consentimento nao foi aceite.
 */
export function validateFaceConsentInput(body) {
    if (body?.accepted !== true) {
        throw new AppError(400, "Consentimento facial obrigatorio");
    }

    const version = body.version ?? DEFAULT_FACE_CONSENT_VERSION;
    if (
        typeof version !== "string" ||
        !FACE_CONSENT_VERSION_PATTERN.test(version)
    ) {
        throw new AppError(400, "Versao de consentimento facial invalida");
    }

    const provider = body.provider;
    const noticeVersion = body.noticeVersion;

    if (
        provider !== undefined &&
        provider !== "openai"
    ) {
        throw new AppError(400, "Provider de consentimento invalido");
    }

    if (
        noticeVersion !== undefined &&
        (typeof noticeVersion !== "string" ||
            noticeVersion.trim().length < 1 ||
            noticeVersion.trim().length > 64)
    ) {
        throw new AppError(400, "Versao do aviso de provider invalida");
    }

    return {
        version,
        providerConsentAccepted: body.providerConsentAccepted === true,
        provider,
        noticeVersion: noticeVersion?.trim(),
        generativeEditAccepted: body.generativeEditAccepted === true,
        consultantPhotoAccessAccepted:
            body.consultantPhotoAccessAccepted === true,
    };
}

/**
 * Valida que chegaram exatamente as fotografias frontal e de perfil.
 *
 * @function validateUploadedFaceFiles
 * @param {Record<string, object[]>|undefined} files - Ficheiros temporarios recebidos pelo parser Busboy.
 * @returns {{kind: "frontal"|"perfil", file: object}[]} Ficheiros normalizados.
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
