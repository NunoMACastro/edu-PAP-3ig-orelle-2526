/**
 * Observação local de Web Vitals reais, sem telemetria nem persistência.
 */
import { useEffect, useState } from "react";
import { evaluateWebVitals } from "../utils/performanceBudget.js";

/**
 * Observa LCP e CLS fornecidos por `PerformanceObserver`.
 *
 * O hook nunca chama a montagem ou o frame seguinte de “page load” e nunca
 * publica PASS. Browsers sem suporte devolvem `unsupported`; a suite browser é
 * a única fonte de validação completa, incluindo transferência.
 *
 * @param {string} pageKey - Área principal medida.
 * @param {string} label - Nome público da área.
 * @returns {object|null} Alerta potencial baseado em Web Vitals reais.
 */
export function usePagePerformance(pageKey, label) {
    const [measurement, setMeasurement] = useState(null);

    useEffect(() => {
        setMeasurement(null);
        const Observer = globalThis.PerformanceObserver;
        const supportedTypes = new Set(Observer?.supportedEntryTypes ?? []);
        const supportsLcp = supportedTypes.has("largest-contentful-paint");
        const supportsCls = supportedTypes.has("layout-shift");
        let lcpMs = null;
        let cls = 0;
        const observers = [];

        const publish = () => {
            setMeasurement(
                evaluateWebVitals({
                    pageKey,
                    label,
                    lcpMs,
                    cls: supportsCls ? cls : null,
                    supportsLcp,
                    supportsCls,
                }),
            );
        };

        if (!Observer || (!supportsLcp && !supportsCls)) {
            publish();
            return undefined;
        }

        if (supportsLcp) {
            const lcpObserver = new Observer((list) => {
                for (const entry of list.getEntries()) {
                    lcpMs = Math.max(
                        lcpMs ?? 0,
                        entry.renderTime || entry.loadTime || entry.startTime || 0,
                    );
                }
                publish();
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
            observers.push(lcpObserver);
        }

        if (supportsCls) {
            const clsObserver = new Observer((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) cls += Number(entry.value ?? 0);
                }
                publish();
            });
            clsObserver.observe({ type: "layout-shift", buffered: true });
            observers.push(clsObserver);
        }

        publish();
        return () => observers.forEach((observer) => observer.disconnect());
    }, [pageKey, label]);

    return measurement;
}
