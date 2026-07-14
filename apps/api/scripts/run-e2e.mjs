/**
 * Orquestrador E2E local e reproduzível da aplicação Orélle.
 *
 * O processo cria toda a infraestrutura necessária sem Docker: replica set
 * MongoDB efémero, migrações, seed mínimo, API Express, Vite Preview e gateway
 * same-origin. O `finally` encerra todos os recursos mesmo quando o build, o
 * browser ou uma asserção falham.
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    API_ROOT,
    WEB_ROOT,
    buildScrubbedE2eEnvironment,
    closeHttpServer,
    createE2eWorkingDirectory,
    createIsolatedViteConfig,
    installProcessEnvironment,
    prepareE2eDatabase,
    readWebE2eScript,
    removeE2eWorkingDirectory,
    reserveLoopbackPort,
    runCommand,
    runIsolatedViteBuild,
    startE2eApiServer,
    startE2eGateway,
    startE2eReplicaSet,
    startVitePreview,
    stopChildProcess,
    waitForHttpReady,
} from "./e2e-runtime.core.mjs";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const WEB_DIST_INDEX = path.join(WEB_ROOT, "dist", "index.html");

/**
 * Reduz uma falha a texto público sem URI MongoDB, credenciais ou stack trace.
 *
 * @param {unknown} error - Erro interno do runtime.
 * @returns {string} Mensagem sanitizada adequada a stdout/stderr e reports.
 */
export function sanitizeE2eErrorMessage(error) {
    return String(error?.message ?? "falha desconhecida")
        .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, "[mongodb-uri-redacted]")
        .replace(/test-user-password-[a-f0-9]{40,64}/gi, "[password-redacted]")
        .replace(/test-(?:session|data)-[a-f0-9]{64}/gi, "[secret-redacted]");
}

/**
 * Executa a bateria Playwright sobre uma infraestrutura totalmente efémera.
 *
 * @param {object} [options] - Opções controladas pelo `verify-all`.
 * @param {boolean} [options.skipWebBuild=false] - Reutiliza `dist` já criado no mesmo gate.
 * @returns {Promise<{status: "passed", database: string, migrations: number, users: number, products: number, images: number, playwrightScript: string}>} Evidência sanitizada.
 */
export async function runE2e({ skipWebBuild = false } = {}) {
    const playwrightScript = await readWebE2eScript();
    const originalWorkingDirectory = process.cwd();
    const scrubbedEnvironment = buildScrubbedE2eEnvironment();
    const restoreEnvironment = installProcessEnvironment(scrubbedEnvironment);
    const teardownErrors = [];
    let primaryError;
    let workingDirectory;
    let replicaSetRuntime;
    let databaseRuntime;
    let apiRuntime;
    let previewRuntime;
    let gatewayRuntime;
    let viteConfigPath;
    let result;

    try {
        workingDirectory = await createE2eWorkingDirectory();
        process.chdir(workingDirectory);

        replicaSetRuntime = await startE2eReplicaSet();
        const gatewayPort = await reserveLoopbackPort();
        const previewPort = await reserveLoopbackPort();
        const gatewayOrigin = `http://127.0.0.1:${gatewayPort}`;

        Object.assign(process.env, {
            MONGODB_URI: replicaSetRuntime.mongo.uri,
            CLIENT_ORIGIN: gatewayOrigin,
            CLIENT_ORIGINS: gatewayOrigin,
            PORT: "3001",
        });

        databaseRuntime = await prepareE2eDatabase({
            mongoUri: replicaSetRuntime.mongo.uri,
        });
        apiRuntime = await startE2eApiServer();

        const webRuntimeEnvironment = {
            ...process.env,
            NODE_ENV: "production",
            VITE_API_PROXY_TARGET: apiRuntime.origin,
        };
        viteConfigPath = await createIsolatedViteConfig(workingDirectory);

        if (skipWebBuild) {
            await access(WEB_DIST_INDEX).catch(() => {
                throw new Error(
                    "ORELLE_E2E_SKIP_WEB_BUILD exige real_dev/web/dist/index.html",
                );
            });
        } else {
            await runIsolatedViteBuild({
                configPath: viteConfigPath,
                environment: webRuntimeEnvironment,
            });
        }

        previewRuntime = await startVitePreview({
            port: previewPort,
            environment: webRuntimeEnvironment,
            configPath: viteConfigPath,
        });
        gatewayRuntime = await startE2eGateway({
            apiOrigin: apiRuntime.origin,
            webOrigin: previewRuntime.origin,
            port: gatewayPort,
        });

        await waitForHttpReady(`${gatewayRuntime.origin}/api/health/ready`, {
            acceptStatus: (status) => status === 200,
        });

        const browserEnvironment = {
            ...process.env,
            VITE_API_PROXY_TARGET: apiRuntime.origin,
            ...databaseRuntime.credentialEnvironment,
            ORELLE_E2E_BASE_URL: gatewayRuntime.origin,
            ORELLE_E2E_WEB_URL: gatewayRuntime.origin,
            ORELLE_E2E_API_URL: apiRuntime.origin,
            PLAYWRIGHT_BASE_URL: gatewayRuntime.origin,
        };

        await runCommand({
            command: "npm",
            args: ["run", playwrightScript],
            cwd: WEB_ROOT,
            environment: browserEnvironment,
            label: "Playwright E2E",
        });

        result = {
            status: "passed",
            database: replicaSetRuntime.mongo.databaseName,
            migrations: databaseRuntime.summary.migrationCount,
            users: databaseRuntime.summary.userCount,
            products: databaseRuntime.summary.productCount,
            images: databaseRuntime.summary.imageCount,
            playwrightScript,
        };
    } catch (error) {
        primaryError = error;
    } finally {
        const cleanupSteps = [
            ["vite-preview", () => stopChildProcess(previewRuntime?.child)],
            ["gateway", () => closeHttpServer(gatewayRuntime?.server)],
            ["api", () => closeHttpServer(apiRuntime?.server)],
            ["ai-worker", () => apiRuntime?.worker?.stop()],
            ["private-file-worker", () => apiRuntime?.privateFileWorker?.stop()],
            ["mongoose", () => databaseRuntime?.mongoose?.disconnect()],
            ["mongodb-memory-replset", () => replicaSetRuntime?.replSet?.stop()],
        ];

        for (const [label, cleanup] of cleanupSteps) {
            try {
                await cleanup();
            } catch {
                teardownErrors.push(label);
            }
        }

        process.chdir(originalWorkingDirectory);
        try {
            await removeE2eWorkingDirectory(workingDirectory);
        } catch {
            teardownErrors.push("temporary-directory");
        }
        restoreEnvironment();
    }

    if (primaryError) throw primaryError;
    if (teardownErrors.length > 0) {
        throw new Error(
            `Teardown E2E incompleto: ${teardownErrors.join(", ")}`,
        );
    }

    return result;
}

if (process.argv[1] === SCRIPT_FILE) {
    const skipWebBuild = process.env.ORELLE_E2E_SKIP_WEB_BUILD === "true";

    runE2e({ skipWebBuild })
        .then((summary) => {
            console.log(`E2E local OK: ${JSON.stringify(summary)}`);
        })
        .catch((error) => {
            console.error(`E2E local falhou: ${sanitizeE2eErrorMessage(error)}`);
            process.exitCode = 1;
        });
}
