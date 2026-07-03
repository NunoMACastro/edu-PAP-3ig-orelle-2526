/**
 * Hook de medicao local de carregamento das areas principais da MF6.
 */
import { useEffect, useState } from "react";
import { evaluatePageLoad } from "../utils/performanceBudget.js";

/**
 * Mede o primeiro frame apos montagem de uma area principal.
 *
 * @function usePagePerformance
 * @param {string} pageKey - Identificador tecnico da area principal.
 * @param {string} label - Nome visivel minimizado da area.
 * @returns {object|null} Medicao avaliada ou null antes do primeiro frame.
 */
export function usePagePerformance(pageKey, label) {
    const [measurement, setMeasurement] = useState(null);

    useEffect(() => {
        const startedAt = performance.now();
        const frameId = requestAnimationFrame(() => {
            setMeasurement(
                evaluatePageLoad({
                    pageKey,
                    label,
                    durationMs: Math.round(performance.now() - startedAt),
                }),
            );
        });

        return () => cancelAnimationFrame(frameId);
    }, [pageKey, label]);

    return measurement;
}
