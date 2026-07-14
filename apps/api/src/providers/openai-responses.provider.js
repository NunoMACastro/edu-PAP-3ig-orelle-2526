/**
 * Cliente OpenAI Responses API para a consulta cosmética.
 *
 * O provider é deliberadamente estreito: endpoint fixo, `store:false`, JSON
 * Schema estrito, payload limitado e retry conhecido. Não existe provider
 * alternativo nem resultado sintético. Um transporte injetado só é aceite em
 * `NODE_ENV=test`, para que mocks nunca sejam promovidos para runtime.
 */
import { setTimeout as delay } from "node:timers/promises";
import { env } from "../config/env.js";
import { FACE_IMAGE_PURPOSE_POLICY } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { readBoundedResponseText } from "../utils/bounded-response.util.js";
import { assertMatchesStrictJsonSchema } from "../utils/strict-json-schema.util.js";

export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const OPENAI_MAX_RESPONSE_BYTES = 1_000_000;

const TRANSIENT_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

const findingSchema = Object.freeze({
    type: "object",
    additionalProperties: false,
    required: ["label", "confidence", "explanation"],
    properties: {
        label: { type: "string", minLength: 1, maxLength: 80 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        explanation: { type: "string", minLength: 1, maxLength: 500 },
    },
});

const objectiveAssessmentSchema = Object.freeze({
    type: "object",
    additionalProperties: false,
    required: [
        "goalCode",
        "summary",
        "confidence",
        "observations",
        "cautions",
    ],
    properties: {
        goalCode: {
            type: "string",
            enum: [
                "acne_imperfections",
                "hydration_barrier",
                "oil_control",
                "sensitivity_redness",
                "spots_tone_luminosity",
                "sun_protection",
                "makeup",
            ],
        },
        summary: { type: "string", minLength: 1, maxLength: 600 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        observations: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: { type: "string", minLength: 1, maxLength: 300 },
        },
        cautions: {
            type: "array",
            maxItems: 6,
            items: { type: "string", minLength: 1, maxLength: 300 },
        },
    },
});

export const OPENAI_SKIN_ANALYSIS_SCHEMA = Object.freeze({
    type: "object",
    additionalProperties: false,
    required: ["photoQuality", "findings", "sources", "limitations", "safetyFlags"],
    properties: {
        photoQuality: {
            type: "object",
            additionalProperties: false,
            required: ["status", "reasons", "warnings"],
            properties: {
                status: { type: "string", enum: ["pass", "warning", "inconclusive"] },
                reasons: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
                warnings: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
            },
        },
        findings: {
            anyOf: [
                {
                    type: "object",
                    additionalProperties: false,
                    required: [
                        "skinType",
                        "acne",
                        "manchas",
                        "rugas",
                        "oleosidade",
                        "objectiveAssessments",
                    ],
                    properties: {
                        skinType: findingSchema,
                        acne: findingSchema,
                        manchas: findingSchema,
                        rugas: findingSchema,
                        oleosidade: findingSchema,
                        objectiveAssessments: {
                            type: "array",
                            minItems: 1,
                            maxItems: 3,
                            items: objectiveAssessmentSchema,
                        },
                    },
                },
                { type: "null" },
            ],
        },
        sources: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: { type: "string", enum: ["fotografia_frontal", "fotografia_perfil"] },
        },
        limitations: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", maxLength: 400 } },
        safetyFlags: { type: "array", maxItems: 8, items: { type: "string", maxLength: 200 } },
    },
});

/**
 * Schema legacy mantido apenas para testar o transporte estruturado. O fluxo
 * de consulta já não o envia à OpenAI.
 */
export const OPENAI_NEXT_QUESTION_SCHEMA = Object.freeze({
    type: "object",
    additionalProperties: false,
    required: ["status", "slotCode", "type", "label", "options", "min", "max", "maxLength"],
    properties: {
        status: { type: "string", enum: ["question", "complete"] },
        slotCode: { type: ["string", "null"], maxLength: 80 },
        type: { type: ["string", "null"], enum: ["single_select", "multi_select", "scale", "number", "short_text", null] },
        label: { type: ["string", "null"], maxLength: 300 },
        options: { type: "array", maxItems: 20, items: { type: "string", maxLength: 80 } },
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
        maxLength: { type: ["integer", "null"], minimum: 1, maximum: 1000 },
    },
});

/** Erro interno com classificação necessária ao retry, sem corpo remoto. */
export class OpenAiProviderError extends Error {
    constructor(message, { transient = false, statusCode = 502, code = "OPENAI_ERROR", retryAfterMs = 0 } = {}) {
        super(message);
        this.name = "OpenAiProviderError";
        this.transient = transient;
        this.statusCode = statusCode;
        this.code = code;
        this.retryAfterMs = retryAfterMs;
    }
}

/** Disponibilidade pública, sem expor chaves ou detalhes de conta. */
export function getOpenAiCapabilities(config = env) {
    const sensitiveStorageAvailable =
        config.nodeEnv === "test" ||
        String(config.dataEncryptionKey ?? "").trim().length >= 32;
    const available = Boolean(
        (config.openAiApiKey ||
            (config.nodeEnv === "test" && config.openAiTestFixtureMode === true)) &&
        config.openAiAnalysisModel &&
        config.openAiFallbackModel &&
        config.openAiNoticeVersion &&
        sensitiveStorageAvailable,
    );

    return {
        provider: "openai",
        available,
        degraded: !available,
        reason: available
            ? null
            : !sensitiveStorageAvailable
              ? "AI_STORAGE_NOT_CONFIGURED"
              : "AI_NOT_CONFIGURED",
        noticeVersion: config.openAiNoticeVersion,
        promptVersion: config.openAiPromptVersion,
        schemaVersion: config.openAiSchemaVersion,
        limits: {
            openConsultations: 1,
            consultationsPer24Hours: 3,
            logicalOperationsPerConsultation: 12,
            makeupPreviewsPer24Hours: 3,
        },
    };
}

/**
 * Transport determinístico exclusivo do E2E local. Não é selecionável fora
 * de `NODE_ENV=test` e não constitui um modo funcional persistido.
 */
export function createOpenAiTestTransportForTests(config = env) {
    if (config.nodeEnv !== "test" || config.openAiTestFixtureMode !== true) {
        throw new Error("Transport OpenAI de teste indisponível fora do E2E isolado");
    }
    return async function openAiTestTransport(url, options) {
        if (url !== OPENAI_RESPONSES_URL) throw new Error("Endpoint OpenAI inesperado");
        const request = JSON.parse(options.body);
        const schemaName = request.text?.format?.name;
        const userText = request.input?.[1]?.content?.find(
            (item) => item.type === "input_text",
        )?.text;
        const userInput = userText ? JSON.parse(userText) : {};
        let value;
        if (schemaName === "orelle_skin_analysis_v2") {
            const finding = (label, confidence) => ({
                label,
                confidence,
                explanation: "Observação cosmética estruturada do transport isolado de teste.",
            });
            value = {
                photoQuality: { status: "pass", reasons: [], warnings: [] },
                findings: {
                    skinType: finding("mista", 0.8),
                    acne: finding("ligeiro", 0.6),
                    manchas: finding("ligeiro", 0.55),
                    rugas: finding("baixo", 0.5),
                    oleosidade: finding("moderada", 0.7),
                    objectiveAssessments: (userInput.objectives ?? []).map(
                        (goalCode) => ({
                            goalCode,
                            summary:
                                "Avaliação cosmética estruturada para o objetivo selecionado.",
                            confidence: 0.72,
                            observations: [
                                "Observação visual limitada às fotografias autorizadas.",
                            ],
                            cautions: [
                                "Não constitui diagnóstico médico.",
                            ],
                        }),
                    ),
                },
                sources: ["fotografia_frontal", "fotografia_perfil"],
                limitations: ["Resultado cosmético de E2E, não médico."],
                safetyFlags: [],
            };
        } else if (schemaName === "orelle_cosmetic_report_v6") {
            const allowedRoutineSlots = Array.isArray(userInput.allowedRoutineSlots)
                ? userInput.allowedRoutineSlots
                : [];
            value = {
                observations: [
                    "Observações cosméticas estruturadas a partir da análise autorizada.",
                ],
                answerSummary:
                    "Resumo determinístico das respostas da consulta isolada de teste.",
                assessment:
                    "Avaliação cosmética educativa, sem finalidade clínica ou diagnóstico.",
                routine: [
                    ...allowedRoutineSlots.map(({ code }, index) => ({
                        routineSlotCode: code,
                        period: "manha",
                        priority: "essential",
                        title: `Rotina de teste ${index + 1}`,
                        reason: "Passo coerente com o objetivo escolhido.",
                        instructions: "Aplicar segundo a indicação cosmética do produto.",
                        cautions: ["Interromper em caso de desconforto."],
                    })),
                ],
                limitations: ["Resultado cosmético de E2E, não médico."],
            };
        } else {
            throw new Error(`Schema de teste sem fixture: ${schemaName}`);
        }
        return {
            ok: true,
            status: 200,
            headers: { get: (name) => (name.toLowerCase() === "x-request-id" ? "test-openai-request" : null) },
            text: async () => JSON.stringify({
                id: "resp_test_openai",
                model: request.model,
                output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }],
            }),
        };
    };
}

/** Falha fechada apenas no momento em que uma operação OpenAI é pedida. */
export function assertOpenAiAvailable(config = env) {
    const capabilities = getOpenAiCapabilities(config);
    if (!capabilities.available) {
        throw new AppError(
            503,
            capabilities.reason === "AI_STORAGE_NOT_CONFIGURED"
                ? "A cifra dos dados da consulta não está configurada neste momento."
                : "A consulta por IA não está configurada neste momento.",
            { code: capabilities.reason, retryable: false },
        );
    }
    return capabilities;
}

function parseRetryAfterMs(value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(30_000, Math.ceil(seconds * 1000));
    }
    const dateMs = Date.parse(String(value ?? ""));
    return Number.isFinite(dateMs)
        ? Math.min(30_000, Math.max(0, dateMs - Date.now()))
        : 0;
}

function extractOutputText(payload) {
    if (typeof payload?.output_text === "string") return payload.output_text;
    for (const output of payload?.output ?? []) {
        for (const content of output?.content ?? []) {
            if (content?.type === "output_text" && typeof content.text === "string") {
                return content.text;
            }
        }
    }
    throw new OpenAiProviderError("Resposta OpenAI sem output estruturado", {
        code: "OPENAI_INVALID_RESPONSE",
        transient: true,
    });
}

function normalizeStructuredPayload(payload, schema) {
    try {
        const value = JSON.parse(extractOutputText(payload));
        assertMatchesStrictJsonSchema(value, schema);
        return value;
    } catch (error) {
        if (error instanceof OpenAiProviderError) throw error;
        throw new OpenAiProviderError("Resposta OpenAI com JSON inválido", {
            code: "OPENAI_INVALID_RESPONSE",
            transient: true,
        });
    }
}

function createAttemptSignal(parentSignal, timeoutMs) {
    const timeoutSignal = AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs)));
    return parentSignal ? AbortSignal.any([parentSignal, timeoutSignal]) : timeoutSignal;
}

async function readBoundedJson(response) {
    const text = await readBoundedResponseText(
        response,
        OPENAI_MAX_RESPONSE_BYTES,
        () =>
            new OpenAiProviderError("Resposta OpenAI excede o limite", {
                code: "OPENAI_RESPONSE_TOO_LARGE",
            }),
    );
    try {
        return JSON.parse(text);
    } catch {
        throw new OpenAiProviderError("Resposta OpenAI inválida", {
            code: "OPENAI_INVALID_RESPONSE",
            transient: true,
        });
    }
}

function buildResponseInput({ systemPrompt, userInput, images = [] }) {
    const userContent = [
        { type: "input_text", text: JSON.stringify(userInput) },
        ...images.map((image) => ({
            type: "input_image",
            image_url: `data:${image.mimeType};base64,${image.imageBase64}`,
            detail: "high",
        })),
    ];
    return [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: userContent },
    ];
}

/**
 * Cria um cliente com modelos primary/retry/fallback.
 *
 * @param {{config?: typeof env, fetchImpl?: typeof fetch, sleep?: typeof delay}} options Dependências controladas.
 */
export function createOpenAiResponsesClient({
    config = env,
    fetchImpl = globalThis.fetch,
    sleep = delay,
} = {}) {
    if (fetchImpl !== globalThis.fetch && config.nodeEnv !== "test") {
        throw new Error("Transport OpenAI injetado é permitido apenas em NODE_ENV=test");
    }

    async function makeAttempt({ model, schemaName, schema, systemPrompt, userInput, images, timeoutMs, signal, promptVersion, schemaVersion }) {
        let response;
        const requestSignal = createAttemptSignal(signal, timeoutMs);
        try {
            response = await fetchImpl(OPENAI_RESPONSES_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.openAiApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    store: false,
                    input: buildResponseInput({ systemPrompt, userInput, images }),
                    text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
                }),
                signal: requestSignal,
            });
        } catch (error) {
            if (signal?.aborted) throw error;
            throw new OpenAiProviderError("OpenAI temporariamente indisponível", {
                transient: true,
                statusCode: 503,
                code: error?.name === "TimeoutError" ? "OPENAI_TIMEOUT" : "OPENAI_NETWORK_ERROR",
            });
        }

        if (!response.ok) {
            const transient = TRANSIENT_STATUS_CODES.has(response.status);
            throw new OpenAiProviderError(
                transient ? "OpenAI temporariamente indisponível" : "Pedido OpenAI recusado",
                {
                    transient,
                    statusCode: transient ? 503 : 502,
                    code: `OPENAI_HTTP_${response.status}`,
                    retryAfterMs: parseRetryAfterMs(response.headers?.get?.("retry-after")),
                },
            );
        }

        let payload;
        try {
            payload = await readBoundedJson(response);
        } catch (error) {
            if (error instanceof OpenAiProviderError) throw error;
            if (signal?.aborted) throw error;
            throw new OpenAiProviderError("OpenAI temporariamente indisponível", {
                transient: true,
                statusCode: 503,
                code:
                    requestSignal.aborted || error?.name === "TimeoutError"
                        ? "OPENAI_TIMEOUT"
                        : "OPENAI_NETWORK_ERROR",
            });
        }
        return {
            value: normalizeStructuredPayload(payload, schema),
            provenance: {
                provider: "openai",
                requestedModel: model,
                effectiveModel: payload.model ?? model,
                requestId: response.headers?.get?.("x-request-id") ?? payload.id ?? null,
                promptVersion: promptVersion ?? config.openAiPromptVersion,
                schemaVersion: schemaVersion ?? config.openAiSchemaVersion,
            },
        };
    }

    return {
        async requestStructured({
            schemaName,
            schema,
            systemPrompt,
            userInput,
            images,
            timeoutMs,
            signal,
            validateValue,
            promptVersion,
            schemaVersion,
        }) {
            assertOpenAiAvailable(config);
            const deadlineAt = Date.now() + timeoutMs;
            const attempts = [
                config.openAiAnalysisModel,
                config.openAiAnalysisModel,
                config.openAiFallbackModel,
            ].filter((model, index, values) => index < 2 || model !== values[0]);
            let lastError;

            for (let index = 0; index < attempts.length; index += 1) {
                const remainingMs = deadlineAt - Date.now();
                if (remainingMs <= 0) {
                    lastError = new OpenAiProviderError(
                        "A operação OpenAI excedeu o tempo limite",
                        {
                            transient: true,
                            statusCode: 503,
                            code: "OPENAI_TIMEOUT",
                        },
                    );
                    break;
                }
                try {
                    const result = await makeAttempt({
                        model: attempts[index],
                        schemaName,
                        schema,
                        systemPrompt,
                        userInput,
                        images,
                        timeoutMs: remainingMs,
                        signal,
                        promptVersion,
                        schemaVersion,
                    });
                    if (typeof validateValue === "function") {
                        try {
                            validateValue(result.value);
                        } catch (validationError) {
                            throw new OpenAiProviderError(
                                "Resposta OpenAI semanticamente inválida",
                                {
                                    transient: true,
                                    statusCode: 502,
                                    code:
                                        validationError?.details?.code ??
                                        validationError?.code ??
                                        "OPENAI_INVALID_RESPONSE",
                                },
                            );
                        }
                    }
                    return { ...result, attemptCount: index + 1 };
                } catch (error) {
                    lastError = error;
                    if (!error?.transient || index === attempts.length - 1) break;
                    if (error.retryAfterMs > 0) {
                        const sleepMs = Math.min(
                            error.retryAfterMs,
                            Math.max(0, deadlineAt - Date.now()),
                        );
                        if (sleepMs <= 0) continue;
                        await sleep(sleepMs, undefined, { signal });
                    }
                }
            }

            throw new AppError(
                lastError?.statusCode ?? 503,
                "Não foi possível concluir a operação OpenAI. Tenta novamente.",
                {
                    code: lastError?.code ?? "OPENAI_UNAVAILABLE",
                    retryable: Boolean(lastError?.transient),
                },
            );
        },
    };
}

const defaultClient = createOpenAiResponsesClient({
    fetchImpl:
        env.nodeEnv === "test" && env.openAiTestFixtureMode === true
            ? createOpenAiTestTransportForTests(env)
            : globalThis.fetch,
});

/** Analisa as duas fotografias sem enviar identificadores pessoais. */
export async function analyzeSkinPhotosWithOpenAiV2(
    { frontalPhoto, perfilPhoto, objectives = [], signal },
    { client = defaultClient } = {},
) {
    const systemPrompt = [
        "És um assistente de consultoria cosmética não médica.",
        "Avalia primeiro a qualidade das fotografias; se for inconclusiva, não inventes findings.",
        "Classifica como inconclusive quando alguma imagem não tiver exatamente um rosto, o rosto ocupar menos de 30% ou mais de 85% do enquadramento, desviar mais de 20% do centro, estiver cortado/desfocado, demasiado escuro/sobre-exposto, quando a frontal exceder aproximadamente 20 graus ou a lateral não estiver entre 35 e 75 graus.",
        "Óculos, cabelo sobre o rosto, fundo perturbador ou luz desigual são warnings explícitos; nunca os convertas silenciosamente em pass.",
        "Escreve todos os campos textuais destinados ao utilizador em português de Portugal, com linguagem curta e acionável.",
        "Não diagnostiques doenças e assinala sinais que justifiquem procurar um profissional de saúde.",
        "Responde apenas segundo o JSON Schema fornecido.",
    ].join(" ");
    const response = await client.requestStructured({
        schemaName: "orelle_skin_analysis_v2",
        schema: OPENAI_SKIN_ANALYSIS_SCHEMA,
        systemPrompt,
        userInput: {
            objectives,
            imageOrder: ["fotografia_frontal", "fotografia_perfil"],
            purpose: FACE_IMAGE_PURPOSE_POLICY.purpose,
            retention: FACE_IMAGE_PURPOSE_POLICY.retention,
            modelLearningAllowed: false,
            photoQualityProfile: {
                version: "face-photo-quality-v1",
                exactlyOneFace: true,
                faceFrameRatio: { min: 0.3, max: 0.85 },
                maxCenterDeviation: 0.2,
                frontalMaxYawDegrees: 20,
                lateralYawDegrees: { min: 35, max: 75 },
                luminanceMean: { min: 45, max: 210 },
                maxClippedPixelRatio: 0.2,
                blurIsHardFailure: true,
            },
        },
        images: [frontalPhoto, perfilPhoto],
        timeoutMs: env.openAiAnalysisTimeoutMs,
        signal,
        validateValue: (value) =>
            assertAnalysisMatchesObjectives(value, objectives),
    });

    assertAnalysisMatchesObjectives(response.value, objectives);

    return {
        ...response.value,
        mode: "openai",
        isDemo: false,
        providerName: "openai-responses",
        providerVersion: response.provenance.effectiveModel,
        provenance: response.provenance,
    };
}

/**
 * Confirma invariantes semânticas que o JSON Schema, isoladamente, não liga
 * aos objetivos concretos enviados na mesma operação.
 *
 * @param {object} value - Resultado já validado estruturalmente.
 * @param {string[]} objectives - Objetivos do snapshot da consulta.
 * @returns {void}
 * @throws {AppError} Quando a resposta omite/troca objetivos ou findings.
 */
export function assertAnalysisMatchesObjectives(value, objectives) {
    const requestedGoals = [...new Set(objectives.map(String))].sort();
    const qualityStatus = value?.photoQuality?.status;

    if (qualityStatus === "inconclusive") {
        if (value.findings !== null) {
            throw new AppError(502, "Resposta OpenAI semanticamente inválida", {
                code: "OPENAI_INVALID_RESPONSE",
                retryable: true,
            });
        }
        return;
    }

    const returnedGoals = [
        ...new Set(
            (value?.findings?.objectiveAssessments ?? []).map(
                ({ goalCode }) => String(goalCode),
            ),
        ),
    ].sort();
    const hasBothSources =
        new Set(value?.sources ?? []).size === 2 &&
        value.sources.includes("fotografia_frontal") &&
        value.sources.includes("fotografia_perfil");
    if (
        !value?.findings ||
        requestedGoals.length < 1 ||
        requestedGoals.length !== returnedGoals.length ||
        requestedGoals.some((goal, index) => goal !== returnedGoals[index]) ||
        !hasBothSources
    ) {
        throw new AppError(502, "Resposta OpenAI semanticamente inválida", {
            code: "OPENAI_INVALID_RESPONSE",
            retryable: true,
        });
    }
}
