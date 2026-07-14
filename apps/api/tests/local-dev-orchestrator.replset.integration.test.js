/**
 * Prova o processo fresco de `dev:local`, incluindo scrub do ambiente,
 * bootstrap e shutdown. Não importa a aplicação antes de o runner instalar o
 * seu ambiente allowlist-only.
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { reserveLocalLoopbackPort } from "../scripts/local-dev-runtime.core.mjs";

const RUNNER_PATH = fileURLToPath(
    new URL("../scripts/run-local-dev.mjs", import.meta.url),
);

const SAFE_CHILD_ENVIRONMENT_KEYS = Object.freeze([
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
    "MONGOMS_DOWNLOAD_DIR",
    "MONGOMS_VERSION",
    "npm_config_cache",
]);

/** Constrói um ambiente mínimo sem herdar credenciais do processo de teste. */
function buildMinimalChildEnvironment(overrides) {
    const environment = {};
    for (const key of SAFE_CHILD_ENVIRONMENT_KEYS) {
        const value = process.env[key];
        if (typeof value === "string" && value) environment[key] = value;
    }
    return { ...environment, ...overrides };
}

/** Espera por uma saída de processo sem esconder uma terminação prematura. */
async function waitForLocalRuntime(child, readOutput) {
    const ready = vi.waitFor(
        () => {
            expect(readOutput()).toContain(
                "8 utilizadores, 4 categorias, 68 produtos, 5 cenários de cliente; OpenAI degradada",
            );
        },
        { timeout: 180_000, interval: 100 },
    );
    const exitedEarly = once(child, "exit").then(([code, signal]) => {
        throw new Error(
            `Runner dev:local terminou antes de ficar pronto (${code ?? signal})`,
        );
    });
    const spawnFailed = once(child, "error").then(([error]) => {
        throw error;
    });

    await Promise.race([ready, exitedEarly, spawnFailed]);
}

/** Encerra o child de forma graciosa e usa SIGKILL apenas como fallback. */
async function stopLocalRuntime(child) {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;

    child.kill("SIGINT");
    const exited = await Promise.race([
        once(child, "exit").then(() => true),
        new Promise((resolve) => {
            const timer = setTimeout(() => resolve(false), 30_000);
            timer.unref?.();
        }),
    ]);
    if (exited) return;

    child.kill("SIGKILL");
    await once(child, "exit");
}

/** Lê JSON e mantém o status HTTP como parte explícita da evidência. */
async function fetchJson(url) {
    const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
    });
    return { status: response.status, body: await response.json() };
}

describe("orquestrador CLI dev:local isolado", () => {
    it(
        "ignora ambiente hostil e publica health, capability e cenários demo",
        async () => {
            const apiPort = await reserveLocalLoopbackPort();
            const forbiddenMongoUri =
                "mongodb://127.0.0.1:1/orelle_remote_forbidden";
            const forbiddenSecret = "never-copy-this-inherited-secret";
            const forbiddenDotEnvSecret = "never-load-this-dotenv-secret";
            const temporaryRoot = await mkdtemp(
                path.join(tmpdir(), "orelle-hostile-env-"),
            );
            const forbiddenDotEnv = path.join(temporaryRoot, ".env");
            await writeFile(
                forbiddenDotEnv,
                [
                    "ORELLE_LOCAL_OPENAI_ENABLED=true",
                    `OPENAI_API_KEY=${forbiddenDotEnvSecret}`,
                    `MONGODB_URI=${forbiddenMongoUri}`,
                    `SESSION_SECRET=${forbiddenDotEnvSecret}`,
                ].join("\n"),
                { mode: 0o600 },
            );
            let stdout = "";
            let stderr = "";
            let child;

            try {
                child = spawn(
                    process.execPath,
                    [RUNNER_PATH, "--runtime-mode=dev:local"],
                    {
                        cwd: fileURLToPath(new URL("..", import.meta.url)),
                        env: buildMinimalChildEnvironment({
                            ORELLE_LOCAL_PORT: String(apiPort),
                            MONGODB_URI: forbiddenMongoUri,
                            DOTENV_CONFIG_PATH: forbiddenDotEnv,
                            OPENAI_TEST_FIXTURE_MODE: "true",
                            SESSION_SECRET: forbiddenSecret,
                            DATA_ENCRYPTION_KEY: forbiddenSecret,
                            NODE_AUTH_TOKEN: forbiddenSecret,
                            FORCE_COLOR: "0",
                        }),
                        stdio: ["ignore", "pipe", "pipe"],
                    },
                );
                child.stdout.setEncoding("utf8");
                child.stderr.setEncoding("utf8");
                child.stdout.on("data", (chunk) => {
                    stdout = `${stdout}${chunk}`.slice(-100_000);
                });
                child.stderr.on("data", (chunk) => {
                    stderr = `${stderr}${chunk}`.slice(-100_000);
                });

                await waitForLocalRuntime(child, () => stdout);

                const baseUrl = `http://127.0.0.1:${apiPort}`;
                const [readiness, catalog, categories, capabilities] =
                    await Promise.all([
                        fetchJson(`${baseUrl}/api/health/ready`),
                        fetchJson(`${baseUrl}/api/catalog/products`),
                        fetchJson(`${baseUrl}/api/catalog/categories`),
                        fetchJson(
                            `${baseUrl}/api/ai-consultation/capabilities`,
                        ),
                    ]);

                expect(readiness).toMatchObject({
                    status: 200,
                    body: {
                        status: "ready",
                        checks: { mongodb: "ok" },
                    },
                });
                expect(catalog.status).toBe(200);
                // O seed contém 68 produtos; o endpoint público mantém a sua
                // paginação canónica de 40 itens por resposta.
                expect(catalog.body.products).toHaveLength(40);
                expect(categories.status).toBe(200);
                expect(categories.body.categories).toHaveLength(4);
                expect(capabilities).toMatchObject({
                    status: 200,
                    body: {
                        capabilities: {
                            provider: "openai",
                            available: false,
                            degraded: true,
                            reason: "AI_NOT_CONFIGURED",
                        },
                    },
                });

                const publicOutput = `${stdout}\n${stderr}`;
                expect(publicOutput).not.toContain(forbiddenMongoUri);
                expect(publicOutput).not.toContain(forbiddenDotEnv);
                expect(publicOutput).not.toContain(forbiddenSecret);
                expect(publicOutput).not.toContain(forbiddenDotEnvSecret);
                expect(publicOutput).not.toContain("mongodb+srv://");

                const childPid = child.pid;
                await stopLocalRuntime(child);
                child = undefined;
                const faceStorageRoot = path.resolve(
                    "storage/private/facial-photos",
                );
                const storageEntries = await readdir(faceStorageRoot, {
                    recursive: true,
                }).catch(() => []);
                expect(
                    storageEntries.filter((entry) =>
                        String(entry).includes(`-${childPid}-`),
                    ),
                ).toEqual([]);
            } finally {
                await stopLocalRuntime(child);
                await rm(temporaryRoot, { recursive: true, force: true });
            }
        },
        240_000,
    );
});
