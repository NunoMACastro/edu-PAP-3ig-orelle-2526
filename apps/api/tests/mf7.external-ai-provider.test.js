/**
 * Testes BK-MF7-07 para provider externo de IA facial.
 *
 * A suite cobre a fronteira de integração: configuração por ambiente,
 * transporte seguro, payload minimizado, fallback local e normalização de
 * respostas remotas sem quebrar o contrato público da Orélle.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import {
    analyzeSkinPhotosExternally,
    analyzeSkinPhotosWithOpenAi,
} from "../src/providers/external-skin-analysis.provider.js";
import { analyzeSkinPhotos } from "../src/providers/skin-analysis.provider.js";

const frontalPhoto = {
    storageKey: "private/front.enc",
    mimeType: "image/png",
    sizeBytes: 1200,
    imageBase64: Buffer.from("frontal-test-image").toString("base64"),
};
const perfilPhoto = {
    storageKey: "private/profile.enc",
    mimeType: "image/png",
    sizeBytes: 1300,
    imageBase64: Buffer.from("perfil-test-image").toString("base64"),
};
const openAiFindings = {
    skinType: {
        label: "mista",
        confidence: 0.82,
        explanation: "Sinais cosmeticos compativeis com pele mista.",
    },
    acne: {
        label: "baixo",
        confidence: 0.44,
        explanation: "Sem sinais cosmeticos fortes de acne visivel.",
    },
    manchas: {
        label: "ligeiro",
        confidence: 0.51,
        explanation: "Possiveis diferencas ligeiras de tom.",
    },
    rugas: {
        label: "baixo",
        confidence: 0.42,
        explanation: "Linhas finas pouco evidentes nas imagens.",
    },
    oleosidade: {
        label: "moderada",
        confidence: 0.7,
        explanation: "Brilho cosmetico moderado na zona central.",
    },
};
const openAiAnalysisResult = {
    providerName: "openai-skin-analysis-test",
    findings: openAiFindings,
    sources: ["fotografia_frontal", "fotografia_perfil"],
    limitations: [
        "Analise cosmetica nao medica.",
        "A qualidade da luz pode afetar a leitura.",
    ],
};
const originalEnv = { ...env };

function buildOpenAiResponse(result = openAiAnalysisResult) {
    return {
        output: [
            {
                type: "message",
                content: [
                    {
                        type: "output_text",
                        text: JSON.stringify(result),
                    },
                ],
            },
        ],
    };
}

function restoreProcessEnvKey(key, value) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
}

afterEach(() => {
    Object.assign(env, originalEnv);
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("BK-MF7-07 - provider IA externo", () => {
    it("recusa provider externo sem configuração", async () => {
        env.aiProviderUrl = undefined;
        env.aiProviderKey = undefined;

        await expect(
            analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto }),
        ).rejects.toThrow("Provider de IA externo não configurado");
    });

    it("mantém contrato público no provider local", async () => {
        env.aiProviderMode = "local";

        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.findings.skinType.label).toBeTruthy();
        expect(result.sources).toContain("fotografia_frontal");
        expect(result.limitations.length).toBeGreaterThan(0);
    });

    it("usa OPENAI_API_KEY com prioridade e AI_PROVIDER_KEY como fallback", async () => {
        const previousOpenAiApiKey = process.env.OPENAI_API_KEY;
        const previousAiProviderKey = process.env.AI_PROVIDER_KEY;

        try {
            process.env.OPENAI_API_KEY = "openai-priority-key";
            process.env.AI_PROVIDER_KEY = "legacy-provider-key";
            vi.resetModules();

            const { env: priorityEnv } = await import("../src/config/env.js");

            expect(priorityEnv.openAiApiKey).toBe("openai-priority-key");
            expect(priorityEnv.aiProviderKey).toBe("legacy-provider-key");

            process.env.OPENAI_API_KEY = "";
            vi.resetModules();

            const { env: fallbackEnv } = await import("../src/config/env.js");

            expect(fallbackEnv.openAiApiKey).toBe("legacy-provider-key");
        } finally {
            restoreProcessEnvKey("OPENAI_API_KEY", previousOpenAiApiKey);
            restoreProcessEnvKey("AI_PROVIDER_KEY", previousAiProviderKey);
            vi.resetModules();
        }
    });

    it("usa fallback local explícito quando o provider externo falha", async () => {
        env.aiProviderMode = "external";
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.limitations).toContain(
            "Provider configurado indisponível; foi usado fallback local.",
        );
    });

    it("envia pedido OpenAI no formato Responses API sem expor dados privados no body", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        env.aiProviderModel = "gpt-test-model";
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => buildOpenAiResponse(),
        });

        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        const [url, options] = fetchSpy.mock.calls[0];
        const body = JSON.parse(options.body);
        const imageItems = body.input[0].content.filter(
            (item) => item.type === "input_image",
        );
        const bodyText = JSON.stringify(body);

        expect(url).toBe("https://api.openai.com/v1/responses");
        expect(options.headers.Authorization).toBe("Bearer openai-test-key");
        expect(body.model).toBe("gpt-test-model");
        expect(body.store).toBe(false);
        expect(body.text.format).toMatchObject({
            type: "json_schema",
            name: "orelle_skin_analysis",
            strict: true,
        });
        expect(body.text.format.schema.required).toEqual([
            "providerName",
            "findings",
            "sources",
            "limitations",
        ]);
        expect(imageItems).toHaveLength(2);
        expect(imageItems[0].image_url).toBe(
            `data:image/png;base64,${frontalPhoto.imageBase64}`,
        );
        expect(imageItems[1].image_url).toBe(
            `data:image/png;base64,${perfilPhoto.imageBase64}`,
        );
        expect(bodyText).not.toContain("openai-test-key");
        expect(bodyText).not.toContain("storageKey");
        expect(bodyText).not.toContain("private/front.enc");
        expect(bodyText).not.toContain("private/profile.enc");
        expect(result.providerName).toBe("openai-skin-analysis-test");
        expect(result.findings.skinType.label).toBe("mista");
        expect(result.sources).toEqual(["fotografia_frontal", "fotografia_perfil"]);
    });

    it("converte output_text da OpenAI para o contrato Orélle normalizado", async () => {
        env.openAiApiKey = "openai-test-key";
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                output_text: JSON.stringify({
                    ...openAiAnalysisResult,
                    providerName: "openai-output-text-provider",
                    findings: {
                        ...openAiFindings,
                        acne: {
                            label: "a".repeat(120),
                            confidence: 1,
                            explanation: "b".repeat(320),
                        },
                    },
                }),
            }),
        });

        const result = await analyzeSkinPhotosWithOpenAi({
            frontalPhoto,
            perfilPhoto,
        });

        expect(result.providerName).toBe("openai-output-text-provider");
        expect(result.findings.acne.label).toHaveLength(80);
        expect(result.findings.acne.confidence).toBe(0.95);
        expect(result.findings.acne.explanation).toHaveLength(240);
    });

    it("usa fallback local explícito quando a OpenAI falha por rede", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.limitations).toContain(
            "Provider configurado indisponível; foi usado fallback local.",
        );
    });

    it("usa fallback local explícito quando a OpenAI devolve 5xx", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.limitations).toContain(
            "Provider configurado indisponível; foi usado fallback local.",
        );
    });

    it("usa fallback local explícito quando a OpenAI excede o tempo limite", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        vi.useFakeTimers();
        vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
            return new Promise((_resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    const abortError = new Error("aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                });
            });
        });

        const resultPromise = analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        await vi.advanceTimersByTimeAsync(6_000);

        const result = await resultPromise;

        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.limitations).toContain(
            "Provider configurado indisponível; foi usado fallback local.",
        );
    });

    it("não faz fallback silencioso quando a OpenAI devolve 4xx", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({}),
        });

        await expect(
            analyzeSkinPhotos({ frontalPhoto, perfilPhoto }),
        ).rejects.toThrow("Pedido OpenAI de análise facial inválido");
    });

    it("envia imagem minimizada sem storageKey nem token no body", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                providerName: "external-test-provider",
                findings: {
                    skinType: {
                        label: "mista",
                        confidence: 0.72,
                        explanation: "Resultado cosmético remoto.",
                    },
                },
            }),
        });

        await analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto });

        const [, options] = fetchSpy.mock.calls[0];
        const body = JSON.parse(options.body);

        // A API key fica no header e o body leva apenas imagem temporária minimizada.
        expect(options.headers.Authorization).toBe("Bearer secret-test-key");
        expect(body.photos[0].contentBase64).toBe(frontalPhoto.imageBase64);
        expect(body.photos[1].contentBase64).toBe(perfilPhoto.imageBase64);
        expect(JSON.stringify(body)).not.toContain("secret-test-key");
        expect(JSON.stringify(body)).not.toContain("storageKey");
        expect(JSON.stringify(body)).not.toContain("private/front.enc");
    });

    it("recusa URL HTTP externo antes de enviar imagem ou API key", async () => {
        env.aiProviderUrl = "http://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        await expect(
            analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto }),
        ).rejects.toThrow("Provider de IA externo deve usar HTTPS");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("recusa imagem não preparada antes de chamar provider externo", async () => {
        env.aiProviderMode = "external";
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        await expect(
            analyzeSkinPhotos({
                frontalPhoto: {
                    storageKey: "private/front.enc",
                    mimeType: "image/png",
                    sizeBytes: 1200,
                },
                perfilPhoto,
            }),
        ).rejects.toThrow("Fotografias preparadas obrigatórias para provider externo");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("recusa imagem sem base64 em modo OpenAI sem fallback silencioso", async () => {
        env.aiProviderMode = "openai";
        env.openAiApiKey = "openai-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        await expect(
            analyzeSkinPhotos({
                frontalPhoto: {
                    storageKey: "private/front.enc",
                    mimeType: "image/png",
                    sizeBytes: 1200,
                },
                perfilPhoto,
            }),
        ).rejects.toThrow("Fotografias preparadas obrigatórias para provider externo");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("normaliza resposta remota sem findings em vez de quebrar a API", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ providerName: "external-test-provider" }),
        });

        const result = await analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto });

        expect(result.providerName).toBe("external-test-provider");
        expect(result.findings.skinType.label).toBe("indeterminado");
        expect(result.limitations.length).toBeGreaterThan(0);
    });

    it("normaliza timeout remoto como erro controlado", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        vi.useFakeTimers();
        vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
            return new Promise((_resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    const abortError = new Error("aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                });
            });
        });

        const resultPromise = analyzeSkinPhotosExternally({
            frontalPhoto,
            perfilPhoto,
        });
        const expectation = expect(resultPromise).rejects.toThrow(
            "Provider de IA externo excedeu o tempo limite",
        );

        await vi.advanceTimersByTimeAsync(6_000);

        await expectation;
    });
});
