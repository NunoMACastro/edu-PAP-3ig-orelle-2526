/**
 * Helpers de orcamento temporal e metricas minimizadas para RNFs da MF6.
 */
import { performance } from "node:perf_hooks";
import { AppError } from "../middlewares/error.middleware.js";
import { PerformanceMetric } from "../models/performance-metric.model.js";
import { getAbortSignalError } from "../utils/abort-signal.util.js";

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
 * @param {{operation: string, budgetMs: number, signal?: AbortSignal, task: (context: {signal: AbortSignal}) => Promise<T>}} options - Configuracao do budget.
 * @returns {Promise<{value: T, durationMs: number, budgetMs: number}>} Resultado e metrica temporal.
 * @throws {AppError} Quando o budget temporal e excedido.
 */
export async function runWithPerformanceBudget({
    operation,
    budgetMs,
    signal: parentSignal,
    task,
}) {
    const startedAt = performance.now();
    const abortController = new AbortController();
    let timeoutId;
    let status = "success";
    let budgetTimedOut = false;
    let rejectCancellation;

    const abortFromParent = () => {
        const error = getAbortSignalError(
            parentSignal,
            "Análise facial cancelada.",
        );
        if (!abortController.signal.aborted) abortController.abort(error);
        rejectCancellation?.(error);
    };

    try {
        if (parentSignal?.aborted) abortFromParent();
        else {
            parentSignal?.addEventListener("abort", abortFromParent, {
                once: true,
            });
        }

        const cancellation = new Promise((_, reject) => {
            rejectCancellation = reject;
            timeoutId = setTimeout(() => {
                budgetTimedOut = true;
                const timeoutError = new AppError(
                    503,
                    FACE_ANALYSIS_TIMEOUT_MESSAGE,
                );

                abortController.abort(timeoutError);
                reject(timeoutError);
            }, budgetMs);

            if (parentSignal?.aborted) abortFromParent();
        });

        if (abortController.signal.aborted) {
            throw abortController.signal.reason;
        }

        const value = await Promise.race([
            task({ signal: abortController.signal }),
            cancellation,
        ]);
        const durationMs = Math.round(performance.now() - startedAt);

        return { value, durationMs, budgetMs };
    } catch (err) {
        status = budgetTimedOut ? "timeout" : "error";
        throw err;
    } finally {
        clearTimeout(timeoutId);
        parentSignal?.removeEventListener("abort", abortFromParent);
        await recordPerformanceMetric({
            operation,
            durationMs: Math.round(performance.now() - startedAt),
            status,
            budgetMs,
        });
    }
}
