import { AppError } from "../middlewares/error.middleware.js";

export function validateFaceConsentInput(body) {
    if (body.accepted !== true) {
        throw new AppError(400, "Consentimento facial obrigatorio");
    }

    return {
        version: String(body.version ?? "face-analysis-v1"),
    };
}

export function validateUploadedFaceFiles(files) {
    const frontal = files?.frontal?.[0];
    const perfil = files?.perfil?.[0];

    if (!frontal || !perfil) {
        throw new AppError(400, "Fotografia frontal e de perfil são obrigatórias");
    }

    return [
        { kind: "frontal", file: frontal },
        { kind: "perfil", file: perfil },
    ];
}