/**
 * Infraestrutura efémera e isolada para o desenvolvimento local da Orélle.
 *
 * Este módulo não importa a aplicação nem `dotenv`. O chamador instala primeiro
 * um ambiente allowlist-only, arranca um replica set em loopback e só depois
 * pode carregar `env.js`/Mongoose. Assim, variáveis remotas herdadas e o `.env`
 * existente nunca participam no comando `dev:local`.
 */
import { randomBytes } from "node:crypto";
import { createServer as createNetServer } from "node:net";

export const LOCAL_DEV_HOST = "127.0.0.1";
export const LOCAL_DEV_DATABASE_NAME = "orelle_local_dev";
export const LOCAL_DEV_REPLICA_SET_NAME = "orelle-local-rs";

const SAFE_INHERITED_ENVIRONMENT_KEYS = Object.freeze([
    "PATH",
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TERM",
    "COLORTERM",
    "NO_COLOR",
    "FORCE_COLOR",
    "npm_config_cache",
    "MONGOMS_DOWNLOAD_DIR",
    "MONGOMS_VERSION",
]);

/**
 * Cria um segredo efémero sem reutilizar credenciais do shell ou do `.env`.
 *
 * @param {string} purpose - Domínio funcional do segredo.
 * @param {(size: number) => Buffer} [randomBytesFn=randomBytes] - Fonte de entropia injetável.
 * @returns {string} Segredo local não destinado a logs.
 */
function createLocalSecret(purpose, randomBytesFn = randomBytes) {
    return `local-${purpose}-${randomBytesFn(32).toString("hex")}`;
}

/**
 * Constrói o ambiente completo permitido no runtime académico local.
 *
 * `MONGODB_URI`, providers, tokens npm e segredos herdados não entram no mapa.
 * A URI Mongo só é acrescentada pelo orquestrador depois de ser devolvida e
 * validada pelo `MongoMemoryReplSet` dedicado.
 *
 * @param {object} [options] - Fontes controladas para runtime/teste.
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [options.source] - Ambiente original.
 * @param {Record<string, string|number|boolean|undefined>} [options.overrides] - Overrides locais explícitos.
 * @param {(size: number) => Buffer} [options.randomBytesFn] - Entropia injetável.
 * @returns {NodeJS.ProcessEnv} Ambiente allowlist-only.
 */
export function buildScrubbedLocalEnvironment({
    source = process.env,
    overrides = {},
    randomBytesFn = randomBytes,
} = {}) {
    const environment = {};

    for (const key of SAFE_INHERITED_ENVIRONMENT_KEYS) {
        const value = source[key];
        if (typeof value === "string" && value) environment[key] = value;
    }

    Object.assign(environment, {
        DOTENV_CONFIG_PATH: "/dev/null",
        NODE_ENV: "development",
        ORELLE_LOCAL_RUNTIME: "true",
        SESSION_SECRET: createLocalSecret("session", randomBytesFn),
        DATA_ENCRYPTION_KEY: createLocalSecret("data", randomBytesFn),
        CLIENT_ORIGIN: "http://127.0.0.1:5173",
        CLIENT_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
        PORT: String(source.ORELLE_LOCAL_PORT ?? 3001),
        FORCE_HTTPS: "false",
        TRUSTED_PROXY_CIDRS: "",
        npm_config_update_notifier: "false",
        npm_config_fund: "false",
        npm_config_userconfig: "/dev/null",
    });

    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) environment[key] = String(value);
    }

    return environment;
}

/**
 * Substitui integralmente `process.env` e devolve um restore idempotente.
 *
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} nextEnvironment - Ambiente scrubbed.
 * @returns {() => void} Restaurador do ambiente anterior.
 */
export function installLocalProcessEnvironment(nextEnvironment) {
    const previousEnvironment = { ...process.env };
    let restored = false;

    for (const key of Object.keys(process.env)) delete process.env[key];
    for (const [key, value] of Object.entries(nextEnvironment)) {
        if (value !== undefined) process.env[key] = String(value);
    }

    return () => {
        if (restored) return;
        restored = true;
        for (const key of Object.keys(process.env)) delete process.env[key];
        Object.assign(process.env, previousEnvironment);
    };
}

/**
 * Valida estritamente a URI produzida pelo replica set local.
 *
 * @param {unknown} rawUri - URI candidata.
 * @returns {{uri: string, databaseName: string, replicaSet: string}} Contrato sanitizado.
 * @throws {Error} Para SRV, credenciais, host remoto, base errada ou standalone.
 */
export function assertStrictLocalMongoUri(rawUri) {
    const uri = String(rawUri ?? "").trim();

    if (!uri.startsWith("mongodb://") || uri.includes("@")) {
        throw new Error("Desenvolvimento local exige MongoDB loopback sem credenciais");
    }

    let parsed;
    try {
        parsed = new URL(uri);
    } catch {
        throw new Error("URI MongoDB local inválida");
    }

    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const replicaSet = parsed.searchParams.get("replicaSet") ?? "";
    const unexpectedQueryKeys = [...parsed.searchParams.keys()].filter(
        (key) => key !== "replicaSet",
    );

    if (parsed.hostname !== LOCAL_DEV_HOST) {
        throw new Error("MongoDB local só pode escutar em 127.0.0.1");
    }
    if (
        !/^\d{1,5}$/.test(parsed.port) ||
        Number(parsed.port) < 1 ||
        Number(parsed.port) > 65_535
    ) {
        throw new Error("MongoDB local exige porta efémera explícita");
    }
    if (databaseName !== LOCAL_DEV_DATABASE_NAME) {
        throw new Error(`MongoDB local deve usar exatamente ${LOCAL_DEV_DATABASE_NAME}`);
    }
    if (replicaSet !== LOCAL_DEV_REPLICA_SET_NAME) {
        throw new Error("MongoDB local exige o replica set efémero dedicado");
    }
    if (
        parsed.username ||
        parsed.password ||
        parsed.hash ||
        unexpectedQueryKeys.length > 0
    ) {
        throw new Error("URI MongoDB local contém componentes não permitidos");
    }

    return { uri, databaseName, replicaSet };
}

/**
 * Reserva uma porta TCP efémera exclusivamente em loopback.
 *
 * @returns {Promise<number>} Porta atribuída pelo sistema operativo.
 */
export async function reserveLocalLoopbackPort() {
    const server = createNetServer();

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(
            { host: LOCAL_DEV_HOST, port: 0, exclusive: true },
            resolve,
        );
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
    );

    if (!Number.isInteger(port) || port < 1) {
        throw new Error("Não foi possível reservar uma porta MongoDB local");
    }

    return port;
}

/**
 * Inicia um replica set efémero de um nó, limitado a 127.0.0.1.
 *
 * @returns {Promise<{replSet: import("mongodb-memory-server").MongoMemoryReplSet, mongo: {uri: string, databaseName: string, replicaSet: string}}>} Runtime validado.
 */
export async function startLocalReplicaSet() {
    const port = await reserveLocalLoopbackPort();
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const replSet = await MongoMemoryReplSet.create({
        instanceOpts: [{ ip: LOCAL_DEV_HOST, port }],
        replSet: {
            count: 1,
            dbName: LOCAL_DEV_DATABASE_NAME,
            ip: LOCAL_DEV_HOST,
            name: LOCAL_DEV_REPLICA_SET_NAME,
            storageEngine: "wiredTiger",
        },
    });

    try {
        const mongo = assertStrictLocalMongoUri(
            replSet.getUri(LOCAL_DEV_DATABASE_NAME, LOCAL_DEV_HOST),
        );
        return { replSet, mongo };
    } catch (error) {
        await replSet.stop().catch(() => undefined);
        throw error;
    }
}
