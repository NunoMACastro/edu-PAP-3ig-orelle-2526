/**
 * Regras puras de apresentação para consentimento e qualidade fotográfica.
 *
 * O provider externo pode devolver texto livre. Este módulo funciona como
 * fronteira de confiança: transforma apenas conceitos conhecidos em copy de
 * produto e nunca reflete diretamente conteúdo remoto na interface.
 */
import { isRecord } from "./consultationModel.js";

const GENERIC_PHOTO_WARNING =
    "A análise detetou limitações de enquadramento ou iluminação.";

const TECHNICAL_WARNING_LABELS = Object.freeze({
    uneven_lighting_risk:
        "Procura luz frontal uniforme, sem sombras fortes.",
    exposure_near_limit:
        "Procura luz frontal uniforme, sem sombras fortes.",
    sharpness_near_limit: "Usa uma fotografia mais nítida.",
});

const PUBLIC_WARNING_RULES = Object.freeze([
    {
        pattern: /background|distraction|perturbador|fundo/i,
        message: "Usa um fundo simples e sem elementos distrativos.",
    },
    {
        pattern: /light|lighting|illumination|exposure|shadow|luz|ilumina/i,
        message: "Procura luz frontal uniforme, sem sombras fortes.",
    },
    {
        pattern:
            /profile|perfil|lateral|side[ -]?view|only.*frontal|missing.*profile/i,
        message:
            "Confirma que a fotografia de perfil mostra claramente o rosto de lado.",
    },
    {
        pattern: /cent(?:er|re)|off[ -]?center|frame|cropp|enquadr|occupies/i,
        message: "Centra o rosto e deixa algum espaço à volta.",
    },
    {
        pattern: /hair|beard|facial hair|occlu|cabelo|barba|tap(?:a|ar)/i,
        message: "Afasta cabelo ou outros elementos que tapem o rosto.",
    },
    {
        pattern: /blur|sharp|focus|nitidez|desfoc|foco/i,
        message: "Usa uma fotografia mais nítida.",
    },
]);

/** Limita e remove duplicados sem alterar a ordem de prioridade. */
function uniqueWarnings(warnings) {
    return [...new Set(warnings)].slice(0, 4);
}

/**
 * Converte razões livres do provider em instruções previamente aprovadas.
 * Valores desconhecidos produzem uma única mensagem genérica.
 */
export function getPublicPhotoWarnings(photoQuality) {
    if (!isRecord(photoQuality)) return [];

    const providerValues = [
        ...(Array.isArray(photoQuality.warnings) ? photoQuality.warnings : []),
        ...(Array.isArray(photoQuality.reasons) ? photoQuality.reasons : []),
    ].filter((value) => typeof value === "string" && value.trim().length > 0);

    let hasUnknownWarning = false;
    const messages = providerValues.flatMap((value) => {
        const rule = PUBLIC_WARNING_RULES.find(({ pattern }) =>
            pattern.test(value),
        );
        if (rule) return [rule.message];
        hasUnknownWarning = true;
        return [];
    });

    if (hasUnknownWarning || (photoQuality.status === "warning" && messages.length === 0)) {
        messages.push(GENERIC_PHOTO_WARNING);
    }

    return uniqueWarnings(messages);
}

/** Traduz apenas os códigos técnicos conhecidos produzidos pelo upload local. */
export function getUploadPhotoWarnings(photos) {
    const warningPhotos = (Array.isArray(photos) ? photos : []).filter(
        (photo) => photo?.quality?.status === "warning",
    );
    if (warningPhotos.length === 0) return [];

    const messages = warningPhotos.flatMap((photo) =>
        (Array.isArray(photo.quality?.warnings) ? photo.quality.warnings : [])
            .map((warning) => TECHNICAL_WARNING_LABELS[warning])
            .filter(Boolean),
    );

    return uniqueWarnings(
        messages.length > 0 ? messages : [GENERIC_PHOTO_WARNING],
    );
}

/** Combina qualidade local e multimodal sem expor strings externas. */
export function getSessionPhotoWarnings(session) {
    return uniqueWarnings([
        ...getUploadPhotoWarnings(session?.photos?.items),
        ...getPublicPhotoWarnings(session?.analysis?.photoQuality),
    ]);
}

/**
 * Confirma se o consentimento guardado corresponde exatamente à versão e ao
 * provider atualmente anunciados pela API.
 */
export function hasMatchingFaceAnalysisConsent(payload) {
    const consent = payload?.consent;
    const requirement = payload?.providerConsentRequirement;
    if (!isRecord(consent) || !isRecord(requirement)) return false;

    const coreConsentMatches =
        consent.status === "active" &&
        consent.version === requirement.consentVersion &&
        consent.purposes?.openAiAnalysis === true;
    if (!coreConsentMatches) return false;
    if (requirement.required !== true) return true;

    const providerConsent = consent.externalProviderConsent;
    return (
        providerConsent?.status === "active" &&
        providerConsent.provider === requirement.provider &&
        providerConsent.noticeVersion === requirement.noticeVersion
    );
}
