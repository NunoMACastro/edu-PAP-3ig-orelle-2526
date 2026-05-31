import { AppError } from "../middlewares/error.middleware.js";

const ALLOWED_STUB_HOSTS = ["localhost", "127.0.0.1", "images.orelle.local"];

function parseUrl(value) {
    try {
        return new URL(String(value ?? "").trim());
    } catch {
        return null;
    }
}

export function validateProfilePhotoInput(body) {
    const mode = String(body.profilePhotoMode ?? "stub_url").trim();

    if (mode === "secure_upload") {
        throw new AppError(
            403,
            "Upload real de fotografia bloqueado neste BK; usar stub_url ate existir consentimento e storage seguro",
        );
    }

    if (mode !== "stub_url") {
        throw new AppError(400, "Modo de fotografia invalido");
    }

    const url = parseUrl(body.profilePhotoUrl);

    if (!url || !["http:", "https:"].includes(url.protocol)) {
        throw new AppError(
            400,
            "profilePhotoUrl deve ser um URL http/https controlado",
        );
    }

    if (!ALLOWED_STUB_HOSTS.includes(url.hostname)) {
        throw new AppError(
            400,
            "profilePhotoUrl deve apontar para origem controlada da Orelle",
        );
    }

    return {
        profilePhotoMode: "stub_url",
        profilePhotoUrl: url.toString(),
    };
}