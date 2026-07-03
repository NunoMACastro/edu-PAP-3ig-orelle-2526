/**
 * Smoke local de concorrencia MF6.
 *
 * Arranca a API em porta efemera local e executa pedidos concorrentes ao
 * health check, produzindo evidence tecnica sem dados pessoais.
 */
import { createServer } from "node:http";
import { createApp } from "../src/app.js";

const DEFAULT_TARGET = 50;
const target = Number(process.env.ORELLE_CONCURRENCY_TARGET ?? DEFAULT_TARGET);
const allowRemote = process.env.ORELLE_ALLOW_REMOTE_CONCURRENCY === "true";

if (!Number.isInteger(target) || target < DEFAULT_TARGET) {
    throw new Error(`ORELLE_CONCURRENCY_TARGET deve ser >= ${DEFAULT_TARGET}.`);
}

const configuredBaseUrl = process.env.ORELLE_CONCURRENCY_BASE_URL;
if (configuredBaseUrl && !allowRemote) {
    const url = new URL(configuredBaseUrl);
    const isLocal =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1";

    if (!isLocal) {
        throw new Error(
            "Smoke de concorrencia remota bloqueado sem ORELLE_ALLOW_REMOTE_CONCURRENCY=true.",
        );
    }
}

/**
 * Abre a app local quando nao ha base URL configurada.
 *
 * @async
 * @returns {Promise<{baseUrl: string, close: () => Promise<void>}>} Servidor local.
 */
async function createLocalTarget() {
    if (configuredBaseUrl) {
        return { baseUrl: configuredBaseUrl, close: async () => undefined };
    }

    const server = createServer(createApp());

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    return {
        baseUrl,
        close: () =>
            new Promise((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            }),
    };
}

const targetServer = await createLocalTarget();

try {
    const startedAt = performance.now();
    const responses = await Promise.allSettled(
        Array.from({ length: target }, () =>
            fetch(`${targetServer.baseUrl}/api/health`),
        ),
    );
    const durationMs = Math.round(performance.now() - startedAt);
    const successes = responses.filter(
        (result) => result.status === "fulfilled" && result.value.status === 200,
    ).length;
    const failures = target - successes;
    const evidence = {
        target,
        successes,
        failures,
        durationMs,
        endpoint: "/api/health",
    };

    console.log(JSON.stringify(evidence, null, 2));

    if (failures > 0) {
        throw new Error(`Smoke MF6 concorrencia falhou: ${failures} falhas.`);
    }
} finally {
    await targetServer.close();
}
