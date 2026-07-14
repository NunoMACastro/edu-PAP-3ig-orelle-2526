/**
 * Configuracao central da API Orélle.
 *
 * Este ficheiro existe desde o BK-MF0-01 e foi estendido no BK-MF0-02 para
 * incluir os parametros da sessao HttpOnly. A regra pedagogica aqui e simples:
 * o resto da aplicacao importa `env` e nao lê `process.env` diretamente.
 */
import { isIP } from "node:net";

export const ENVIRONMENT_NAMES = Object.freeze({
    DEVELOPMENT: "development",
    TEST: "test",
    PRODUCTION: "production",
});

const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "change-me-use-a-long-random-string",
    "secret",
    "session-secret",
]);
const DEFAULT_CLIENT_ORIGIN = "http://127.0.0.1:5173";
const DEFAULT_CLIENT_ORIGINS = [
    DEFAULT_CLIENT_ORIGIN,
    "http://localhost:5173",
];
const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5.4";
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_OPENAI_IMAGE_PROMPT_VERSION = "cosmetic-image-edit-v5";
const DEFAULT_OPENAI_IMAGE_SCHEMA_VERSION = "cosmetic-image-contract-v3";
const DEFAULT_OPENAI_REPORT_PROMPT_VERSION = "cosmetic-report-v6";
const DEFAULT_OPENAI_REPORT_SCHEMA_VERSION = "cosmetic-report-schema-v6";
const DEFAULT_OPENAI_IMAGE_QUALITY = "high";
const DEFAULT_OPENAI_NOTICE_VERSION = "openai-cosmetic-consultation-v2";
const DEFAULT_OPENAI_PROMPT_VERSION = "cosmetic-consultation-v2";
const DEFAULT_OPENAI_SCHEMA_VERSION = "cosmetic-consultation-schema-v2";
const DEFAULT_DEV_MONGO_URI = "mongodb://127.0.0.1:27017/orelle";
const DEFAULT_TEST_MONGO_URI = "mongodb://127.0.0.1:27017/orelle_test";
const TEST_DATABASE_MARKERS = [/(^|[_-])test($|[_-])/, /testing/];
const PRODUCTION_DATABASE_MARKERS = [/^orelle$/, /prod/, /production/, /live/];
const SENSITIVE_TEST_ENV_KEYS = [
    "AZURE_FACE_API_KEY",
    "OPENAI_API_KEY",
    "DATA_ENCRYPTION_KEY",
];
const SAFE_TEST_SECRET_MARKERS = [/test/i, /fake/i, /stub/i, /dummy/i, /sandbox/i];
const LIVE_SECRET_MARKERS = [/^sk_live_/i, /^pk_live_/i, /live/i, /prod/i, /production/i];

/**
 * Converte a allowlist de proxies em IPs/CIDRs estritos.
 *
 * Tokens amplos suportados pelo Express (`true`, `1`, `*`) são recusados. O
 * default vazio é seguro para execução académica local sem reverse proxy; quem
 * colocar um proxy à frente da API tem de declarar cada rede explicitamente.
 *
 * @function parseTrustedProxyCidrs
 * @param {string|undefined} rawValue - Lista CSV de endereços ou CIDRs.
 * @returns {string[]} Allowlist validada e sem duplicados.
 * @throws {Error} Quando uma entrada é ampla, inválida ou tem prefixo impossível.
 */
export function parseTrustedProxyCidrs(rawValue) {
    const entries = String(rawValue ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    const validatedEntries = entries.map((entry) => {
        if (["true", "1", "*"].includes(entry.toLowerCase())) {
            throw new Error(
                "TRUSTED_PROXY_CIDRS exige uma allowlist explícita de IPs/CIDRs",
            );
        }

        const separatorIndex = entry.lastIndexOf("/");
        const address =
            separatorIndex === -1 ? entry : entry.slice(0, separatorIndex);
        const prefixValue =
            separatorIndex === -1 ? undefined : entry.slice(separatorIndex + 1);
        const ipVersion = isIP(address);

        if (ipVersion === 0) {
            throw new Error(`Proxy confiável inválido: ${entry}`);
        }

        if (prefixValue !== undefined) {
            const prefix = Number(prefixValue);
            const maximumPrefix = ipVersion === 4 ? 32 : 128;

            if (
                !/^\d+$/.test(prefixValue) ||
                !Number.isInteger(prefix) ||
                prefix < 0 ||
                prefix > maximumPrefix
            ) {
                throw new Error(`CIDR de proxy inválido: ${entry}`);
            }
        }

        return entry;
    });

    return [...new Set(validatedEntries)];
}

/**
 * Converte a lista CSV de origens permitidas em valores aceites pelo CORS.
 *
 * `CLIENT_ORIGIN` continua a representar a origem principal usada em redirects,
 * enquanto `CLIENT_ORIGINS` permite aceitar localhost e 127.0.0.1 em dev.
 *
 * @function parseClientOrigins
 * @param {string} rawValue - Lista CSV de origens HTTP/HTTPS.
 * @returns {string[]} Origens limpas e sem entradas vazias.
 */
export function parseClientOrigins(
    rawValue,
    nodeEnv = ENVIRONMENT_NAMES.DEVELOPMENT,
) {
    const origins = String(rawValue ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        throw new Error("CLIENT_ORIGINS exige pelo menos uma origin explícita");
    }

    return [...new Set(origins.map((origin) => {
        let parsed;
        try {
            parsed = new URL(origin);
        } catch {
            throw new Error("CLIENT_ORIGINS contém uma origin inválida");
        }

        if (
            !["http:", "https:"].includes(parsed.protocol) ||
            parsed.username ||
            parsed.password ||
            parsed.pathname !== "/" ||
            parsed.search ||
            parsed.hash
        ) {
            throw new Error(
                "CLIENT_ORIGINS aceita apenas origins HTTP/HTTPS sem credenciais, path, query ou fragmento",
            );
        }
        if (
            nodeEnv === ENVIRONMENT_NAMES.PRODUCTION &&
            parsed.protocol !== "https:"
        ) {
            throw new Error("CLIENT_ORIGINS deve usar HTTPS em production");
        }

        return parsed.origin;
    }))];
}

/** Valida a porta HTTP antes de a entregar a `listen()`. */
export function parseRuntimePort(value) {
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error("PORT deve ser um inteiro entre 1 e 65535");
    }
    return port;
}

/**
 * Extrai o nome da base de dados a partir de uma URI MongoDB.
 *
 * @function getMongoDatabaseName
 * @param {string|undefined} mongoUri - URI MongoDB configurada.
 * @returns {string} Nome da base normalizado em minúsculas.
 */
export function getMongoDatabaseName(mongoUri) {
    const normalizedUri = String(mongoUri ?? "").trim().toLowerCase();
    const withoutQuery = normalizedUri.split("?")[0];
    const pathWithoutHost = withoutQuery.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, "");

    return pathWithoutHost.split("/").filter(Boolean).at(0) ?? "";
}

/**
 * Indica se a URI aponta para uma base sem marcador explícito de teste.
 *
 * @function isProductionLikeMongoUri
 * @param {string|undefined} mongoUri - URI MongoDB configurada.
 * @returns {boolean} Verdadeiro quando a URI não é segura para testes.
 */
export function isProductionLikeMongoUri(mongoUri) {
    const databaseName = getMongoDatabaseName(mongoUri);
    const hasTestMarker = TEST_DATABASE_MARKERS.some((pattern) =>
        pattern.test(databaseName),
    );
    const hasProductionMarker = PRODUCTION_DATABASE_MARKERS.some((pattern) =>
        pattern.test(databaseName),
    );

    return !databaseName || !hasTestMarker || hasProductionMarker;
}

/**
 * Identifica segredos que parecem pertencer a ambientes reais.
 *
 * @function looksLikeLiveSecret
 * @param {string|undefined} value - Valor de uma variável sensível.
 * @returns {boolean} Verdadeiro quando o valor parece real.
 */
export function looksLikeLiveSecret(value) {
    const normalizedValue = String(value ?? "").trim();

    if (!normalizedValue) {
        return false;
    }

    if (SAFE_TEST_SECRET_MARKERS.some((pattern) => pattern.test(normalizedValue))) {
        return false;
    }

    return LIVE_SECRET_MARKERS.some((pattern) => pattern.test(normalizedValue));
}

/**
 * Lista variáveis sensíveis que parecem reais em modo de teste.
 *
 * @function getUnsafeTestSecretNames
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} source - Fonte das variáveis.
 * @returns {string[]} Nomes das variáveis inseguras.
 */
export function getUnsafeTestSecretNames(source = process.env) {
    const liveOpenAiOptIn = source.ORELLE_LIVE_OPENAI_TEST === "true";

    return SENSITIVE_TEST_ENV_KEYS.filter((key) => {
        const value = String(source[key] ?? "").trim();
        if (!value) return false;

        if (key === "OPENAI_API_KEY") {
            if (liveOpenAiOptIn) return false;
            return !SAFE_TEST_SECRET_MARKERS.some((pattern) =>
                pattern.test(value),
            );
        }

        return looksLikeLiveSecret(value);
    });
}

const configuredClientOrigin =
    process.env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN;
const configuredClientOrigins =
    process.env.CLIENT_ORIGINS ??
    (process.env.CLIENT_ORIGIN
        ? configuredClientOrigin
        : DEFAULT_CLIENT_ORIGINS.join(","));
const configuredNodeEnv = process.env.NODE_ENV ?? ENVIRONMENT_NAMES.DEVELOPMENT;
const defaultMongoUri =
    configuredNodeEnv === ENVIRONMENT_NAMES.TEST
        ? DEFAULT_TEST_MONGO_URI
        : DEFAULT_DEV_MONGO_URI;

if (
    process.env.OPENAI_TEST_FIXTURE_MODE === "true" &&
    configuredNodeEnv !== ENVIRONMENT_NAMES.TEST
) {
    throw new Error("OPENAI_TEST_FIXTURE_MODE só é permitido em NODE_ENV=test");
}

/**
 * Identifica segredos de sessao que nao sao aceitaveis em producao.
 *
 * @function isUnsafeProductionSessionSecret
 * @param {string|undefined} secret - Valor de SESSION_SECRET.
 * @returns {boolean} Verdadeiro quando o segredo e ausente, fraco ou placeholder.
 */
export function isUnsafeProductionSessionSecret(secret) {
    const normalizedSecret = String(secret ?? "").trim();

    return (
        normalizedSecret.length < 32 ||
        INSECURE_SESSION_SECRETS.has(normalizedSecret.toLowerCase())
    );
}

/**
 * Lê uma variável opcional tratando strings vazias como ausência de valor.
 *
 * @function readOptionalEnvValue
 * @param {string|undefined} value - Valor cru de ambiente.
 * @returns {string|undefined} Valor limpo ou undefined.
 */
export function readOptionalEnvValue(value) {
    const normalizedValue = String(value ?? "").trim();

    return normalizedValue || undefined;
}

/** Lê a qualidade de imagem apenas a partir da allowlist oficial suportada. */
export function parseOpenAiImageQuality(value) {
    const quality = readOptionalEnvValue(value) ?? DEFAULT_OPENAI_IMAGE_QUALITY;
    if (!["low", "medium", "high", "auto"].includes(quality)) {
        throw new Error("OPENAI_IMAGE_QUALITY deve ser low, medium, high ou auto");
    }
    return quality;
}

/** Converte um inteiro positivo de ambiente com limites explícitos. */
export function parseBoundedPositiveInteger(
    value,
    fallback,
    { name, min = 1, max = Number.MAX_SAFE_INTEGER },
) {
    const normalized = value === undefined || value === "" ? fallback : Number(value);
    if (!Number.isInteger(normalized) || normalized < min || normalized > max) {
        throw new Error(`${name} deve ser um inteiro entre ${min} e ${max}`);
    }
    return normalized;
}

/**
 * Garante que a configuração de teste não aponta para produção.
 *
 * @function assertTestEnvironmentIsIsolated
 * @param {{ nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined> }} options - Configuração a validar.
 * @returns {{ nodeEnv: string, mongoDatabaseName: string, unsafeSecretNames: string[] }} Resumo seguro para evidence.
 * @throws {Error} Quando o ambiente de teste não está isolado.
 */
export function assertTestEnvironmentIsIsolated(options = {}) {
    const nodeEnv =
        options.nodeEnv ?? process.env.NODE_ENV ?? ENVIRONMENT_NAMES.DEVELOPMENT;
    const mongoUri =
        options.mongoUri ?? process.env.MONGODB_URI ?? DEFAULT_TEST_MONGO_URI;

    if (nodeEnv !== ENVIRONMENT_NAMES.TEST) {
        throw new Error("NODE_ENV=test é obrigatório para executar testes automatizados");
    }

    if (isProductionLikeMongoUri(mongoUri)) {
        throw new Error(
            "MONGODB_URI de teste deve apontar para uma base isolada com sufixo _test ou -test",
        );
    }

    const unsafeSecretNames = getUnsafeTestSecretNames(options.source ?? process.env);

    if (unsafeSecretNames.length > 0) {
        throw new Error(
            `Credenciais reais não são permitidas em testes: ${unsafeSecretNames.join(", ")}`,
        );
    }

    return {
        nodeEnv,
        mongoDatabaseName: getMongoDatabaseName(mongoUri),
        unsafeSecretNames,
    };
}

/**
 * Variaveis de ambiente normalizadas usadas pelo backend.
 *
 * @type {{
 *   nodeEnv: string,
 *   port: number,
 *   mongoUri: string,
 *   clientOrigin: string,
 *   clientOrigins: string[],
 *   sessionSecret: string,
 *   sessionTtl: string,
 *   dataEncryptionKey: string|undefined,
 *   forceHttps: boolean,
 *   localRuntime: boolean,
 *   e2eIsolated: boolean,
 *   trustedProxyCidrs: string[],
 *   openAiApiKey: string|undefined,
 *   openAiAnalysisModel: string,
 *   openAiFallbackModel: string,
 *   openAiImageModel: string,
 *   openAiImagePromptVersion: string,
 *   openAiImageSchemaVersion: string,
 *   openAiNoticeVersion: string,
 *   openAiPromptVersion: string,
 *   openAiSchemaVersion: string,
 *   openAiQuestionTimeoutMs: number,
 *   openAiAnalysisTimeoutMs: number,
 *   openAiReportTimeoutMs: number,
 *   openAiImageTimeoutMs: number
 * }}
 */
export const env = {
    nodeEnv: configuredNodeEnv,
    port: parseRuntimePort(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? defaultMongoUri,
    clientOrigin: configuredClientOrigin,
    clientOrigins: parseClientOrigins(
        configuredClientOrigins,
        configuredNodeEnv,
    ),
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
    forceHttps:
        process.env.FORCE_HTTPS === "true" ||
        process.env.NODE_ENV === ENVIRONMENT_NAMES.PRODUCTION,
    localRuntime:
        configuredNodeEnv === ENVIRONMENT_NAMES.DEVELOPMENT &&
        process.env.ORELLE_LOCAL_RUNTIME === "true",
    e2eIsolated:
        configuredNodeEnv === ENVIRONMENT_NAMES.TEST &&
        process.env.ORELLE_E2E_ISOLATED === "true",
    trustedProxyCidrs: parseTrustedProxyCidrs(
        process.env.TRUSTED_PROXY_CIDRS,
    ),
    openAiApiKey: readOptionalEnvValue(process.env.OPENAI_API_KEY),
    openAiAnalysisModel:
        readOptionalEnvValue(process.env.OPENAI_ANALYSIS_MODEL) ??
        DEFAULT_OPENAI_ANALYSIS_MODEL,
    openAiFallbackModel:
        readOptionalEnvValue(process.env.OPENAI_FALLBACK_MODEL) ??
        DEFAULT_OPENAI_FALLBACK_MODEL,
    openAiImageModel:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_MODEL) ??
        DEFAULT_OPENAI_IMAGE_MODEL,
    openAiImagePromptVersion:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_PROMPT_VERSION) ??
        DEFAULT_OPENAI_IMAGE_PROMPT_VERSION,
    openAiImageSchemaVersion:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_SCHEMA_VERSION) ??
        DEFAULT_OPENAI_IMAGE_SCHEMA_VERSION,
    openAiReportPromptVersion:
        readOptionalEnvValue(process.env.OPENAI_REPORT_PROMPT_VERSION) ??
        DEFAULT_OPENAI_REPORT_PROMPT_VERSION,
    openAiReportSchemaVersion:
        readOptionalEnvValue(process.env.OPENAI_REPORT_SCHEMA_VERSION) ??
        DEFAULT_OPENAI_REPORT_SCHEMA_VERSION,
    openAiImageQuality: parseOpenAiImageQuality(
        process.env.OPENAI_IMAGE_QUALITY,
    ),
    openAiNoticeVersion:
        readOptionalEnvValue(process.env.OPENAI_NOTICE_VERSION) ??
        DEFAULT_OPENAI_NOTICE_VERSION,
    openAiPromptVersion:
        readOptionalEnvValue(process.env.OPENAI_PROMPT_VERSION) ??
        DEFAULT_OPENAI_PROMPT_VERSION,
    openAiSchemaVersion:
        readOptionalEnvValue(process.env.OPENAI_SCHEMA_VERSION) ??
        DEFAULT_OPENAI_SCHEMA_VERSION,
    openAiQuestionTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_QUESTION_TIMEOUT_MS,
        30_000,
        { name: "OPENAI_QUESTION_TIMEOUT_MS", min: 1_000, max: 120_000 },
    ),
    openAiAnalysisTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_ANALYSIS_TIMEOUT_MS,
        60_000,
        { name: "OPENAI_ANALYSIS_TIMEOUT_MS", min: 1_000, max: 180_000 },
    ),
    openAiReportTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_REPORT_TIMEOUT_MS,
        90_000,
        { name: "OPENAI_REPORT_TIMEOUT_MS", min: 1_000, max: 240_000 },
    ),
    openAiImageTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_IMAGE_TIMEOUT_MS,
        240_000,
        { name: "OPENAI_IMAGE_TIMEOUT_MS", min: 1_000, max: 300_000 },
    ),
    openAiTestFixtureMode:
        configuredNodeEnv === ENVIRONMENT_NAMES.TEST &&
        process.env.OPENAI_TEST_FIXTURE_MODE === "true",
};

/**
 * Recusa defaults de desenvolvimento em production e URIs Mongo malformadas.
 * O resumo devolvido nunca contém URI, origin ou segredo.
 */
export function assertRuntimeConfiguration(
    config = env,
    source = process.env,
) {
    const mongoUri = String(config.mongoUri ?? "").trim();
    if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri) || !getMongoDatabaseName(mongoUri)) {
        throw new Error("MONGODB_URI deve incluir protocolo MongoDB e nome da base");
    }

    if (config.nodeEnv === ENVIRONMENT_NAMES.PRODUCTION) {
        if (!String(source.MONGODB_URI ?? "").trim()) {
            throw new Error("MONGODB_URI explícita é obrigatória em production");
        }
        if (String(config.dataEncryptionKey ?? "").trim().length < 32) {
            throw new Error("DATA_ENCRYPTION_KEY forte é obrigatória em production");
        }
        if (!config.forceHttps) {
            throw new Error("FORCE_HTTPS é obrigatório em production");
        }
    }

    return {
        nodeEnv: config.nodeEnv,
        port: parseRuntimePort(config.port),
        databaseConfigured: true,
        originCount: config.clientOrigins.length,
    };
}

/**
 * Descreve a disponibilidade OpenAI sem impedir o arranque da aplicação.
 *
 * @function assertAiProviderConfiguration
 * @param {typeof env} [config=env] - Configuracao normalizada ou clone de teste.
 * @returns {{provider: "openai", providerConfigured: boolean, reason: "AI_NOT_CONFIGURED"|null}} Resumo sem segredos.
 */
export function assertAiProviderConfiguration(config = env) {
    const providerConfigured = Boolean(
        config.openAiApiKey &&
        config.openAiAnalysisModel &&
        config.openAiFallbackModel &&
        config.openAiNoticeVersion,
    );

    return {
        provider: "openai",
        providerConfigured,
        reason: providerConfigured ? null : "AI_NOT_CONFIGURED",
    };
}

// Em producao, uma sessao assinada com o segredo de desenvolvimento seria uma
// falha grave. Por isso, a aplicacao bloqueia logo no arranque.
if (
    env.nodeEnv === ENVIRONMENT_NAMES.PRODUCTION &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatorio em producao");
}

assertAiProviderConfiguration(env);
assertRuntimeConfiguration(env);

// Em teste, a API falha cedo se alguém tentar usar dados reais ou credenciais
// publicadas. Assim a suite valida RNF22 antes de qualquer ligação MongoDB.
if (env.nodeEnv === ENVIRONMENT_NAMES.TEST) {
    assertTestEnvironmentIsIsolated({
        nodeEnv: env.nodeEnv,
        mongoUri: env.mongoUri,
        source: process.env,
    });
}
