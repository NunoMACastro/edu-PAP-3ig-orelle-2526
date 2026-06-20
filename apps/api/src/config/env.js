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
 * Variaveis de ambiente normalizadas usadas pelo backend.
 *
 * @type {{
 *   nodeEnv: string,
 *   port: number,
 *   mongoUri: string,
 *   clientOrigin: string,
 *   sessionSecret: string,
 *   sessionTtl: string,
 *   stripeSecretKey: string|undefined
 * }}
 */
export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
};

// Em producao, uma sessao assinada com o segredo de desenvolvimento seria uma
// falha grave. Por isso, a aplicacao bloqueia logo no arranque.
if (
    env.nodeEnv === "production" &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatorio em producao");
}
