/**
 * Configuracao central da API Orélle.
 *
 * Este ficheiro existe desde o BK-MF0-01 e foi estendido no BK-MF0-02 para
 * incluir os parametros da sessao HttpOnly. A regra pedagogica aqui e simples:
 * o resto da aplicacao importa `env` e nao lê `process.env` diretamente.
 */
import "dotenv/config";

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
    env.sessionSecret === "dev-only-change-me"
) {
    throw new Error("SESSION_SECRET obrigatorio em producao");
}
