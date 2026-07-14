/**
 * Budgets de experiência medidos no browser real de referência.
 */
import { expect, test } from "@playwright/test";
import {
    collectPerformanceMetrics,
    installPerformanceObservers,
    PERFORMANCE_BUDGETS,
} from "./helpers/performance.js";

const MEASURED_ROUTES = Object.freeze([
    { path: "/", heading: "Descobre a beleza com inteligência" },
    { path: "/produtos", heading: "Catálogo Orélle" },
]);

for (const route of MEASURED_ROUTES) {
    test(`budgets reais em ${route.path}`, async ({ page, browserName }) => {
        test.skip(
            browserName !== "chromium",
            "LCP e Layout Instability API não têm suporte equivalente nos três engines",
        );

        await installPerformanceObservers(page);
        await page.goto(route.path);
        await expect(
            page.getByRole("heading", { name: route.heading, level: 1 }),
        ).toBeVisible();
        const metrics = await collectPerformanceMetrics(page);

        expect(metrics.supportsLcp).toBe(true);
        expect(metrics.supportsCls).toBe(true);
        expect(metrics.lcpMs).toBeGreaterThan(0);
        expect(metrics.lcpMs).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.lcpMs);
        expect(metrics.cls).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.cls);
        expect(metrics.initialJavascriptBytes).toBeGreaterThan(0);
        expect(metrics.initialJavascriptBytes).toBeLessThanOrEqual(
            PERFORMANCE_BUDGETS.initialJavascriptBytes,
        );
        expect(metrics.totalPageTransferBytes).toBeGreaterThan(0);
        expect(metrics.totalPageTransferBytes).toBeLessThanOrEqual(
            PERFORMANCE_BUDGETS.totalPageTransferBytes,
        );

        for (const image of metrics.imageTransfers) {
            const maximum = /-320\.(?:avif|webp)$/i.test(image.path)
                ? PERFORMANCE_BUDGETS.thumbnailBytes
                : PERFORMANCE_BUDGETS.imageBytes;
            expect(
                image.bytes,
                `Imagem acima do budget: ${image.path}`,
            ).toBeLessThanOrEqual(maximum);
        }
    });
}
