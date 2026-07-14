/**
 * Contrato MF8/BK-MF8-03 para provar isolamento do ambiente de testes.
 */
import { describe, expect, it } from "vitest";

import {
    ENVIRONMENT_NAMES,
    assertTestEnvironmentIsIsolated,
    getMongoDatabaseName,
    getUnsafeTestSecretNames,
    isProductionLikeMongoUri,
    looksLikeLiveSecret,
    parseClientOrigins,
    parseRuntimePort,
    assertRuntimeConfiguration,
} from "../src/config/env.js";

describe("BK-MF8-03 - isolamento do ambiente de testes", () => {
    it("aceita NODE_ENV=test com base MongoDB isolada", () => {
        const result = assertTestEnvironmentIsIsolated({
            nodeEnv: ENVIRONMENT_NAMES.TEST,
            mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            source: {
                OPENAI_API_KEY: "fake-openai-key",
            },
        });

        expect(result).toEqual({
            nodeEnv: "test",
            mongoDatabaseName: "orelle_test",
            unsafeSecretNames: [],
        });
    });

    it("bloqueia suites automatizadas fora de NODE_ENV=test", () => {
        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.DEVELOPMENT,
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
                source: {},
            }),
        ).toThrow("NODE_ENV=test");
    });

    it("bloqueia URI MongoDB sem marcador explicito de teste", () => {
        expect(getMongoDatabaseName("mongodb://127.0.0.1:27017/orelle")).toBe(
            "orelle",
        );
        expect(isProductionLikeMongoUri("mongodb://127.0.0.1:27017/orelle")).toBe(
            true,
        );

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle",
                source: {},
            }),
        ).toThrow("MONGODB_URI de teste");
    });

    it("bloqueia nomes de base que parecem producao mesmo com NODE_ENV=test", () => {
        expect(
            isProductionLikeMongoUri("mongodb://127.0.0.1:27017/orelle-prod"),
        ).toBe(true);

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle-prod",
                source: {},
            }),
        ).toThrow("MONGODB_URI de teste");
    });

    it("bloqueia credenciais reais em testes automatizados", () => {
        expect(looksLikeLiveSecret("sk_live_real_value")).toBe(true);
        expect(
            getUnsafeTestSecretNames({ OPENAI_API_KEY: "sk_live_real_value" }),
        ).toEqual(["OPENAI_API_KEY"]);

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
                source: { OPENAI_API_KEY: "sk_live_real_value" },
            }),
        ).toThrow("Credenciais reais");
    });

    it("bloqueia uma chave OpenAI moderna sem depender da palavra live", () => {
        expect(
            getUnsafeTestSecretNames({
                OPENAI_API_KEY: "sk-proj-realistic-secret-without-live-marker",
            }),
        ).toEqual(["OPENAI_API_KEY"]);
        expect(
            getUnsafeTestSecretNames({
                OPENAI_API_KEY: "sk-proj-opt-in",
                ORELLE_LIVE_OPENAI_TEST: "true",
            }),
        ).toEqual([]);
    });

    it("recusa porta e origins ambíguas antes de abrir o servidor", () => {
        expect(parseRuntimePort("43210")).toBe(43_210);
        expect(() => parseRuntimePort("abc")).toThrow("PORT");
        expect(() => parseRuntimePort("70000")).toThrow("PORT");
        expect(parseClientOrigins("http://127.0.0.1:5173,http://127.0.0.1:5173"))
            .toEqual(["http://127.0.0.1:5173"]);
        expect(() => parseClientOrigins("https://example.test/path")).toThrow(
            "origins HTTP/HTTPS",
        );
        expect(() =>
            parseClientOrigins("http://example.test", ENVIRONMENT_NAMES.PRODUCTION),
        ).toThrow("HTTPS");
    });

    it("production exige Mongo explícita, cifra forte e HTTPS", () => {
        const base = {
            nodeEnv: ENVIRONMENT_NAMES.PRODUCTION,
            port: 3001,
            mongoUri: "mongodb://127.0.0.1:27017/orelle",
            clientOrigins: ["https://orelle.example"],
            dataEncryptionKey: "x".repeat(32),
            forceHttps: true,
        };

        expect(() => assertRuntimeConfiguration(base, {})).toThrow(
            "MONGODB_URI explícita",
        );
        expect(() =>
            assertRuntimeConfiguration(
                { ...base, dataEncryptionKey: "fraca" },
                { MONGODB_URI: base.mongoUri },
            ),
        ).toThrow("DATA_ENCRYPTION_KEY forte");
        expect(
            assertRuntimeConfiguration(base, { MONGODB_URI: base.mongoUri }),
        ).toEqual({
            nodeEnv: "production",
            port: 3001,
            databaseConfigured: true,
            originCount: 1,
        });
    });
});
