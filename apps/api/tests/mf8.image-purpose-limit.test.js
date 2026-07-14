/**
 * Testes BK-MF8-07 para finalidade e minimização de imagens faciais.
 *
 * A prova é feita na fronteira OpenAI-only atual: finalidade fixa, retenção
 * explícita, aprendizagem desativada e rejeição antes de qualquer transporte.
 */
import { describe, expect, it, vi } from "vitest";
import {
    FACE_ANALYSIS_CONSENT_PURPOSE,
    FACE_IMAGE_PROVIDER_RETENTION,
    FACE_IMAGE_PURPOSE_POLICY,
    THIRD_PARTY_MODEL_LEARNING_PURPOSE,
} from "../src/constants/face-consent.js";
import { createOpenAiResponsesClient } from "../src/providers/openai-responses.provider.js";
import {
    analyzeSkinPhotos,
    assertValidAnalysisPhotos,
} from "../src/providers/skin-analysis.provider.js";

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
const validInput = Object.freeze({
    frontalPhoto,
    perfilPhoto,
    objectives: ["sun_protection"],
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

function responseWithAnalysis() {
    const finding = {
        label: "baixo",
        confidence: 0.7,
        explanation: "Observação cosmética não médica.",
    };
    const value = {
        photoQuality: { status: "pass", reasons: [], warnings: [] },
        findings: {
            skinType: { ...finding, label: "mista" },
            acne: finding,
            manchas: finding,
            rugas: finding,
            oleosidade: finding,
            objectiveAssessments: [
                {
                    goalCode: "sun_protection",
                    summary: "Avaliação cosmética orientada à proteção solar.",
                    confidence: 0.75,
                    observations: ["Exposição solar indicada na consulta."],
                    cautions: ["Não substitui aconselhamento médico."],
                },
            ],
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["A imagem não mede proteção UV."],
        safetyFlags: [],
    };

    return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () =>
            JSON.stringify({
                id: "resp_purpose_test",
                model: "primary-test-model",
                output: [
                    {
                        type: "message",
                        content: [
                            { type: "output_text", text: JSON.stringify(value) },
                        ],
                    },
                ],
            }),
    };
}

describe("BK-MF8-07 - limite de finalidade de imagem OpenAI", () => {
    it("mantém a política canónica imutável e sem aprendizagem por terceiros", () => {
        expect(FACE_IMAGE_PURPOSE_POLICY).toEqual({
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            retention: FACE_IMAGE_PROVIDER_RETENTION,
            modelLearningAllowed: false,
        });
        expect(Object.isFrozen(FACE_IMAGE_PURPOSE_POLICY)).toBe(true);
    });

    it("inclui apenas finalidade e retenção autorizadas no input estruturado", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(responseWithAnalysis());
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await analyzeSkinPhotos(validInput, { client });

        const [, options] = fetchImpl.mock.calls[0];
        const body = JSON.parse(options.body);
        const userInput = JSON.parse(body.input[1].content[0].text);
        expect(userInput).toEqual({
            objectives: ["sun_protection"],
            imageOrder: ["fotografia_frontal", "fotografia_perfil"],
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            retention: FACE_IMAGE_PROVIDER_RETENTION,
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
        });
    });

    it("bloqueia finalidade diferente antes de criar qualquer chamada remota", async () => {
        const fetchImpl = vi.fn();
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await expect(
            analyzeSkinPhotos(
                {
                    ...validInput,
                    requestedPurpose: THIRD_PARTY_MODEL_LEARNING_PURPOSE,
                },
                { client },
            ),
        ).rejects.toThrow("Finalidade da análise facial não autorizada");
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("bloqueia aprendizagem por terceiros antes de chamar OpenAI", async () => {
        const fetchImpl = vi.fn();
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await expect(
            analyzeSkinPhotos(
                { ...validInput, allowModelLearning: true },
                { client },
            ),
        ).rejects.toThrow("Aprendizagem por terceiros não autorizada");
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("recusa uma imagem incompleta antes de qualquer transporte", async () => {
        const fetchImpl = vi.fn();
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });
        const invalidInput = {
            ...validInput,
            frontalPhoto: {
                storageKey: "private/front.enc",
                mimeType: "image/png",
                sizeBytes: 1_200,
            },
        };

        expect(() => assertValidAnalysisPhotos(invalidInput)).toThrow(
            "Fotografias preparadas inválidas para análise",
        );
        await expect(
            analyzeSkinPhotos(invalidInput, { client }),
        ).rejects.toThrow("Fotografias preparadas inválidas para análise");
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("não envia storageKey, consentId nem segredo no body OpenAI", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(responseWithAnalysis());
        const client = createOpenAiResponsesClient({ config: testConfig, fetchImpl });

        await analyzeSkinPhotos(validInput, { client });

        const [, options] = fetchImpl.mock.calls[0];
        const serializedBody = options.body;
        expect(options.headers.Authorization).toBe("Bearer test-openai-key");
        expect(serializedBody).not.toContain("test-openai-key");
        expect(serializedBody).not.toContain("storageKey");
        expect(serializedBody).not.toContain("consentId");
        expect(serializedBody).not.toContain("private/front.enc");
        expect(serializedBody).not.toContain("private/profile.enc");
    });
});
