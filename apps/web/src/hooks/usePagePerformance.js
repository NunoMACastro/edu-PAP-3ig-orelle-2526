import { useEffect, useState } from "react";
import { evaluatePageLoadBudget } from "../utils/performance-budget.js";

/**
 * Lê um relógio seguro para medição local no browser.
 *
 * @function readPerformanceClock
 * @returns {number} Tempo atual em milissegundos.
 */
function readPerformanceClock() {
    if (typeof window !== "undefined" && window.performance?.now) {
        return window.performance.now();
    }

    return Date.now();
}

/**
 * Mede o primeiro render de uma área principal da Orélle.
 *
 * @function usePagePerformance
 * @param {string} pageKey - Chave técnica da página principal.
 * @returns {{pageKey: string, pageLabel: string, loadMs: number, budgetMs: number, status: string}|null} Métrica local minimizada.
 */
export function usePagePerformance(pageKey) {
    const [metric, setMetric] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const startedAt = readPerformanceClock();

        const frameId = window.requestAnimationFrame(() => {
            const renderedAt = readPerformanceClock();
            const loadMs = renderedAt - startedAt;

            // A métrica fica local e mede a área técnica, não a pessoa autenticada.
            if (!cancelled) {
                setMetric(evaluatePageLoadBudget({ pageKey, loadMs }));
            }
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, [pageKey]);

    return metric;
}