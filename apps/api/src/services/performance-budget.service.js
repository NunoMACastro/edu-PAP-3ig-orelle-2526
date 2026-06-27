/**
 * Helpers de orcamento temporal e metricas minimizadas para RNFs da MF6.
 */
import { performance } from "node:perf_hooks";
import { AppError } from "../middlewares/error.middleware.js";
import { PerformanceMetric } from "../models/performance-metric.model.js";

export const FACE_ANALYSIS_OPERATION = "face_analysis";
export const FACE_ANALYSIS_BUDGET_MS = 10000;
const FACE_ANALYSIS_TIMEOUT_MESSAGE =
    "A análise facial demorou demasiado. Tenta novamente.";

/**
 * Garante que uma tarefa cooperativa ainda esta dentro do budget temporal.
 *
 * @function assertPerformanceBudgetActive
 * @param {AbortSignal|undefined} signal - Sinal controlado por `runWithPerformanceBudget`.
 * @throws {AppError} Quando o budget ja foi excedido.
 * @returns {void}
 */
export function assertPerformanceBudgetActive(signal) {
    if (!signal?.aborted) return;

    if (signal.reason instanceof AppError) {
        throw signal.reason;
    }

    throw new AppError(503, FACE_ANALYSIS_TIMEOUT_MESSAGE);
}

/**
 * Persiste uma metrica minimizada sem mascarar o resultado principal.
 *
 * @async
 * @function recordPerformanceMetric
 * @param {{operation: string, durationMs: number, status: string, budgetMs: number}} metric - Metrica minimizada.
 * @returns {Promise<void>}
 */
async function recordPerformanceMetric(metric) {
    try {
        await PerformanceMetric.create(metric);
    } catch {
        // A metrica e observabilidade auxiliar; a operacao principal nao deve
        // falhar nem expor detalhes internos se esta escrita falhar.
    }
}

/**
 * Executa uma operacao com budget temporal e regista a metrica completa.
 *
 * A medicao comeca antes de executar `task` e termina apenas depois de `task`
 * resolver/rejeitar ou do timeout disparar. A metrica persistida e minimizada.
 *
 * @async
 * @function runWithPerformanceBudget
 * @template T
 * @param {{operation: string, budgetMs: number, task: (context: {signal: AbortSignal}) => Promise<T>}} options - Configuracao do budget.
 * @returns {Promise<{value: T, durationMs: number, budgetMs: number}>} Resultado e metrica temporal.
 * @throws {AppError} Quando o budget temporal e excedido.
 */
export async function runWithPerformanceBudget({ operation, budgetMs, task }) {
    const startedAt = performance.now();
    const abortController = new AbortController();
    let timeoutId;
    let status = "success";
    let budgetTimedOut = false;

    try {
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                budgetTimedOut = true;
                const timeoutError = new AppError(
                    503,
                    FACE_ANALYSIS_TIMEOUT_MESSAGE,
                );

                abortController.abort(timeoutError);
                reject(timeoutError);
            }, budgetMs);
        });

        const value = await Promise.race([
            task({ signal: abortController.signal }),
            timeout,
        ]);
        const durationMs = Math.round(performance.now() - startedAt);

        return { value, durationMs, budgetMs };
    } catch (err) {
        status = budgetTimedOut ? "timeout" : "error";
        throw err;
    } finally {
        clearTimeout(timeoutId);
        await recordPerformanceMetric({
            operation,
            durationMs: Math.round(performance.now() - startedAt),
            status,
            budgetMs,
        });
    }
}
