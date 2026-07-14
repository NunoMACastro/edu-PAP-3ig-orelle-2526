/**
 * Orquestrador da API Orélle para desenvolvimento académico local.
 *
 * O processo descarta o ambiente aplicacional herdado, nunca carrega `.env`
 * e aceita de `.env.local` apenas a configuração OpenAI explicitamente
 * allowlisted. Depois inicia um `MongoMemoryReplSet`, aplica migrações e abre
 * a API em loopback. O teardown encerra HTTP, Mongoose e MongoDB mesmo perante
 * sinal.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    buildScrubbedLocalEnvironment,
    installLocalProcessEnvironment,
    startLocalReplicaSet,
} from "./local-dev-runtime.core.mjs";
import {
    createBackupSnapshot,
    parseBackupEncryptionKey,
    pruneBackupSnapshots,
    resolveBackupRoot,
} from "./backup-local.core.mjs";
import { startLocalBackupScheduler } from "./backup-scheduler.mjs";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const LOCAL_OPENAI_ENVIRONMENT_KEYS = Object.freeze([
    "OPENAI_ANALYSIS_MODEL",
    "OPENAI_FALLBACK_MODEL",
    "OPENAI_IMAGE_MODEL",
    "OPENAI_NOTICE_VERSION",
    "OPENAI_PROMPT_VERSION",
    "OPENAI_SCHEMA_VERSION",
    "OPENAI_IMAGE_PROMPT_VERSION",
    "OPENAI_IMAGE_SCHEMA_VERSION",
    "OPENAI_IMAGE_QUALITY",
    "OPENAI_QUESTION_TIMEOUT_MS",
    "OPENAI_ANALYSIS_TIMEOUT_MS",
    "OPENAI_REPORT_TIMEOUT_MS",
    "OPENAI_IMAGE_TIMEOUT_MS",
]);

/**
 * Remove URIs e sequências potencialmente sensíveis de mensagens operacionais.
 *
 * @param {unknown} error - Falha de startup/teardown.
 * @returns {string} Mensagem adequada ao terminal local.
 */
export function sanitizeLocalRuntimeError(error) {
    return String(error?.message ?? "falha desconhecida")
        .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, "[mongodb-uri-redacted]")
        .replace(/(?:local|test)-(?:session|data)-[a-f0-9]{64}/gi, "[secret-redacted]");
}

/**
 * Resolve o opt-in de backup antes de o ambiente herdado ser descartado.
 *
 * A chave só é lida quando o flag é exatamente `true`, é validada em memória
 * e nunca é copiada para o novo `process.env` ou para resultados públicos.
 *
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [source=process.env] - Ambiente original.
 * @returns {{enabled: false, encryptionKey: null, backupRoot: null}|{enabled: true, encryptionKey: Buffer, backupRoot: string}} Configuração local validada.
 */
export function resolveLocalBackupConfiguration(
    source = process.env,
    runtimeMode = "dev:local",
) {
    if (runtimeMode !== "dev:local") {
        return { enabled: false, encryptionKey: null, backupRoot: null };
    }

    const enabledValue = String(
        source.ORELLE_LOCAL_BACKUP_ENABLED ?? "",
    ).trim();

    if (!["", "false", "true"].includes(enabledValue)) {
        throw new Error(
            "ORELLE_LOCAL_BACKUP_ENABLED aceita apenas true ou false",
        );
    }
    if (enabledValue !== "true") {
        return { enabled: false, encryptionKey: null, backupRoot: null };
    }

    return {
        enabled: true,
        encryptionKey: parseBackupEncryptionKey(source.ORELLE_BACKUP_KEY),
        backupRoot: resolveBackupRoot(source.ORELLE_BACKUP_ROOT),
    };
}

/**
 * Resolve o opt-in explícito para usar a OpenAI real no runtime efémero.
 *
 * Por defeito nenhuma credencial herdada atravessa a fronteira. Quando o flag
 * é exatamente `true`, só a chave OpenAI e a respetiva allowlist de modelos,
 * versões e timeouts são copiadas. URI MongoDB, `.env`, fixture mode e outros
 * segredos continuam sempre excluídos.
 *
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [source=process.env] - Ambiente original.
 * @returns {{enabled: boolean, environment: Record<string, string>}} Overrides seguros para o ambiente scrubbed.
 */
export function resolveLocalOpenAiConfiguration(source = process.env) {
    const enabledValue = String(
        source.ORELLE_LOCAL_OPENAI_ENABLED ?? "",
    ).trim();

    if (!["", "false", "true"].includes(enabledValue)) {
        throw new Error(
            "ORELLE_LOCAL_OPENAI_ENABLED aceita apenas true ou false",
        );
    }
    if (enabledValue !== "true") {
        return { enabled: false, environment: {} };
    }

    const apiKey = String(source.OPENAI_API_KEY ?? "").trim();
    if (!apiKey) {
        throw new Error(
            "ORELLE_LOCAL_OPENAI_ENABLED=true exige OPENAI_API_KEY",
        );
    }

    const environment = { OPENAI_API_KEY: apiKey };
    for (const key of LOCAL_OPENAI_ENVIRONMENT_KEYS) {
        const value = String(source[key] ?? "").trim();
        if (value) environment[key] = value;
    }

    return { enabled: true, environment };
}

/**
 * Lê o modo explícito publicado pelo manifest, sem inferir pelo nome do script.
 *
 * @param {string[]} argv - Argumentos depois do path do runner.
 * @returns {"dev"|"dev:local"} Modo local permitido.
 */
export function resolveLocalRuntimeMode(argv) {
    const modes = argv
        .filter((value) => value.startsWith("--runtime-mode="))
        .map((value) => value.slice("--runtime-mode=".length));

    if (modes.length !== 1 || !["dev", "dev:local"].includes(modes[0])) {
        throw new Error("Runner local exige --runtime-mode=dev|dev:local");
    }
    return modes[0];
}

/**
 * Liga o snapshot recuperável ao scheduler do runtime `dev:local`.
 *
 * @param {{db: import("mongodb").Db, source?: NodeJS.ProcessEnv|Record<string, string|undefined>, setIntervalFn?: typeof setInterval, clearIntervalFn?: typeof clearInterval, createSnapshotFn?: typeof createBackupSnapshot, pruneSnapshotsFn?: typeof pruneBackupSnapshots, onError?: (error: unknown) => void}} options - Dependências explícitas e injetáveis.
 * @returns {ReturnType<typeof startLocalBackupScheduler>} Scheduler iniciado ou inativo.
 */
export function startLocalBackupRuntime({
    db,
    source = process.env,
    runtimeMode = "dev:local",
    setIntervalFn,
    clearIntervalFn,
    createSnapshotFn = createBackupSnapshot,
    pruneSnapshotsFn = pruneBackupSnapshots,
    onError,
}) {
    const configuration = resolveLocalBackupConfiguration(source, runtimeMode);

    return startLocalBackupScheduler({
        runtimeMode,
        enabled: configuration.enabled,
        setIntervalFn,
        clearIntervalFn,
        onError,
        runJob: async () => {
            const manifest = await createSnapshotFn({
                db,
                backupRoot: configuration.backupRoot,
                encryptionKey: configuration.encryptionKey,
            });
            const retention = await pruneSnapshotsFn({
                backupRoot: configuration.backupRoot,
                keep: 7,
            });

            return {
                snapshotId: manifest.snapshotId,
                collectionCount: manifest.collections.length,
                retainedSnapshots: retention.kept.length,
                prunedSnapshots: retention.pruned.length,
            };
        },
    });
}

/**
 * Arranca o runtime local completo e devolve um encerramento idempotente.
 *
 * @param {{runtimeMode?: "dev"|"dev:local", sourceEnvironment?: NodeJS.ProcessEnv|Record<string, string|undefined>, backupSchedulerOptions?: object}} [options] - Modo explícito, ambiente original e injeções de teste do scheduler.
 * @returns {Promise<{database: string, replicaSet: string, backupSchedulerStarted: boolean, stop: (signal?: string) => Promise<void>}>} Runtime sanitizado.
 */
export async function runLocalDevelopment({
    runtimeMode = "dev:local",
    sourceEnvironment = process.env,
    backupSchedulerOptions = {},
} = {}) {
    const inheritedEnvironment = { ...sourceEnvironment };
    const openAiConfiguration =
        resolveLocalOpenAiConfiguration(inheritedEnvironment);
    const restoreEnvironment = installLocalProcessEnvironment(
        buildScrubbedLocalEnvironment({
            source: inheritedEnvironment,
            overrides: openAiConfiguration.environment,
        }),
    );
    let replicaSetRuntime;
    let apiRuntime;
    let backupScheduler;
    let disconnectDatabase;
    let clientSeedModule;
    let seedSummary;
    let stopPromise;

    try {
        replicaSetRuntime = await startLocalReplicaSet();
        process.env.MONGODB_URI = replicaSetRuntime.mongo.uri;

        const [serverModule, databaseModule, migrationModule, loadedSeedModule] = await Promise.all([
            import("../src/server.js"),
            import("../src/config/db.js"),
            import("../src/migrations/migration-runner.js"),
            import("../src/scripts/seed-local.js"),
        ]);
        disconnectDatabase = databaseModule.disconnectDB;
        clientSeedModule = loadedSeedModule;

        apiRuntime = await serverModule.startServer({
            installSignalHandlers: false,
            connect: async () => {
                await databaseModule.connectDB();
                await migrationModule.runMigrations({
                    client: databaseModule.getDatabaseClient(),
                    db: databaseModule.getDatabase(),
                });
                seedSummary = await clientSeedModule.seedLocalData();
            },
            disconnect: databaseModule.disconnectDB,
        });
        backupScheduler = startLocalBackupRuntime({
            db: databaseModule.getDatabase(),
            source: inheritedEnvironment,
            runtimeMode,
            ...backupSchedulerOptions,
        });

        const stop = (signal = "manual") => {
            if (stopPromise) return stopPromise;

            stopPromise = (async () => {
                let shutdownError;

                try {
                    await backupScheduler?.stop?.();
                } catch (error) {
                    shutdownError = error;
                }

                try {
                    await apiRuntime?.shutdown(signal);
                } catch (error) {
                    shutdownError = error;
                }

                try {
                    await clientSeedModule?.cleanupDemoClientSeedFiles?.();
                } catch (error) {
                    shutdownError ??= error;
                }

                try {
                    await replicaSetRuntime?.replSet?.stop();
                } catch (error) {
                    shutdownError ??= error;
                } finally {
                    restoreEnvironment();
                }

                if (shutdownError) throw shutdownError;
            })();

            return stopPromise;
        };

        process.once("SIGTERM", () => void stop("SIGTERM").catch(() => {}));
        process.once("SIGINT", () => void stop("SIGINT").catch(() => {}));

        return {
            database: replicaSetRuntime.mongo.databaseName,
            replicaSet: replicaSetRuntime.mongo.replicaSet,
            backupSchedulerStarted: backupScheduler.started,
            openAiEnabled: openAiConfiguration.enabled,
            seeded: {
                users: seedSummary?.users?.length ?? 0,
                categories: seedSummary?.categories?.length ?? 0,
                products: seedSummary?.products?.length ?? 0,
                clientScenarios: seedSummary?.clientData?.scenarios ?? 0,
            },
            stop,
        };
    } catch (error) {
        await backupScheduler?.stop?.().catch(() => undefined);
        await apiRuntime?.shutdown("startup_error").catch(() => undefined);
        await disconnectDatabase?.().catch(() => undefined);
        await clientSeedModule?.cleanupDemoClientSeedFiles?.().catch(() => undefined);
        await replicaSetRuntime?.replSet?.stop().catch(() => undefined);
        restoreEnvironment();
        throw error;
    }
}

if (process.argv[1] === SCRIPT_FILE) {
    runLocalDevelopment({
        runtimeMode: resolveLocalRuntimeMode(process.argv.slice(2)),
    })
        .then(({ database, replicaSet, openAiEnabled, seeded }) => {
            console.log(
                `Orelle local pronta (${database}, replica set ${replicaSet}; ` +
                    `${seeded.users} utilizadores, ${seeded.categories} categorias, ` +
                    `${seeded.products} produtos, ${seeded.clientScenarios} cenários de cliente; ` +
                    `OpenAI ${openAiEnabled ? "ativa" : "degradada"})`,
            );
        })
        .catch((error) => {
            console.error(
                `Runtime local falhou: ${sanitizeLocalRuntimeError(error)}`,
            );
            process.exitCode = 1;
        });
}
