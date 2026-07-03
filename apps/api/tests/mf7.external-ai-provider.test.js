/**
 * Testes BK-MF7-07 para provider externo de IA facial.
 *
 * A suite cobre a fronteira de integração: configuração por ambiente,
 * transporte seguro, payload minimizado, fallback local e normalização de
 * respostas remotas sem quebrar o contrato público da Orélle.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { analyzeSkinPhotosExternally } from "../src/providers/external-skin-analysis.provider.js";
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
const originalEnv = { ...env };

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
