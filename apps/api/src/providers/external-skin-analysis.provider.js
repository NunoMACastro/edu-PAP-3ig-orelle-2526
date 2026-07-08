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
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ALLOWED_FINDINGS = ["skinType", "acne", "manchas", "rugas", "oleosidade"];
const LOCAL_PROVIDER_HOSTS = new Set(["localhost", "127.0.0.1"]);
const FINDING_JSON_SCHEMA = Object.freeze({
    type: "object",
    additionalProperties: false,
    properties: {
        label: {
            type: "string",
            description: "Etiqueta cosmetica curta e nao medica.",
        },
        confidence: {
            type: "number",
            description: "Confianca estimada entre 0 e 1.",
        },
        explanation: {
            type: "string",
            description: "Explicacao cosmetica curta, sem diagnostico clinico.",
        },
    },
    required: ["label", "confidence", "explanation"],
});
const OPENAI_ANALYSIS_JSON_SCHEMA = Object.freeze({
    type: "object",
    additionalProperties: false,
    properties: {
        providerName: {
            type: "string",
            description: "Nome curto do provider que gerou a analise.",
        },
        findings: {
            type: "object",
            additionalProperties: false,
            properties: Object.fromEntries(
                ALLOWED_FINDINGS.map((key) => [key, FINDING_JSON_SCHEMA]),
            ),
            required: ALLOWED_FINDINGS,
        },
        sources: {
            type: "array",
            description: "Fontes usadas, sem paths internos ou identificadores privados.",
            items: {
                type: "string",
            },
        },
        limitations: {
            type: "array",
            description: "Limitacoes cosmeticas e nao medicas do resultado.",
            items: {
                type: "string",
            },
        },
    },
    required: ["providerName", "findings", "sources", "limitations"],
});
const OPENAI_ANALYSIS_PROMPT = [
    "Analisa as duas fotografias apenas para avaliacao cosmetica de pele.",
    "Devolve exclusivamente JSON compativel com o schema.",
    "Nao faças diagnostico clinico, nao identifiques doencas e nao prometas resultados terapeuticos.",
    "Usa linguagem conservadora, curta e adequada a recomendacoes cosmeticas gerais.",
    "As imagens sao autorizadas apenas para processamento imediato desta analise e nao podem ser usadas para treino externo.",
    "Os findings obrigatorios sao skinType, acne, manchas, rugas e oleosidade.",
].join(" ");

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
 * Constrói conteúdo de imagem no formato aceite pela Responses API.
 *
 * @function buildOpenAiImageContent
 * @param {{mimeType: string, imageBase64: string}} photo - Fotografia preparada em memória.
 * @returns {{type: "input_image", image_url: string}} Conteúdo multimodal OpenAI.
 */
function buildOpenAiImageContent(photo) {
    return {
        type: "input_image",
        image_url: `data:${photo.mimeType};base64,${photo.imageBase64}`,
    };
}

/**
 * Constrói o pedido OpenAI com output estruturado no contrato da Orélle.
 *
 * @function buildOpenAiAnalysisPayload
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotografias preparadas.
 * @returns {object} Body para POST /v1/responses.
 */
export function buildOpenAiAnalysisPayload(input) {
    const { frontalPhoto, perfilPhoto } = assertExternalAnalysisPayloadInput(input);

    return {
        model: env.aiProviderModel,
        store: false,
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: OPENAI_ANALYSIS_PROMPT,
                    },
                    {
                        type: "input_text",
                        text: "Fotografia frontal autorizada para analise cosmetica.",
                    },
                    buildOpenAiImageContent(frontalPhoto),
                    {
                        type: "input_text",
                        text: "Fotografia de perfil autorizada para analise cosmetica.",
                    },
                    buildOpenAiImageContent(perfilPhoto),
                ],
            },
        ],
        text: {
            format: {
                type: "json_schema",
                name: "orelle_skin_analysis",
                strict: true,
                schema: OPENAI_ANALYSIS_JSON_SCHEMA,
            },
        },
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
 * Normaliza listas curtas vindas de providers sem expor texto excessivo.
 *
 * @function normalizeStringList
 * @param {unknown} value - Lista devolvida pelo provider.
 * @param {string[]} fallback - Lista segura usada quando o provider nao envia dados validos.
 * @param {number} maxItems - Numero maximo de itens.
 * @param {number} maxLength - Numero maximo de caracteres por item.
 * @returns {string[]} Lista segura.
 */
function normalizeStringList(value, fallback, maxItems, maxLength) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const items = value
        .map((item) => String(item ?? "").trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);

    return items.length > 0 ? items : fallback;
}

/**
 * Converte resposta remota no contrato público da Orélle.
 *
 * @function normalizeExternalResult
 * @param {unknown} data - JSON devolvido pelo provider remoto.
 * @returns {{providerName: string, findings: object, sources: string[], limitations: string[]}} Resultado normalizado.
 */
function normalizeExternalResult(data, options = {}) {
    const findings = {};
    const sources =
        options.sources ?? [
            "fotografia_frontal",
            "fotografia_perfil",
            "provider_remoto_configurado",
        ];
    const limitations =
        options.limitations ?? [
            "Análise cosmética assistida por provider configurado.",
            "Resultado não substitui avaliação profissional.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "As fotografias não são usadas para aprendizagem de terceiros.",
        ];

    for (const key of ALLOWED_FINDINGS) {
        findings[key] = normalizeFinding(data?.findings?.[key]);
    }

    return {
        providerName: String(
            data?.providerName ?? options.providerNameFallback ?? "external-skin-provider",
        ).slice(0, 80),
        findings,
        sources,
        limitations,
    };
}

/**
 * Extrai texto JSON de uma resposta raw da Responses API.
 *
 * @function extractOpenAiOutputText
 * @param {unknown} data - Resposta JSON da OpenAI.
 * @returns {string|undefined} Texto estruturado devolvido pelo modelo.
 */
function extractOpenAiOutputText(data) {
    if (typeof data?.output_text === "string" && data.output_text.trim()) {
        return data.output_text;
    }

    const outputItems = Array.isArray(data?.output) ? data.output : [];

    for (const item of outputItems) {
        const contentItems = Array.isArray(item?.content) ? item.content : [];
        const textItem = contentItems.find(
            (content) =>
                typeof content?.text === "string" &&
                (content.type === "output_text" || content.type === "text"),
        );

        if (textItem?.text?.trim()) {
            return textItem.text;
        }
    }

    return undefined;
}

/**
 * Converte a resposta OpenAI em JSON antes da normalização da Orélle.
 *
 * @function parseOpenAiResult
 * @param {unknown} data - Resposta JSON da OpenAI.
 * @returns {object} Resultado estruturado do modelo.
 * @throws {AppError} Quando a resposta nao contem JSON valido.
 */
function parseOpenAiResult(data) {
    if (data?.output_parsed && typeof data.output_parsed === "object") {
        return data.output_parsed;
    }

    if (data?.providerName && data?.findings) {
        return data;
    }

    const outputText = extractOpenAiOutputText(data);

    if (!outputText) {
        throw new AppError(502, "Resposta OpenAI sem output estruturado");
    }

    try {
        return JSON.parse(outputText);
    } catch {
        throw new AppError(502, "Resposta OpenAI com JSON inválido");
    }
}

/**
 * Normaliza a resposta OpenAI no contrato público da Orélle.
 *
 * @function normalizeOpenAiResult
 * @param {unknown} data - Resposta JSON da OpenAI.
 * @returns {{providerName: string, findings: object, sources: string[], limitations: string[]}} Resultado normalizado.
 */
function normalizeOpenAiResult(data) {
    const parsed = parseOpenAiResult(data);

    return normalizeExternalResult(parsed, {
        providerNameFallback: "openai-responses-skin-analysis",
        sources: normalizeStringList(
            parsed?.sources,
            ["fotografia_frontal", "fotografia_perfil", "openai_responses_api"],
            6,
            80,
        ),
        limitations: normalizeStringList(
            parsed?.limitations,
            [
                "Análise cosmética assistida por OpenAI.",
                "Resultado não substitui avaliação profissional.",
                "Sem diagnóstico clínico ou promessa terapêutica.",
                "As fotografias não são usadas para aprendizagem de terceiros.",
            ],
            6,
            160,
        ),
    });
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

/**
 * Chama diretamente a OpenAI Responses API para análise cosmética.
 *
 * @async
 * @function analyzeSkinPhotosWithOpenAi
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotografias já autorizadas e preparadas.
 * @returns {Promise<object>} Resultado normalizado para a API Orélle.
 * @throws {AppError} Quando configuração, transporte, timeout ou resposta falham.
 */
export async function analyzeSkinPhotosWithOpenAi(input) {
    if (!env.openAiApiKey) {
        throw new AppError(503, "OpenAI não configurada para análise facial");
    }

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        EXTERNAL_PROVIDER_TIMEOUT_MS,
    );

    try {
        const response = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.openAiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(buildOpenAiAnalysisPayload(input)),
            signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status >= 500) {
                throw new AppError(502, "OpenAI indisponível para análise facial");
            }

            throw new AppError(400, "Pedido OpenAI de análise facial inválido");
        }

        return normalizeOpenAiResult(data);
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }

        if (err?.name === "AbortError") {
            throw new AppError(
                504,
                "OpenAI excedeu o tempo limite de análise facial",
            );
        }

        throw new AppError(502, "OpenAI indisponível para análise facial");
    } finally {
        clearTimeout(timeout);
    }
}
