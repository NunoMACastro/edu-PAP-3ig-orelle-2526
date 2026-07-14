/**
 * Provider estrito de edição cosmética única com GPT Image.
 *
 * O prompt é composto apenas por frases e enums controlados. O provider fixa
 * PNG, qualidade alta configurável por allowlist e dimensões proporcionais em
 * múltiplos de 16, preservando diferenças subtis sem compressão lossy.
 */
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import { readBoundedResponseText } from "../utils/bounded-response.util.js";

export const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";
export const MAX_IMAGE_RESPONSE_JSON_BYTES = 44 * 1024 * 1024;
export const MAX_DECODED_IMAGE_BYTES = 32 * 1024 * 1024;
export const COSMETIC_IMAGE_PROMPT_VERSION = "cosmetic-image-edit-v5";
export const COSMETIC_IMAGE_SCHEMA_VERSION = "cosmetic-image-contract-v3";

const TARGET_PIXELS = 1024 * 1536;
const MIN_EDGE = 512;
const MAX_EDGE = 1536;
const MAX_PIXELS = 16_000_000;
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_HTTP_ATTEMPTS = 2;
const MIN_RETRY_ATTEMPT_WINDOW_MS = 120_000;
const DEFAULT_RETRY_DELAY_MS = 250;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_COLOR = /^#[0-9A-F]{6}$/u;
const SAFE_OPERATION_ID = /^[a-f0-9]{24}$/iu;
const ALLOWED_FINISHES = new Set(["natural", "matte", "luminous", "satin", "dewy", "other"]);
const ALLOWED_COVERAGES = new Set(["none", "sheer", "light", "medium", "full"]);
const ALLOWED_ROLES = new Set(["complexion", "cheeks", "eyes", "brows", "lips"]);
const ALLOWED_MAKEUP_FUNCTIONS = new Set([
    "primer", "skin_tint", "foundation", "color_corrector", "concealer",
    "setting_powder", "blush", "bronzer", "contour", "highlighter",
    "eyeshadow", "eyeliner", "mascara", "brow_product", "lip_liner",
    "lipstick", "lip_gloss", "setting_spray",
]);
const ALLOWED_APPLICATION_AREAS = new Set([
    "full_complexion", "under_eyes", "blemishes", "t_zone", "cheek_apples",
    "cheekbones", "jawline", "temples", "eyelids", "lash_line", "lashes",
    "brows", "lip_contour", "lips",
]);

const EFFECT_INSTRUCTIONS = Object.freeze({
    reduce_visible_superficial_imperfections:
        "Reduce only visible superficial blemishes, blackheads and recent marks in the authorised areas; retain permanent marks and real texture.",
    reduce_visible_dryness_and_flaking:
        "Reduce visible dryness and flaking in the authorised areas without blur or plastic skin.",
    reduce_excess_specular_shine:
        "Reduce only excessive specular highlights in the authorised areas; preserve pores, microtexture and natural highlights.",
    reduce_visible_diffuse_redness:
        "Reduce only diffuse redness that is already visible; do not change global skin tone.",
    reduce_visible_spot_contrast:
        "Reduce the local contrast of visible spots without erasing freckles, moles or identifying scars.",
    reduce_recent_mark_contrast:
        "Reduce the local contrast of visible recent imperfection marks while preserving permanent identifying marks.",
    improve_local_luminosity_without_exposure_change:
        "Improve local luminosity subtly without changing exposure, white balance or global contrast.",
    improve_local_tone_uniformity:
        "Improve only local visible tone uniformity without changing global skin tone.",
    add_subtle_hydrated_finish:
        "Add a subtle hydrated surface finish while preserving realistic microtexture.",
    apply_sheer_tinted_complexion_coverage:
        "Apply very sheer tinted complexion coverage using only the confirmed variant reference.",
    apply_confirmed_catalog_makeup:
        "Apply makeup only in regions backed by confirmed catalogue variants, using their exact colour, finish and coverage references.",
});

const INTENSITY_INSTRUCTIONS = Object.freeze({
    subtle: "Use a light but clearly observable effect at 100% zoom.",
    balanced: "Use a moderate, realistic and clearly observable effect.",
    marked: "Use a pronounced effect while retaining identity and all real skin microtexture.",
});

function roundDown16(value) {
    return Math.max(16, Math.floor(value / 16) * 16);
}

/** Calcula dimensões proporcionais válidas para `gpt-image-2`. */
export function calculateCosmeticOutputSize(width, height) {
    const sourceWidth = Number(width);
    const sourceHeight = Number(height);
    if (
        !Number.isFinite(sourceWidth) ||
        !Number.isFinite(sourceHeight) ||
        sourceWidth < 1 ||
        sourceHeight < 1
    ) {
        throw new AppError(422, "Dimensões da fotografia frontal inválidas");
    }
    const ratio = sourceWidth / sourceHeight;
    if (ratio < 1 / 3 || ratio > 3) {
        throw new AppError(
            422,
            "O rácio da fotografia não é compatível com a pré-visualização",
        );
    }

    let targetWidth = Math.sqrt(TARGET_PIXELS * ratio);
    let targetHeight = targetWidth / ratio;
    const maximum = Math.max(targetWidth, targetHeight);
    if (maximum > MAX_EDGE) {
        const scale = MAX_EDGE / maximum;
        targetWidth *= scale;
        targetHeight *= scale;
    }
    const minimum = Math.min(targetWidth, targetHeight);
    if (minimum < MIN_EDGE) {
        const scale = MIN_EDGE / minimum;
        targetWidth *= scale;
        targetHeight *= scale;
    }

    const finalWidth = roundDown16(Math.min(MAX_EDGE, targetWidth));
    const finalHeight = roundDown16(Math.min(MAX_EDGE, targetHeight));
    return {
        width: finalWidth,
        height: finalHeight,
        size: `${finalWidth}x${finalHeight}`,
    };
}

function safeCatalogLabel(value) {
    const label = String(value ?? "")
        .normalize("NFKC")
        .replace(/[\u0000-\u001F\u007F<>"'`\\]/gu, " ")
        .replace(/\s+/gu, " ")
        .trim()
        .slice(0, 100);
    if (
        /\b(?:ignore|ignora|instruction|instru[cç][aã]o|prompt|system|assistant|regra|altera(?:r)?\s+(?:o\s+)?rosto)\b/iu.test(
            label,
        )
    ) {
        return "";
    }
    return label;
}

function controlledProductReferences(recommendations = [], visualizationSpec = {}) {
    const byRecommendationId = new Map(
        recommendations.map((recommendation) => [
            String(recommendation?.recommendationId ?? ""),
            recommendation,
        ]),
    );
    const layers = Array.isArray(visualizationSpec?.makeup?.layers)
        ? visualizationSpec.makeup.layers
        : [];
    if (layers.length > 0) {
        return layers.flatMap((layer) => {
            const recommendation = byRecommendationId.get(
                String(layer?.recommendationId ?? ""),
            );
            const makeupFunction = String(layer?.function ?? "");
            if (!recommendation || !ALLOWED_MAKEUP_FUNCTIONS.has(makeupFunction)) {
                return [];
            }
            const roles = (layer.regions ?? []).filter((role) => ALLOWED_ROLES.has(role));
            if (roles.length === 0) return [];
            const applicationAreas = (
                layer.applicationAreas ?? recommendation.applicationAreas ?? []
            ).filter((area) => ALLOWED_APPLICATION_AREAS.has(area));
            const productName = safeCatalogLabel(recommendation.productName) || "catalogue product";
            const variantId = SAFE_SLUG.test(recommendation.variantId ?? "")
                ? recommendation.variantId
                : "not-applicable";
            const variantLabel = safeCatalogLabel(recommendation.variantLabel) || "not-specified";
            const colorHex = SAFE_COLOR.test(recommendation.colorHex ?? "")
                ? recommendation.colorHex
                : "not-specified";
            const finish = ALLOWED_FINISHES.has(recommendation.finish)
                ? recommendation.finish
                : "not-specified";
            const coverage = ALLOWED_COVERAGES.has(recommendation.coverage)
                ? recommendation.coverage
                : "not-specified";
            return [
                `order=${Number.isInteger(layer.order) ? layer.order : 999}; product=${productName}; function=${makeupFunction}; regions=${roles.join(",")}; application=${applicationAreas.join(",") || "region-appropriate"}; variant=${variantId}; variant-label=${variantLabel}; colour=${colorHex}; finish=${finish}; coverage=${coverage}`,
            ];
        });
    }
    return recommendations.flatMap((recommendation) => {
        const variantId = String(recommendation?.variantId ?? "");
        if (!SAFE_SLUG.test(variantId)) return [];
        const roles = (recommendation.visualRoles ?? []).filter((role) =>
            ALLOWED_ROLES.has(role),
        );
        if (roles.length === 0) return [];
        const colorHex = SAFE_COLOR.test(recommendation.colorHex ?? "")
            ? recommendation.colorHex
            : "not-specified";
        const finish = ALLOWED_FINISHES.has(recommendation.finish)
            ? recommendation.finish
            : "not-specified";
        const coverage = ALLOWED_COVERAGES.has(recommendation.coverage)
            ? recommendation.coverage
            : "not-specified";
        return [
            `regions=${roles.join(",")}; variant=${variantId}; colour=${colorHex}; finish=${finish}; coverage=${coverage}`,
        ];
    });
}

/** Constrói o prompt v5 em blocos estáveis e auditáveis. */
export function buildControlledCosmeticPrompt(
    visualizationSpec,
    recommendationSnapshot,
    intensity,
) {
    const objectives = visualizationSpec?.objectives ?? [];
    const effects = objectives
        .map((objective) => {
            const instruction = EFFECT_INSTRUCTIONS[objective.effect];
            const regions = (objective.regions ?? [])
                .map(String)
                .filter((region) => /^[a-z_]+$/u.test(region));
            const priority =
                objective.priority === "primary" ? "PRIMARY" : "SECONDARY";
            return instruction
                ? `- ${priority}: ${instruction} Authorised regions: ${regions.join(", ") || "visible areas only"}.`
                : null;
        })
        .filter(Boolean);
    const references = controlledProductReferences(
        recommendationSnapshot,
        visualizationSpec,
    );
    const intensityInstruction =
        INTENSITY_INSTRUCTIONS[intensity] ?? INTENSITY_INSTRUCTIONS.balanced;
    const makeupIsPrimary = objectives.some(
        ({ code, priority }) => code === "makeup" && priority === "primary",
    );
    const primaryInstruction = makeupIsPrimary
        ? "Makeup is the primary visible outcome. Complete every authorised makeup region and keep all skin effects secondary to it."
        : "Respect the declared PRIMARY effect as the dominant visible outcome.";
    const makeupInstruction = references.length > 0
        ? "Apply every listed makeup layer exactly once, in ascending order, using the stated product function and application area. Product coverage controls makeup intensity; non-makeup skin effects must never weaken, hide or replace the final makeup layers."
        : "Do not invent makeup without a confirmed catalogue reference.";
    const style = [
        "natural_everyday", "soft_classic", "soft_glam", "gala_evening",
        "modern_editorial", "no_preference",
    ].includes(visualizationSpec?.makeup?.style)
        ? visualizationSpec.makeup.style
        : "no_preference";
    const context = ["daily", "work_school", "event", "photography"].includes(
        visualizationSpec?.makeup?.context,
    )
        ? visualizationSpec.makeup.context
        : "not-specified";
    const colourDirection = [
        "neutral_palette", "warm_palette", "cool_palette", "rose_mauve", "bold",
        "no_preference",
    ].includes(visualizationSpec?.makeup?.colourDirection)
        ? visualizationSpec.makeup.colourDirection
        : "no_preference";

    return [
        "TASK\nCreate one realistic cosmetic edit of the supplied authorised frontal photograph.",
        "SOURCE IMAGE\nUse the source as the immutable reference for identity, geometry, crop, camera, background and illumination.",
        `VISUAL INTENT\n${primaryInstruction} ${intensityInstruction} This intensity applies only to non-makeup skin effects. Combine effects in this order: local corrections, surface finish, then makeup.`,
        `OBJECTIVE EFFECTS\n${effects.join("\n") || "No unsupported effect."}`,
        `PRODUCT AND VARIANT REFERENCES\n${references.join("\n") || "No catalogue colour reference is authorised."}`,
        `MAKEUP EXECUTION\nStyle=${style}; context=${context}; colour-direction=${colourDirection}. ${makeupInstruction} Foundation or skin tint sets complexion coverage; concealer remains local; contour and bronzer shape only through colour placement and never through geometry; eyeliner, lip liner and brow products must create their product-specific definition; setting products do not add unrelated colour.`,
        "CHANGE ONLY\nChange only already-visible cosmetic signals inside authorised regions. Do not invent defects. Keep secondary skin corrections restrained when makeup is primary.",
        "PRESERVE EXACTLY\nPreserve identity, face structure, permanent identifying marks, hair, background, lighting, white balance, exposure, global contrast, framing and aspect ratio. Preserve existing pores and skin microtexture without sharpening or enhancing them.",
        "FORBIDDEN CHANGES\nNo face reshaping, age change, skin blur, plastic skin, added or exaggerated pores, wrinkles, dryness, clarity, sharpening, local contrast or shadows; no global relighting, global recolouring, accessories, hairstyle changes, background edits, crop changes or removal of freckles, moles and permanent scars.",
        "OUTPUT REQUIREMENTS\nReturn one photorealistic image with the requested dimensions and the exact same composition as the source.",
    ].join("\n\n");
}

function parseRetryAfterMs(value) {
    if (value === null || value === undefined || value === "") return null;
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(30_000, Math.ceil(seconds * 1000));
    }
    const dateMs = Date.parse(String(value ?? ""));
    return Number.isFinite(dateMs)
        ? Math.min(30_000, Math.max(0, dateMs - Date.now()))
        : null;
}

function timeoutError() {
    const error = new Error("OpenAI image edit timed out");
    error.name = "TimeoutError";
    error.transient = true;
    error.code = "OPENAI_IMAGE_TIMEOUT";
    error.retryAfterMs = 0;
    return error;
}

async function readImageResponse(response, expectedSize) {
    const text = await readBoundedResponseText(
        response,
        MAX_IMAGE_RESPONSE_JSON_BYTES,
        () => new AppError(502, "Resposta de imagem OpenAI demasiado grande"),
    );
    let payload;
    try {
        payload = JSON.parse(text);
    } catch {
        throw new AppError(502, "Resposta de imagem OpenAI inválida");
    }
    const base64 = payload?.data?.[0]?.b64_json;
    if (
        typeof base64 !== "string" ||
        !/^[A-Za-z0-9+/]+={0,2}$/u.test(base64) ||
        base64.length % 4 !== 0
    ) {
        throw new AppError(502, "Resposta OpenAI sem imagem editada válida");
    }
    const imageBuffer = Buffer.from(base64, "base64");
    if (imageBuffer.length < 1 || imageBuffer.length > MAX_DECODED_IMAGE_BYTES) {
        throw new AppError(502, "Imagem OpenAI excede o limite permitido");
    }
    let metadata;
    try {
        metadata = await sharp(imageBuffer, {
            failOn: "warning",
            limitInputPixels: MAX_PIXELS,
            animated: false,
        }).metadata();
    } catch {
        throw new AppError(502, "Imagem OpenAI inválida");
    }
    if (
        metadata.format !== "png" ||
        Number(metadata.pages ?? 1) !== 1 ||
        metadata.width !== expectedSize.width ||
        metadata.height !== expectedSize.height
    ) {
        throw new AppError(502, "Dimensões ou formato da imagem OpenAI inesperados");
    }
    return { payload, imageBuffer, metadata };
}

function supportsConfigurableInputFidelity(model) {
    return !/^gpt-image-2(?:$|-)/u.test(String(model));
}

/**
 * Escreve um evento operacional com uma allowlist rígida de campos.
 *
 * O evento nunca contém prompt, fotografia, referências de produto, headers de
 * autenticação ou mensagens livres do provider. Falhas do próprio logger não
 * podem interromper a geração.
 */
function writeImageProviderEvent(
    logger,
    level,
    {
        event,
        operationId,
        attempt,
        model,
        requestedSize,
        quality,
        timeoutMs,
        durationMs,
        statusCode,
        requestId,
        errorCode,
        retryable,
        willRetry,
    },
    nodeEnv,
) {
    if (nodeEnv === "test" && logger === console) return;
    const entry = {
        event,
        ...(SAFE_OPERATION_ID.test(String(operationId ?? ""))
            ? { operationId: String(operationId) }
            : {}),
        ...(Number.isInteger(attempt) ? { attempt } : {}),
        ...(typeof model === "string" ? { model: model.slice(0, 120) } : {}),
        ...(typeof requestedSize === "string" ? { requestedSize } : {}),
        ...(typeof quality === "string" ? { quality } : {}),
        ...(Number.isInteger(timeoutMs) ? { timeoutMs } : {}),
        ...(Number.isInteger(durationMs) ? { durationMs } : {}),
        ...(Number.isInteger(statusCode) ? { statusCode } : {}),
        ...(typeof requestId === "string" && requestId
            ? { requestId: requestId.slice(0, 160) }
            : {}),
        ...(typeof errorCode === "string"
            ? { errorCode: errorCode.slice(0, 80) }
            : {}),
        ...(typeof retryable === "boolean" ? { retryable } : {}),
        ...(typeof willRetry === "boolean" ? { willRetry } : {}),
    };
    try {
        logger?.[level]?.(JSON.stringify(entry));
    } catch {
        // Observabilidade nunca altera o resultado funcional do provider.
    }
}

/**
 * Executa a edição dentro de um único deadline útil.
 *
 * Um timeout nunca é repetido automaticamente: uma segunda geração longa
 * duplicaria latência e carga sem evidência de que a primeira falhou cedo. Só
 * respostas HTTP transitórias e recebidas com pelo menos dois minutos ainda
 * disponíveis podem originar uma segunda tentativa curta e controlada.
 */
export async function editCosmeticPhotoWithOpenAi(
    {
        sourceImage,
        sourceMimeType,
        visualizationSpec,
        recommendations,
        intensity = "balanced",
        operationId = null,
        signal,
    },
    {
        config = env,
        fetchImpl = globalThis.fetch,
        sleep = delay,
        logger = console,
    } = {},
) {
    if (signal?.aborted) throw signal.reason;
    const sourceMetadata = await sharp(sourceImage, {
        failOn: "warning",
        limitInputPixels: MAX_PIXELS,
        animated: false,
    }).metadata();
    if (
        !["png", "webp", "jpeg"].includes(sourceMetadata.format) ||
        Number(sourceMetadata.pages ?? 1) !== 1 ||
        !sourceMetadata.width ||
        !sourceMetadata.height ||
        sourceMetadata.width * sourceMetadata.height > MAX_PIXELS
    ) {
        throw new AppError(422, "Fotografia frontal inválida para edição");
    }
    const requestedSize = calculateCosmeticOutputSize(
        sourceMetadata.width,
        sourceMetadata.height,
    );
    const contract = {
        promptVersion:
            config.openAiImagePromptVersion || COSMETIC_IMAGE_PROMPT_VERSION,
        schemaVersion:
            config.openAiImageSchemaVersion || COSMETIC_IMAGE_SCHEMA_VERSION,
    };

    if (config.openAiTestFixtureMode === true) {
        if (config.nodeEnv !== "test") {
            throw new Error("Fixture de imagem OpenAI proibido fora de teste");
        }
        const imageBuffer = await sharp(sourceImage)
            .rotate()
            .resize(requestedSize.width, requestedSize.height, { fit: "fill" })
            .png({ compressionLevel: 9 })
            .toBuffer();
        return {
            imageBuffer,
            provenance: {
                provider: "openai",
                requestedModel: config.openAiImageModel,
                effectiveModel: config.openAiImageModel,
                requestId: "test-openai-image-request",
                requestedSize: requestedSize.size,
                outputWidth: requestedSize.width,
                outputHeight: requestedSize.height,
                quality: config.openAiImageQuality ?? "high",
                format: "png",
                ...contract,
            },
        };
    }
    if (fetchImpl !== globalThis.fetch && config.nodeEnv !== "test") {
        throw new Error("Transport de imagem injetado apenas em teste");
    }
    if (!config.openAiApiKey || !config.openAiImageModel) {
        throw new AppError(503, "Edição OpenAI não configurada", {
            code: "AI_NOT_CONFIGURED",
            retryable: false,
        });
    }

    const deadlineAt = Date.now() + config.openAiImageTimeoutMs;
    let lastError;
    for (let attempt = 0; attempt < MAX_HTTP_ATTEMPTS; attempt += 1) {
        let timeoutSignal;
        let requestStartedAt = null;
        try {
            const remainingMs = deadlineAt - Date.now();
            if (remainingMs <= 0) throw timeoutError();
            timeoutSignal = AbortSignal.timeout(Math.max(1, remainingMs));
            const requestSignal = signal
                ? AbortSignal.any([signal, timeoutSignal])
                : timeoutSignal;
            const form = new FormData();
            form.append("model", config.openAiImageModel);
            form.append(
                "image[]",
                new Blob([sourceImage], { type: sourceMimeType }),
                `frontal.${sourceMimeType === "image/png" ? "png" : "webp"}`,
            );
            form.append(
                "prompt",
                buildControlledCosmeticPrompt(
                    visualizationSpec,
                    recommendations,
                    intensity,
                ),
            );
            if (supportsConfigurableInputFidelity(config.openAiImageModel)) {
                form.append("input_fidelity", "high");
            }
            form.append("quality", config.openAiImageQuality ?? "high");
            form.append("output_format", "png");
            form.append("size", requestedSize.size);

            requestStartedAt = Date.now();
            writeImageProviderEvent(
                logger,
                "log",
                {
                    event: "openai_image_edit_request_started",
                    operationId,
                    attempt: attempt + 1,
                    model: config.openAiImageModel,
                    requestedSize: requestedSize.size,
                    quality: config.openAiImageQuality ?? "high",
                    timeoutMs: Math.max(1, remainingMs),
                },
                config.nodeEnv,
            );
            const response = await fetchImpl(OPENAI_IMAGE_EDIT_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${config.openAiApiKey}` },
                body: form,
                signal: requestSignal,
            });
            const providerRequestId =
                response.headers?.get?.("x-request-id") ?? null;
            writeImageProviderEvent(
                logger,
                "log",
                {
                    event: "openai_image_edit_response_received",
                    operationId,
                    attempt: attempt + 1,
                    durationMs: Math.max(0, Date.now() - requestStartedAt),
                    statusCode: response.status,
                    requestId: providerRequestId,
                },
                config.nodeEnv,
            );
            if (!response.ok) {
                const error = new Error("OpenAI image edit failed");
                error.transient = TRANSIENT_STATUS.has(response.status);
                error.code = `OPENAI_IMAGE_HTTP_${response.status}`;
                error.statusCode = response.status;
                error.requestId = providerRequestId;
                error.retryAfterMs = parseRetryAfterMs(
                    response.headers?.get?.("retry-after"),
                );
                throw error;
            }
            const { payload, imageBuffer, metadata } = await readImageResponse(
                response,
                requestedSize,
            );
            return {
                imageBuffer,
                provenance: {
                    provider: "openai",
                    requestedModel: config.openAiImageModel,
                    effectiveModel: payload.model ?? config.openAiImageModel,
                    requestId:
                        providerRequestId ?? payload.id ?? null,
                    requestedSize: requestedSize.size,
                    outputWidth: metadata.width,
                    outputHeight: metadata.height,
                    quality: config.openAiImageQuality ?? "high",
                    format: "png",
                    ...contract,
                },
            };
        } catch (caught) {
            if (signal?.aborted) throw caught;
            const requestTimedOut = timeoutSignal?.aborted === true;
            lastError = requestTimedOut ? timeoutError() : caught;
            const retryDelayMs = Math.min(
                Number.isFinite(lastError.retryAfterMs)
                    ? lastError.retryAfterMs
                    : DEFAULT_RETRY_DELAY_MS,
                Math.max(0, deadlineAt - Date.now()),
            );
            const remainingAfterDelayMs =
                deadlineAt - Date.now() - retryDelayMs;
            const willRetry =
                !requestTimedOut &&
                lastError?.transient === true &&
                attempt < MAX_HTTP_ATTEMPTS - 1 &&
                remainingAfterDelayMs >= MIN_RETRY_ATTEMPT_WINDOW_MS;
            writeImageProviderEvent(
                logger,
                "error",
                {
                    event: "openai_image_edit_request_failed",
                    operationId,
                    attempt: attempt + 1,
                    durationMs:
                        requestStartedAt === null
                            ? 0
                            : Math.max(0, Date.now() - requestStartedAt),
                    statusCode: lastError?.statusCode,
                    requestId: lastError?.requestId,
                    errorCode: lastError?.code ?? "OPENAI_IMAGE_UNAVAILABLE",
                    retryable: Boolean(lastError?.transient),
                    willRetry,
                },
                config.nodeEnv,
            );
            if (!willRetry) break;
            if (retryDelayMs > 0) {
                await sleep(
                    retryDelayMs,
                    undefined,
                    signal ? { signal } : undefined,
                );
            }
        }
    }
    if (lastError instanceof AppError && !lastError?.details?.retryable) {
        throw lastError;
    }
    throw new AppError(503, "Não foi possível gerar a pré-visualização OpenAI", {
        code: lastError?.code ?? "OPENAI_IMAGE_UNAVAILABLE",
        retryable: Boolean(lastError?.transient),
    });
}
