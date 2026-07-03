/**
 * Adapter para provider externo de análise cosmética da pele.
 *
 * A fronteira externa recebe apenas bytes temporários preparados no backend e
 * devolve sempre o contrato público usado pela Orélle: provider, findings,
 * sources e limitations. A integração não expõe `storageKey`, paths internos,
 * tokens ou chaves no body.
 */
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

const EXTERNAL_PROVIDER_TIMEOUT_MS = 6_000;
const ALLOWED_FINDINGS = ["skinType", "acne", "manchas", "rugas", "oleosidade"];
const LOCAL_PROVIDER_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Confirma que as fotografias foram preparadas pelo backend antes do provider.
 *
 * @function assertExternalAnalysisPayloadInput
 * @param {{frontalPhoto?: object, perfilPhoto?: object}|undefined} input - Fotografias preparadas.
 * @returns {{frontalPhoto: object, perfilPhoto: object}} Fotografias validadas para request externo.
 * @throws {AppError} Quando falta conteúdo temporário ou metadados mínimos.
 */
function assertExternalAnalysisPayloadInput(input) {
    const { frontalPhoto, perfilPhoto } = input ?? {};

    if (
        !frontalPhoto?.mimeType ||
        !perfilPhoto?.mimeType ||
        !frontalPhoto?.sizeBytes ||
        !perfilPhoto?.sizeBytes ||
        !frontalPhoto?.imageBase64 ||
        !perfilPhoto?.imageBase64
    ) {
        throw new AppError(
            400,
            "Fotografias preparadas obrigatórias para provider externo",
        );
    }

    return { frontalPhoto, perfilPhoto };
}

/**
 * Constrói uma fotografia minimizada para o provider remoto.
 *
 * @function buildProviderPhoto
 * @param {"frontal"|"perfil"} kind - Tipo de fotografia facial.
 * @param {{mimeType: string, sizeBytes: number, imageBase64: string}} photo - Fotografia preparada.
 * @returns {{kind: string, mimeType: string, sizeBytes: number, contentBase64: string}} Fotografia para request externo.
 */
function buildProviderPhoto(kind, photo) {
    return {
        kind,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // Só o conteúdo temporário segue para o provider; storageKey e paths internos ficam na API.
        contentBase64: photo.imageBase64,
    };
}

/**
 * Constrói o payload externo com finalidade e retenção explícitas.
 *
 * @function buildExternalAnalysisPayload
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotografias preparadas.
 * @returns {{photos: object[], purpose: string, retention: string}} Payload remoto minimizado.
 */
function buildExternalAnalysisPayload(input) {
    const { frontalPhoto, perfilPhoto } = assertExternalAnalysisPayloadInput(input);

    return {
        photos: [
            buildProviderPhoto("frontal", frontalPhoto),
            buildProviderPhoto("perfil", perfilPhoto),
        ],
        purpose: "analise_facial_cosmetica",
        retention: "processamento_imediato_sem_treino_externo",
    };
}

/**
 * Valida transporte seguro antes de enviar imagem facial ou API key.
 *
 * @function assertSecureExternalProviderUrl
 * @param {string|undefined} value - Valor de `AI_PROVIDER_URL`.
 * @returns {string} URL seguro para chamada `fetch`.
 * @throws {AppError} Quando o URL é inválido ou usa HTTP externo.
 */
function assertSecureExternalProviderUrl(value) {
    let providerUrl;

    try {
        providerUrl = new URL(value);
    } catch {
        throw new AppError(503, "URL do provider de IA externo inválido");
    }

    const isLocalDevelopmentUrl =
        env.nodeEnv !== "production" &&
        providerUrl.protocol === "http:" &&
        LOCAL_PROVIDER_HOSTS.has(providerUrl.hostname);

    if (providerUrl.protocol !== "https:" && !isLocalDevelopmentUrl) {
        throw new AppError(503, "Provider de IA externo deve usar HTTPS");
    }

    return providerUrl.href;
}

/**
 * Normaliza um finding remoto sem permitir confiança extrema ou texto excessivo.
 *
 * @function normalizeFinding
 * @param {unknown} value - Finding devolvido pelo provider remoto.
 * @returns {{label: string, confidence: number, explanation: string}} Finding público.
 */
function normalizeFinding(value) {
    const confidence = Number(value?.confidence ?? 0);

    return {
        label: String(value?.label ?? "indeterminado").slice(0, 80),
        confidence: Math.min(0.95, Math.max(0.1, confidence)),
        explanation: String(
            value?.explanation ?? "Resultado cosmético sem detalhe adicional.",
        ).slice(0, 240),
    };
}

/**
 * Converte resposta remota no contrato público da Orélle.
 *
 * @function normalizeExternalResult
 * @param {unknown} data - JSON devolvido pelo provider remoto.
 * @returns {{providerName: string, findings: object, sources: string[], limitations: string[]}} Resultado normalizado.
 */
function normalizeExternalResult(data) {
    const findings = {};

    for (const key of ALLOWED_FINDINGS) {
        findings[key] = normalizeFinding(data?.findings?.[key]);
    }

    return {
        providerName: String(data?.providerName ?? "external-skin-provider").slice(
            0,
            80,
        ),
        findings,
        sources: [
            "fotografia_frontal",
            "fotografia_perfil",
            "provider_remoto_configurado",
        ],
        limitations: [
            "Análise cosmética assistida por provider configurado.",
            "Resultado não substitui avaliação profissional.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "As fotografias não são usadas para aprendizagem de terceiros.",
        ],
    };
}

/**
 * Chama o provider remoto de análise cosmética.
 *
 * @async
 * @function analyzeSkinPhotosExternally
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotografias já autorizadas e preparadas.
 * @returns {Promise<object>} Resultado normalizado para a API Orélle.
 * @throws {AppError} Quando configuração, transporte, timeout ou provider falham.
 */
export async function analyzeSkinPhotosExternally(input) {
    if (!env.aiProviderUrl || !env.aiProviderKey) {
        throw new AppError(503, "Provider de IA externo não configurado");
    }

    const providerUrl = assertSecureExternalProviderUrl(env.aiProviderUrl);
    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        EXTERNAL_PROVIDER_TIMEOUT_MS,
    );

    try {
        const response = await fetch(providerUrl, {
            method: "POST",
            headers: {
                // A API key autentica o servidor Orélle; nunca entra no body nem no frontend.
                Authorization: `Bearer ${env.aiProviderKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(buildExternalAnalysisPayload(input)),
            signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new AppError(502, "Provider de IA externo indisponível");
        }

        return normalizeExternalResult(data);
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }

        if (err?.name === "AbortError") {
            throw new AppError(
                504,
                "Provider de IA externo excedeu o tempo limite",
            );
        }

        throw new AppError(502, "Provider de IA externo indisponível");
    } finally {
        clearTimeout(timeout);
    }
}
