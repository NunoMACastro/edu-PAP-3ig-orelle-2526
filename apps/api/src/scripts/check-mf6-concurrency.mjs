import { performance } from "node:perf_hooks";

const DEFAULT_TOTAL_REQUESTS = 50;
const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Converte uma variável de ambiente num inteiro positivo.
 *
 * @function parsePositiveInteger
 * @param {string|undefined} value - Valor recebido por variável de ambiente.
 * @param {number} fallback - Valor usado quando a variável não existe.
 * @returns {number} Inteiro positivo validado.
 */
function parsePositiveInteger(value, fallback) {
    if (value === undefined) return fallback;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Valor numérico inválido: ${value}`);
    }

    return parsed;
}

/**
 * Resolve o endpoint final do smoke de concorrência.
 *
 * @function resolveEndpoint
 * @returns {URL} URL final para pedidos concorrentes.
 */
function resolveEndpoint() {
    const baseUrl = process.env.ORELLE_API_URL ?? "http://127.0.0.1:3001";
    const path = process.env.ORELLE_CONCURRENCY_PATH ?? "/api/health";
    const endpoint = new URL(path, baseUrl);

    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    if (!localHosts.has(endpoint.hostname) && process.env.ORELLE_ALLOW_REMOTE_CONCURRENCY !== "true") {
        throw new Error("Carga remota bloqueada. Usa ORELLE_ALLOW_REMOTE_CONCURRENCY=true apenas em ambiente controlado.");
    }

    return endpoint;
}

/**
 * Normaliza erros de fetch para evidence técnica sem stack trace.
 *
 * @function normalizeFetchError
 * @param {unknown} error - Erro capturado durante o pedido.
 * @returns {string} Mensagem curta e segura.
 */
function normalizeFetchError(error) {
    if (error instanceof Error) return error.name === "AbortError" ? "timeout" : error.message;
    return "erro_desconhecido";
}

/**
 * Executa um pedido individual com timeout local.
 *
 * @async
 * @function runHealthRequest
 * @param {number} index - Número técnico do pedido concorrente.
 * @param {URL} endpoint - Endpoint validado.
 * @param {number} timeoutMs - Timeout local do script.
 * @returns {Promise<{index: number, ok: boolean, status: number, durationMs: number, error?: string}>} Resultado minimizado.
 */
async function runHealthRequest(index, endpoint, timeoutMs) {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });

        return {
            index,
            ok: response.ok,
            status: response.status,
            durationMs: Math.round(performance.now() - startedAt),
        };
    } catch (error) {
        return {
            index,
            ok: false,
            status: 0,
            durationMs: Math.round(performance.now() - startedAt),
            error: normalizeFetchError(error),
        };
    } finally {
        // Cada pedido limpa o seu timer para evitar handles pendentes no Node.
        clearTimeout(timer);
    }
}

const endpoint = resolveEndpoint();
const totalRequests = parsePositiveInteger(process.env.ORELLE_CONCURRENCY_TARGET, DEFAULT_TOTAL_REQUESTS);
const timeoutMs = parsePositiveInteger(process.env.ORELLE_CONCURRENCY_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

if (totalRequests < DEFAULT_TOTAL_REQUESTS) {
    throw new Error("RNF07 exige pelo menos 50 pedidos concorrentes.");
}

const results = await Promise.all(
    Array.from({ length: totalRequests }, (_, index) => runHealthRequest(index + 1, endpoint, timeoutMs)),
);

const failures = results.filter((result) => !result.ok);
const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);

const summary = {
    endpoint: endpoint.toString(),
    totalRequests,
    successes: totalRequests - failures.length,
    failures: failures.length,
    maxDurationMs: Math.max(...durations),
    p95DurationMs: durations[p95Index],
};

// O output é evidence técnica: não inclui cookies, utilizadores, fotografias, relatórios ou produtos.
console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
    console.error(JSON.stringify({ failures: failures.slice(0, 5) }, null, 2));
    throw new Error("RNF07 falhou: pelo menos um pedido concorrente não respondeu com sucesso.");
}