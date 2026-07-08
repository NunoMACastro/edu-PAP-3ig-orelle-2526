/**
 * Configuracao central da API Orélle.
 *
 * Este ficheiro existe desde o BK-MF0-01 e foi estendido no BK-MF0-02 para
 * incluir os parametros da sessao HttpOnly. A regra pedagogica aqui e simples:
 * o resto da aplicacao importa `env` e nao lê `process.env` diretamente.
 */
import "dotenv/config";

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
const AI_PROVIDER_MODES = new Set(["local", "external", "openai"]);
const DEFAULT_AI_PROVIDER_MODEL = "gpt-4.1";

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
function parseClientOrigins(rawValue) {
    return rawValue
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const configuredClientOrigin =
    process.env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN;
const configuredClientOrigins =
    process.env.CLIENT_ORIGINS ??
    (process.env.CLIENT_ORIGIN
        ? configuredClientOrigin
        : DEFAULT_CLIENT_ORIGINS.join(","));

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
 * Normaliza o modo do provider de IA para valores suportados pela API.
 *
 * @function parseAiProviderMode
 * @param {string|undefined} value - Valor cru de AI_PROVIDER_MODE.
 * @returns {"local"|"external"|"openai"} Modo suportado ou local seguro.
 */
function parseAiProviderMode(value) {
    return AI_PROVIDER_MODES.has(value) ? value : "local";
}

/**
 * Lê uma variável opcional tratando strings vazias como ausência de valor.
 *
 * @function readOptionalEnvValue
 * @param {string|undefined} value - Valor cru de ambiente.
 * @returns {string|undefined} Valor limpo ou undefined.
 */
function readOptionalEnvValue(value) {
    const normalizedValue = String(value ?? "").trim();

    return normalizedValue || undefined;
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
 *   stripeSecretKey: string|undefined,
 *   dataEncryptionKey: string|undefined,
 *   forceHttps: boolean,
 *   aiProviderMode: "local"|"external"|"openai",
 *   aiProviderUrl: string|undefined,
 *   aiProviderKey: string|undefined,
 *   openAiApiKey: string|undefined,
 *   aiProviderModel: string
 * }}
 */
export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: configuredClientOrigin,
    clientOrigins: parseClientOrigins(configuredClientOrigins),
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
    forceHttps:
        process.env.FORCE_HTTPS === "true" ||
        process.env.NODE_ENV === "production",
    // O modo local é o padrão seguro: nenhuma fotografia sai para provider externo sem configuração explícita.
    aiProviderMode: parseAiProviderMode(process.env.AI_PROVIDER_MODE),
    aiProviderUrl: process.env.AI_PROVIDER_URL,
    aiProviderKey: process.env.AI_PROVIDER_KEY,
    openAiApiKey:
        readOptionalEnvValue(process.env.OPENAI_API_KEY) ??
        readOptionalEnvValue(process.env.AI_PROVIDER_KEY),
    aiProviderModel:
        readOptionalEnvValue(process.env.AI_PROVIDER_MODEL) ??
        DEFAULT_AI_PROVIDER_MODEL,
};

// Em producao, uma sessao assinada com o segredo de desenvolvimento seria uma
// falha grave. Por isso, a aplicacao bloqueia logo no arranque.
if (
    env.nodeEnv === "production" &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatorio em producao");
}
