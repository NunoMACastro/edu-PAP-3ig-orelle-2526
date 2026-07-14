/**
 * Testes de compatibilidade BK-MF7-07 para o provider OpenAI-only.
 *
 * O nome histórico do ficheiro é mantido para preservar os comandos dos guias,
 * mas a suite já não admite providers selecionáveis, resultados demo ou
 * fallback sintético. A única fronteira remota é a Responses API da OpenAI.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    assertAiProviderConfiguration,
    getUnsafeTestSecretNames,
} from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    createOpenAiResponsesClient,
    getOpenAiCapabilities,
    OPENAI_NEXT_QUESTION_SCHEMA,
    OPENAI_RESPONSES_URL,
} from "../src/providers/openai-responses.provider.js";
import { analyzeSkinPhotos } from "../src/providers/skin-analysis.provider.js";

const frontalPhoto = Object.freeze({
    storageKey: "private/front.enc",
    consentId: "consent-private-id",
    mimeType: "image/png",
    sizeBytes: 1_200,
    imageBase64: Buffer.from("frontal-test-image").toString("base64"),
});
const perfilPhoto = Object.freeze({
    storageKey: "private/profile.enc",
    consentId: "consent-private-id",
    mimeType: "image/webp",
    sizeBytes: 1_300,
    imageBase64: Buffer.from("perfil-test-image").toString("base64"),
});
const validAnalysisInput = Object.freeze({
    frontalPhoto,
    perfilPhoto,
    objectives: ["acne_imperfections"],
    requestedPurpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    allowModelLearning: false,
});
const testConfig = Object.freeze({
    nodeEnv: "test",
    openAiApiKey: "test-openai-key",
    openAiAnalysisModel: "primary-test-model",
    openAiFallbackModel: "fallback-test-model",
    openAiNoticeVersion: "notice-v2",
    openAiPromptVersion: "prompt-v2",
    openAiSchemaVersion: "schema-v2",
    openAiAnalysisTimeoutMs: 5_000,
});

function response(status, payload, headers = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get(name) {
                return headers[name.toLowerCase()] ?? null;
            },
        },
        text: async () => JSON.stringify(payload),
    };
}

function structuredResponse(value, options = {}) {
    return response(
        200,
        {
            id: options.id ?? "resp_test",
            model: options.model ?? "primary-test-model",
            output: [
                {
                    type: "message",
                    content: [
                        {
                            type: "output_text",
                            text: JSON.stringify(value),
                        },
                    ],
                },
            ],
        },
        { "x-request-id": options.requestId ?? "request-test" },
    );
}

function validAnalysisResult() {
    const finding = (label, confidence) => ({
        label,
        confidence,
        explanation: "Observação cosmética não médica.",
    });

    return {
        photoQuality: { status: "pass", reasons: [], warnings: [] },
        findings: {
            skinType: finding("mista", 0.82),
            acne: finding("ligeiro", 0.64),
            manchas: finding("baixo", 0.51),
            rugas: finding("baixo", 0.42),
            oleosidade: finding("moderada", 0.7),
            objectiveAssessments: [
                {
                    goalCode: "acne_imperfections",
                    summary: "Avaliação cosmética orientada ao objetivo.",
                    confidence: 0.72,
                    observations: ["Imperfeições ligeiras visíveis."],
                    cautions: ["Não constitui diagnóstico médico."],
                },
            ],
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["A luz pode alterar a leitura visual."],
        safetyFlags: [],
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("BK-MF7-07 - provider OpenAI-only", () => {
    it("mantém a aplicação degradada sem chave e não expõe configuração sensível", () => {
        const config = { ...testConfig, openAiApiKey: undefined };

        expect(assertAiProviderConfiguration(config)).toEqual({
            provider: "openai",
            providerConfigured: false,
            reason: "AI_NOT_CONFIGURED",
        });
        expect(getOpenAiCapabilities(config)).toMatchObject({
            provider: "openai",
            available: false,
            degraded: true,
            reason: "AI_NOT_CONFIGURED",
        });
        expect(JSON.stringify(getOpenAiCapabilities(testConfig))).not.toContain(
            testConfig.openAiApiKey,
        );
    });

    it("deteta uma chave OpenAI real em testes, exceto no live test opt-in", () => {
        const liveLookingKey = "sk-proj-redacted-production-looking-value";

        expect(
            getUnsafeTestSecretNames({ OPENAI_API_KEY: liveLookingKey }),
        ).toContain("OPENAI_API_KEY");
        expect(
            getUnsafeTestSecretNames({
                OPENAI_API_KEY: liveLookingKey,
                ORELLE_LIVE_OPENAI_TEST: "true",
            }),
        ).not.toContain("OPENAI_API_KEY");
    });

    it("envia apenas a Responses API fixa, store:false e JSON Schema estrito", async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValue(structuredResponse(validAnalysisResult()));
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        const result = await analyzeSkinPhotos(validAnalysisInput, { client });

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        const [url, options] = fetchImpl.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(url).toBe(OPENAI_RESPONSES_URL);
        expect(options.headers.Authorization).toBe("Bearer test-openai-key");
        expect(body).toMatchObject({
            model: "primary-test-model",
            store: false,
            text: {
                format: {
                    type: "json_schema",
                    name: "orelle_skin_analysis_v2",
                    strict: true,
                },
            },
        });
        expect(result).toMatchObject({
            mode: "openai",
            isDemo: false,
            providerName: "openai-responses",
            providerVersion: "primary-test-model",
        });
        expect(result.findings.objectiveAssessments[0].goalCode).toBe(
            "acne_imperfections",
        );
    });

    it("minimiza imagens e nunca inclui chave, storageKey ou consentId no body", async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValue(structuredResponse(validAnalysisResult()));
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await analyzeSkinPhotos(validAnalysisInput, { client });

        const [, options] = fetchImpl.mock.calls[0];
        const body = JSON.parse(options.body);
        const bodyText = JSON.stringify(body);
        const imageItems = body.input[1].content.filter(
            (item) => item.type === "input_image",
        );

        expect(imageItems).toEqual([
            {
                type: "input_image",
                image_url: `data:image/png;base64,${frontalPhoto.imageBase64}`,
                detail: "high",
            },
            {
                type: "input_image",
                image_url: `data:image/webp;base64,${perfilPhoto.imageBase64}`,
                detail: "high",
            },
        ]);
        expect(bodyText).not.toContain(testConfig.openAiApiKey);
        expect(bodyText).not.toContain("storageKey");
        expect(bodyText).not.toContain("consentId");
        expect(bodyText).not.toContain("private/front.enc");
    });

    it("repete o modelo primário e usa apenas o fallback OpenAI em 429", async () => {
        const attemptedModels = [];
        const sleep = vi.fn().mockResolvedValue(undefined);
        const fetchImpl = vi.fn(async (_url, options) => {
            const body = JSON.parse(options.body);
            attemptedModels.push(body.model);
            if (attemptedModels.length < 3) {
                return response(429, {}, { "retry-after": "0" });
            }
            return structuredResponse({
                status: "complete",
                slotCode: null,
                type: null,
                label: null,
                options: [],
                min: null,
                max: null,
                maxLength: null,
            }, { model: "fallback-test-model" });
        });
        const client = createOpenAiResponsesClient({
            config: testConfig,
            fetchImpl,
            sleep,
        });

        const result = await client.requestStructured({
            schemaName: "question_test",
            schema: OPENAI_NEXT_QUESTION_SCHEMA,
            systemPrompt: "Teste controlado.",
            userInput: { candidateSlots: [] },
            timeoutMs: 5_000,
        });

        expect(attemptedModels).toEqual([
            "primary-test-model",
            "primary-test-model",
            "fallback-test-model",
        ]);
        expect(result.attemptCount).toBe(3);
        expect(result.provenance).toMatchObject({
            provider: "openai",
            requestedModel: "fallback-test-model",
            effectiveModel: "fallback-test-model",
        });
    });

    it("não tenta fallback em erro não transitório e não fabrica resultado", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(response(400, {}));
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await expect(
            client.requestStructured({
                schemaName: "question_test",
                schema: OPENAI_NEXT_QUESTION_SCHEMA,
                systemPrompt: "Teste controlado.",
                userInput: { candidateSlots: [] },
                timeoutMs: 5_000,
            }),
        ).rejects.toMatchObject({
            details: expect.objectContaining({
                code: "OPENAI_HTTP_400",
                retryable: false,
            }),
        });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("falha fechado após primary, retry e fallback indisponíveis", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(response(503, {}));
        const client = createOpenAiResponsesClient({
            config: testConfig,
            fetchImpl,
            sleep: vi.fn().mockResolvedValue(undefined),
        });

        await expect(
            client.requestStructured({
                schemaName: "question_test",
                schema: OPENAI_NEXT_QUESTION_SCHEMA,
                systemPrompt: "Teste controlado.",
                userInput: { candidateSlots: [] },
                timeoutMs: 5_000,
            }),
        ).rejects.toMatchObject({
            details: expect.objectContaining({ retryable: true }),
        });
        expect(fetchImpl).toHaveBeenCalledTimes(3);
    });

    it("rejeita resposta fora do schema e nunca a normaliza como análise", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            structuredResponse({
                ...validAnalysisResult(),
                unexpected: "prompt injection output",
            }),
        );
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await expect(
            analyzeSkinPhotos(validAnalysisInput, { client }),
        ).rejects.toMatchObject({
            details: expect.objectContaining({ code: "OPENAI_INVALID_RESPONSE" }),
        });
        expect(fetchImpl).toHaveBeenCalledTimes(3);
    });
});
