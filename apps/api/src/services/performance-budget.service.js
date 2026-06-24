import { performance } from "node:perf_hooks";
import { AppError } from "../middlewares/error.middleware.js";
import { PerformanceMetric } from "../models/performance-metric.model.js";

export const FACE_ANALYSIS_OPERATION = "face_analysis";
export const FACE_ANALYSIS_BUDGET_MS = 10_000;

/**
 * Executa uma tarefa assíncrona dentro de um orçamento de performance.
 *
 * @async
 * @function runWithPerformanceBudget
 * @param {object} params - Parâmetros do orçamento.
 * @param {"face_analysis"} params.operation - Operação medida.
 * @param {number} params.budgetMs - Limite máximo em milissegundos.
 * @param {() => Promise<unknown>} params.task - Tarefa protegida pelo orçamento.
 * @returns {Promise<unknown>} Resultado da tarefa original.
 */
export async function runWithPerformanceBudget({ operation, budgetMs, task }) {
    const startedAt = performance.now();
    let timeoutId;
    let status = "success";

    try {
        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
                reject(
                    new AppError(
                        503,
                        "A análise facial demorou demasiado. Tenta novamente.",
                    ),
                );
            }, budgetMs);
        });

        // A task mantém a lógica real; o timeout apenas limita a espera da API.
        const result = await Promise.race([task(), timeoutPromise]);
        status = "success";
        return result;
    } catch (err) {
        status = err instanceof AppError && err.statusCode === 503
            ? "timeout"
            : "error";
        throw err;
    } finally {
        clearTimeout(timeoutId);

        const durationMs = Math.round(performance.now() - startedAt);

        // Falhas ao gravar métrica não devem mascarar a resposta principal.
        await PerformanceMetric.create({
            operation,
            durationMs,
            status,
            budgetMs,
        }).catch(() => undefined);
    }
}