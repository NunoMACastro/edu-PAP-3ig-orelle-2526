/**
 * Validador da fotografia de perfil no BK-MF0-04.
 *
 * Este BK nao implementa upload real de fotografias biometricas. Em vez disso,
 * aceita apenas um URL controlado em modo `stub_url`, para preparar a interface
 * sem violar os requisitos futuros de consentimento e storage seguro.
 */
import { AppError } from "../middlewares/error.middleware.js";

const ALLOWED_STUB_HOSTS = ["localhost", "127.0.0.1", "images.orelle.local"];

/**
 * Tenta converter um valor para URL.
 *
 * @function parseUrl
 * @param {unknown} value - Valor recebido do cliente.
 * @returns {URL|null} URL valido ou null quando o valor e invalido.
 */
function parseUrl(value) {
    try {
        return new URL(String(value ?? "").trim());
    } catch {
        return null;
    }
}

/**
 * Valida o payload de fotografia controlada do RF04.
 *
 * @function validateProfilePhotoInput
 * @param {{profilePhotoMode?: unknown, profilePhotoUrl?: unknown}} body - Corpo do pedido.
 * @returns {{profilePhotoMode: "stub_url", profilePhotoUrl: string}} Dados prontos para persistencia.
 * @throws {AppError} Quando o modo tenta upload real ou o URL nao e controlado.
 */
export function validateProfilePhotoInput(body) {
    const mode = String(body.profilePhotoMode ?? "stub_url").trim();

    if (mode === "secure_upload") {
        throw new AppError(
            403,
            "Upload real de fotografia bloqueado neste BK; usar stub_url até existir consentimento e storage seguro",
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
