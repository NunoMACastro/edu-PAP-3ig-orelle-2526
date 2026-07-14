/**
 * Contratos puros do runtime académico local isolado.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
    LOCAL_DEV_DATABASE_NAME,
    LOCAL_DEV_REPLICA_SET_NAME,
    assertStrictLocalMongoUri,
    buildScrubbedLocalEnvironment,
} from "../scripts/local-dev-runtime.core.mjs";
import {
    getMongoTopologyType,
    isTransactionalMongoReady,
} from "../src/config/db.js";
import {
    resolveLocalBackupConfiguration,
    resolveLocalOpenAiConfiguration,
    resolveLocalRuntimeMode,
    startLocalBackupRuntime,
} from "../scripts/run-local-dev.mjs";

const VALID_LOCAL_URI =
    `mongodb://127.0.0.1:43127/${LOCAL_DEV_DATABASE_NAME}` +
    `?replicaSet=${LOCAL_DEV_REPLICA_SET_NAME}`;

/**
 * Cria uma ligação mínima com a topologia indicada.
 *
 * @param {string} type - Tipo de topologia do driver MongoDB.
 * @param {number} [readyState=1] - Estado Mongoose simulado.
 * @returns {object} Ligação reduzida.
 */
function connectionWithTopology(type, readyState = 1) {
    return {
        readyState,
        client: { topology: { description: { type } } },
    };
}

describe("runtime académico local isolado", () => {
    it("descarta Mongo, dotenv, providers e segredos herdados", () => {
        const environment = buildScrubbedLocalEnvironment({
            source: {
                PATH: "/usr/bin",
                HOME: "/tmp/local-home",
                MONGODB_URI: "mongodb+srv://user:secret@remote.example/orelle",
                DOTENV_CONFIG_PATH: "/private/project/.env",
                OPENAI_API_KEY: "remote-openai-key",
                SESSION_SECRET: "remote-session-secret",
                DATA_ENCRYPTION_KEY: "remote-data-secret",
                NODE_AUTH_TOKEN: "remote-npm-token",
                ORELLE_LOCAL_PORT: "43210",
            },
            randomBytesFn: () => Buffer.alloc(32, 7),
        });

        expect(environment).toMatchObject({
            PATH: "/usr/bin",
            HOME: "/tmp/local-home",
            DOTENV_CONFIG_PATH: "/dev/null",
            NODE_ENV: "development",
            ORELLE_LOCAL_RUNTIME: "true",
            PORT: "43210",
            FORCE_HTTPS: "false",
        });
        expect(environment.MONGODB_URI).toBeUndefined();
        expect(environment.OPENAI_API_KEY).toBeUndefined();
        expect(environment.NODE_AUTH_TOKEN).toBeUndefined();
        expect(environment.SESSION_SECRET).toMatch(/^local-session-/);
        expect(environment.DATA_ENCRYPTION_KEY).toMatch(/^local-data-/);
        expect(environment.SESSION_SECRET).not.toContain("remote");
    });

    it("só preserva configuração OpenAI mediante opt-in explícito", () => {
        expect(
            resolveLocalOpenAiConfiguration({
                OPENAI_API_KEY: "sk-deve-ser-descartada",
            }),
        ).toEqual({ enabled: false, environment: {} });
        expect(() =>
            resolveLocalOpenAiConfiguration({
                ORELLE_LOCAL_OPENAI_ENABLED: "yes",
            }),
        ).toThrow("aceita apenas true ou false");
        expect(() =>
            resolveLocalOpenAiConfiguration({
                ORELLE_LOCAL_OPENAI_ENABLED: "true",
            }),
        ).toThrow("exige OPENAI_API_KEY");

        const configuration = resolveLocalOpenAiConfiguration({
            ORELLE_LOCAL_OPENAI_ENABLED: "true",
            OPENAI_API_KEY: "sk-local-explicit",
            OPENAI_ANALYSIS_MODEL: "gpt-analysis-local",
            OPENAI_NOTICE_VERSION: "notice-local-v2",
            OPENAI_ANALYSIS_TIMEOUT_MS: "45000",
            OPENAI_TEST_FIXTURE_MODE: "true",
            MONGODB_URI: "mongodb+srv://remote.example/orelle",
            DOTENV_CONFIG_PATH: "/private/project/.env",
        });
        expect(configuration).toEqual({
            enabled: true,
            environment: {
                OPENAI_API_KEY: "sk-local-explicit",
                OPENAI_ANALYSIS_MODEL: "gpt-analysis-local",
                OPENAI_NOTICE_VERSION: "notice-local-v2",
                OPENAI_ANALYSIS_TIMEOUT_MS: "45000",
            },
        });

        const environment = buildScrubbedLocalEnvironment({
            source: { PATH: "/usr/bin" },
            overrides: configuration.environment,
            randomBytesFn: () => Buffer.alloc(32, 3),
        });
        expect(environment.OPENAI_API_KEY).toBe("sk-local-explicit");
        expect(environment.DATA_ENCRYPTION_KEY).toMatch(/^local-data-/);
        expect(environment.OPENAI_TEST_FIXTURE_MODE).toBeUndefined();
        expect(environment.MONGODB_URI).toBeUndefined();
        expect(environment.DOTENV_CONFIG_PATH).toBe("/dev/null");
    });

    it("aceita apenas a URI exata do replica set efémero loopback", () => {
        expect(assertStrictLocalMongoUri(VALID_LOCAL_URI)).toEqual({
            uri: VALID_LOCAL_URI,
            databaseName: LOCAL_DEV_DATABASE_NAME,
            replicaSet: LOCAL_DEV_REPLICA_SET_NAME,
        });

        for (const invalidUri of [
            `mongodb://localhost:43127/${LOCAL_DEV_DATABASE_NAME}?replicaSet=${LOCAL_DEV_REPLICA_SET_NAME}`,
            `mongodb://127.0.0.1:43127/${LOCAL_DEV_DATABASE_NAME}`,
            `mongodb://127.0.0.1:43127/orelle?replicaSet=${LOCAL_DEV_REPLICA_SET_NAME}`,
            `mongodb://user:secret@127.0.0.1:43127/${LOCAL_DEV_DATABASE_NAME}?replicaSet=${LOCAL_DEV_REPLICA_SET_NAME}`,
            `mongodb://127.0.0.1:43127/${LOCAL_DEV_DATABASE_NAME}?replicaSet=${LOCAL_DEV_REPLICA_SET_NAME}&directConnection=true`,
            `mongodb+srv://remote.example/${LOCAL_DEV_DATABASE_NAME}`,
        ]) {
            expect(() => assertStrictLocalMongoUri(invalidUri)).toThrow();
        }
    });

    it("readiness exige ligação com primary e topologia transacional", () => {
        expect(
            isTransactionalMongoReady(
                connectionWithTopology("ReplicaSetWithPrimary"),
            ),
        ).toBe(true);
        expect(
            isTransactionalMongoReady(connectionWithTopology("Sharded")),
        ).toBe(true);
        expect(
            isTransactionalMongoReady(connectionWithTopology("LoadBalanced")),
        ).toBe(true);

        for (const type of [
            "Single",
            "Unknown",
            "ReplicaSetNoPrimary",
            "",
        ]) {
            const connection = connectionWithTopology(type);
            expect(getMongoTopologyType(connection)).toBe(type);
            expect(isTransactionalMongoReady(connection)).toBe(false);
        }
        expect(
            isTransactionalMongoReady(
                connectionWithTopology("ReplicaSetWithPrimary", 0),
            ),
        ).toBe(false);
    });

    it("publica dev e dev:local apenas através do orquestrador scrubbed", async () => {
        const [
            packageJson,
            envSource,
            runnerSource,
            seedSource,
            clientSeedSource,
            localEnvironmentExample,
        ] = await Promise.all([
            readFile(new URL("../package.json", import.meta.url), "utf8").then(
                JSON.parse,
            ),
            readFile(new URL("../src/config/env.js", import.meta.url), "utf8"),
            readFile(
                new URL("../scripts/run-local-dev.mjs", import.meta.url),
                "utf8",
            ),
            readFile(
                new URL("../src/scripts/seed-local.js", import.meta.url),
                "utf8",
            ),
            readFile(
                new URL("../src/scripts/seed-client-data.js", import.meta.url),
                "utf8",
            ),
            readFile(
                new URL("../.env.local.example", import.meta.url),
                "utf8",
            ),
        ]);

        expect(packageJson.scripts.dev).toBe(
            "node --env-file-if-exists=.env.local --watch scripts/run-local-dev.mjs --runtime-mode=dev",
        );
        expect(packageJson.scripts["dev:local"]).toBe(
            "node --env-file-if-exists=.env.local scripts/run-local-dev.mjs --runtime-mode=dev:local",
        );
        expect(packageJson.scripts.dev).not.toContain("src/server.js");
        expect(localEnvironmentExample).toContain(
            "ORELLE_LOCAL_OPENAI_ENABLED=false",
        );
        expect(localEnvironmentExample).toContain("OPENAI_API_KEY=");
        expect(localEnvironmentExample).not.toMatch(/OPENAI_API_KEY=\S+/);
        expect(envSource).not.toContain('import "dotenv/config"');
        expect(runnerSource).toContain(
            "backupScheduler = startLocalBackupRuntime",
        );
        expect(runnerSource).toContain("await backupScheduler?.stop?.()");
        expect(runnerSource).toContain("clientSeedModule.seedLocalData()");
        expect(runnerSource).toContain("cleanupDemoClientSeedFiles");
        expect(runnerSource).toContain("resolveLocalOpenAiConfiguration");
        expect(seedSource).toContain("seedDemoUsers()");
        expect(seedSource).toContain("seedInitialCategories()");
        expect(seedSource).toContain("seedCatalogProducts()");
        expect(seedSource).toContain("seedDemoClientData()");
        expect(seedSource).not.toContain("deleteMany");
        expect(clientSeedSource).toContain("$setOnInsert");
        expect(clientSeedSource).toContain("saveFacePhotos");
        expect(clientSeedSource).not.toContain("deleteMany");
    });

    it("mantém o scheduler inativo sem opt-in e recusa configuração ambígua", () => {
        expect(
            resolveLocalBackupConfiguration({
                ORELLE_BACKUP_KEY: "chave-herdada-inválida",
            }),
        ).toEqual({
            enabled: false,
            encryptionKey: null,
            backupRoot: null,
        });
        expect(() =>
            resolveLocalBackupConfiguration({
                ORELLE_LOCAL_BACKUP_ENABLED: "yes",
            }),
        ).toThrow("aceita apenas true ou false");
        expect(() =>
            resolveLocalBackupConfiguration({
                ORELLE_LOCAL_BACKUP_ENABLED: "true",
            }),
        ).toThrow("ORELLE_BACKUP_KEY");
        expect(
            resolveLocalBackupConfiguration(
                {
                    ORELLE_LOCAL_BACKUP_ENABLED: "true",
                    ORELLE_BACKUP_KEY: "não-deve-ser-lida-em-dev",
                },
                "dev",
            ),
        ).toEqual({
            enabled: false,
            encryptionKey: null,
            backupRoot: null,
        });
        expect(resolveLocalRuntimeMode(["--runtime-mode=dev"])).toBe("dev");
        expect(resolveLocalRuntimeMode(["--runtime-mode=dev:local"])).toBe(
            "dev:local",
        );
        expect(() => resolveLocalRuntimeMode([])).toThrow(
            "--runtime-mode=dev|dev:local",
        );
    });

    it("não ativa backup sob npm run dev mesmo com o opt-in presente", () => {
        const setIntervalFn = vi.fn();
        const scheduler = startLocalBackupRuntime({
            db: { databaseName: LOCAL_DEV_DATABASE_NAME },
            runtimeMode: "dev",
            source: {
                ORELLE_LOCAL_BACKUP_ENABLED: "true",
                ORELLE_BACKUP_KEY: "não-deve-ser-lida-em-dev",
            },
            setIntervalFn,
        });

        expect(scheduler).toEqual({ started: false, timer: null });
        expect(setIntervalFn).not.toHaveBeenCalled();
    });

    it("liga snapshot recuperável e retenção ao intervalo local", async () => {
        let scheduledJob;
        const timer = { unref: vi.fn() };
        const setIntervalFn = vi.fn((callback) => {
            scheduledJob = callback;
            return timer;
        });
        const clearIntervalFn = vi.fn();
        const createSnapshotFn = vi.fn().mockResolvedValue({
            snapshotId: "orelle-snapshot-20260710T220000000Z",
            collections: [{ name: "users" }],
        });
        const pruneSnapshotsFn = vi.fn().mockResolvedValue({
            kept: ["orelle-snapshot-20260710T220000000Z"],
            pruned: [],
        });
        const db = { databaseName: LOCAL_DEV_DATABASE_NAME };
        const scheduler = startLocalBackupRuntime({
            db,
            runtimeMode: "dev:local",
            source: {
                ORELLE_LOCAL_BACKUP_ENABLED: "true",
                ORELLE_BACKUP_KEY: "ab".repeat(32),
                ORELLE_BACKUP_ROOT:
                    "storage/private/backups-scheduler-runtime-test",
            },
            setIntervalFn,
            clearIntervalFn,
            createSnapshotFn,
            pruneSnapshotsFn,
        });

        expect(scheduler.started).toBe(true);
        await scheduledJob();
        expect(createSnapshotFn).toHaveBeenCalledWith({
            db,
            backupRoot: expect.stringContaining(
                "storage/private/backups-scheduler-runtime-test",
            ),
            encryptionKey: expect.any(Buffer),
        });
        expect(pruneSnapshotsFn).toHaveBeenCalledWith({
            backupRoot: expect.stringContaining(
                "storage/private/backups-scheduler-runtime-test",
            ),
            keep: 7,
        });
        await scheduler.stop();
        expect(clearIntervalFn).toHaveBeenCalledWith(timer);
    });
});
