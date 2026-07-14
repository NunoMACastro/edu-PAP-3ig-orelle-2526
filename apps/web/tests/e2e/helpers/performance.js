/**
 * Observação browser de LCP, CLS e transferência efetiva.
 */

export const PERFORMANCE_BUDGETS = Object.freeze({
    lcpMs: 3_000,
    cls: 0.1,
    initialJavascriptBytes: 200 * 1024,
    totalPageTransferBytes: 2 * 1024 * 1024,
    thumbnailBytes: 120 * 1024,
    imageBytes: 300 * 1024,
});

/**
 * Instala observers antes do documento seguinte começar a carregar.
 *
 * @param {import("@playwright/test").Page} page - Página ainda não navegada.
 * @returns {Promise<void>} Registo do init script.
 */
export async function installPerformanceObservers(page) {
    await page.addInitScript(() => {
        const supportedEntryTypes = new Set(
            globalThis.PerformanceObserver?.supportedEntryTypes ?? [],
        );
        globalThis.__orellePerformance = {
            lcp: 0,
            cls: 0,
            supportsLcp: supportedEntryTypes.has("largest-contentful-paint"),
            supportsCls: supportedEntryTypes.has("layout-shift"),
        };

        if (globalThis.__orellePerformance.supportsLcp) {
            const lcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    globalThis.__orellePerformance.lcp = Math.max(
                        globalThis.__orellePerformance.lcp,
                        entry.renderTime || entry.loadTime || entry.startTime || 0,
                    );
                }
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        }

        if (globalThis.__orellePerformance.supportsCls) {
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        globalThis.__orellePerformance.cls += entry.value;
                    }
                }
            });
            clsObserver.observe({ type: "layout-shift", buffered: true });
        }
    });
}

/**
 * Espera a rede estabilizar e recolhe métricas sem expor URLs completas.
 *
 * @param {import("@playwright/test").Page} page - Página medida.
 * @returns {Promise<object>} Métricas e tamanhos agrupados.
 */
export async function collectPerformanceMetrics(page) {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(750);

    return page.evaluate(() => {
        const transferSize = (entry) =>
            Number(entry.transferSize || entry.encodedBodySize || 0);
        const resources = performance.getEntriesByType("resource").map((entry) => ({
            path: new URL(entry.name, location.origin).pathname,
            initiatorType: entry.initiatorType,
            bytes: transferSize(entry),
        }));
        const navigation = performance.getEntriesByType("navigation")[0];
        const scriptResources = resources.filter(
            (entry) =>
                entry.initiatorType === "script" || /\.js$/i.test(entry.path),
        );
        const imageResources = resources.filter(
            (entry) =>
                entry.initiatorType === "img" ||
                /\.(?:avif|webp|png|jpe?g)$/i.test(entry.path),
        );

        return {
            lcpMs: globalThis.__orellePerformance?.lcp ?? 0,
            cls: globalThis.__orellePerformance?.cls ?? 0,
            supportsLcp: globalThis.__orellePerformance?.supportsLcp === true,
            supportsCls: globalThis.__orellePerformance?.supportsCls === true,
            initialJavascriptBytes: scriptResources.reduce(
                (total, entry) => total + entry.bytes,
                0,
            ),
            totalPageTransferBytes:
                transferSize(navigation ?? {}) +
                resources.reduce((total, entry) => total + entry.bytes, 0),
            imageTransfers: imageResources.map((entry) => ({
                path: entry.path,
                bytes: entry.bytes,
            })),
        };
    });
}
