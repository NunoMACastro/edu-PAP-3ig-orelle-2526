/**
 * Testes focais das barreiras puras do orquestrador E2E.
 *
 * Estes casos não abrem portas, browsers ou processos MongoDB. Validam antes
 * de qualquer I/O que URIs remotas, nomes de base aproximados, secrets herdados
 * e manifests incompletos são recusados de forma determinística.
 */
import { describe, expect, it } from "vitest";
import {
    E2E_DATABASE_NAME,
    assertStrictE2eMongoUri,
    buildScrubbedE2eEnvironment,
    selectWebE2eScript,
} from "../scripts/e2e-runtime.core.mjs";
import { sanitizeE2eErrorMessage } from "../scripts/run-e2e.mjs";
import {
    buildVerificationTestEnvironment,
    listPublishedWebSmokeScripts,
    resolveApiTestGate,
} from "../scripts/verify-all.mjs";

describe("runtime E2E isolado", () => {
    it("aceita apenas a URI loopback do replica set e base exatos", () => {
        const result = assertStrictE2eMongoUri(
            "mongodb://127.0.0.1:43210/orelle_e2e_test?replicaSet=orelle-e2e-rs",
        );

        expect(result).toEqual({
            uri: "mongodb://127.0.0.1:43210/orelle_e2e_test?replicaSet=orelle-e2e-rs",
            databaseName: E2E_DATABASE_NAME,
            replicaSet: "orelle-e2e-rs",
        });
    });

    it.each([
        "mongodb://mongo.example.test:27017/orelle_e2e_test?replicaSet=orelle-e2e-rs",
        "mongodb://127.0.0.1:27017/orelle_test?replicaSet=orelle-e2e-rs",
        "mongodb://127.0.0.1:27017/orelle_e2e_test",
        "mongodb://127.0.0.1/orelle_e2e_test?replicaSet=orelle-e2e-rs",
        "mongodb://user:secret@127.0.0.1:27017/orelle_e2e_test?replicaSet=orelle-e2e-rs",
        "mongodb+srv://cluster.example.test/orelle_e2e_test",
    ])("recusa URI insegura antes de qualquer ligação: %s", (uri) => {
        expect(() => assertStrictE2eMongoUri(uri)).toThrow();
    });

    it("constrói ambiente allowlist-only sem credenciais herdadas", () => {
        const environment = buildScrubbedE2eEnvironment({
            source: {
                PATH: "/usr/bin",
                HOME: "/tmp/e2e-home",
                MONGODB_URI: "mongodb://remote.invalid/prod",
                OPENAI_API_KEY: "sk_live_real",
                NPM_TOKEN: "registry-secret",
                NODE_OPTIONS: "--require=/tmp/untrusted.cjs",
            },
            overrides: { PORT: 43100 },
        });

        expect(environment).toMatchObject({
            PATH: "/usr/bin",
            HOME: "/tmp/e2e-home",
            DOTENV_CONFIG_PATH: "/dev/null",
            NODE_ENV: "test",
            ORELLE_E2E_ISOLATED: "true",
            OPENAI_TEST_FIXTURE_MODE: "true",
            TRUSTED_PROXY_CIDRS: "127.0.0.1/32",
            PORT: "43100",
        });
        expect(environment.MONGODB_URI).toBeUndefined();
        expect(environment.OPENAI_API_KEY).toBeUndefined();
        expect(environment.NPM_TOKEN).toBeUndefined();
        expect(environment.NODE_OPTIONS).toBeUndefined();
        expect(environment.SESSION_SECRET).toMatch(/^test-session-[a-f0-9]{64}$/);
        expect(environment.DATA_ENCRYPTION_KEY).toMatch(/^test-data-[a-f0-9]{64}$/);
    });

    it("prefere o contrato web test:e2e", () => {
        expect(
            selectWebE2eScript({
                "test:e2e:browser": "playwright test",
                "test:e2e": "playwright test --config playwright.config.js",
            }),
        ).toBe("test:e2e");
    });

    it("falha claramente quando o frontend ainda não publicou Playwright", () => {
        expect(() => selectWebE2eScript({ test: "vitest run" })).toThrow(
            "Falta o script Playwright `test:e2e`",
        );
    });

    it("aceita a suite API atual como gate combinado", () => {
        expect(resolveApiTestGate({ test: "vitest run" })).toEqual({
            mode: "combined",
            scripts: ["test"],
        });
    });

    it("recusa publicação parcial dos gates API especializados", () => {
        expect(() =>
            resolveApiTestGate({
                test: "vitest run",
                "test:unit": "vitest run tests/unit",
            }),
        ).toThrow("Gate API incompleto");
    });

    it("inclui todos os smokes publicados no gate integral", () => {
        expect(
            listPublishedWebSmokeScripts({
                build: "vite build",
                "smoke:mf8-consultation": "node guided.mjs",
                "smoke:mf6-images": "node images.mjs",
            }),
        ).toEqual(["smoke:mf6-images", "smoke:mf8-consultation"]);
    });

    it("mantém a fixture OpenAI exclusiva do passo E2E", () => {
        const environment = buildVerificationTestEnvironment();

        expect(environment).toMatchObject({
            NODE_ENV: "test",
            ORELLE_E2E_ISOLATED: "false",
            OPENAI_TEST_FIXTURE_MODE: "false",
            DOTENV_CONFIG_PATH: "/dev/null",
        });
        expect(environment.OPENAI_API_KEY).toBeUndefined();
        expect(environment.MONGODB_URI).toBeUndefined();
    });

    it("sanitiza URI, password e segredos efémeros em falhas", () => {
        const message = sanitizeE2eErrorMessage(
            new Error(
                "mongodb://127.0.0.1:43100/orelle_e2e_test?replicaSet=x test-user-password-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb test-session-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ),
        );

        expect(message).not.toContain("mongodb://");
        expect(message).not.toContain("test-user-password-bbbb");
        expect(message).not.toContain("test-session-aaaa");
        expect(message).toContain("[mongodb-uri-redacted]");
        expect(message).toContain("[password-redacted]");
        expect(message).toContain("[secret-redacted]");
    });
});
