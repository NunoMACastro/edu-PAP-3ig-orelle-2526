/**
 * Asserções de estrutura, foco e overflow reutilizáveis.
 */
import { expect } from "@playwright/test";

/**
 * Aguarda o shell lazy terminar e confirma um único landmark principal.
 *
 * @param {import("@playwright/test").Page} page - Página após navegação.
 * @returns {Promise<import("@playwright/test").Locator>} Landmark `<main>`.
 */
export async function expectSingleReadyMain(page) {
    const main = page.locator("main");
    await expect(main).toHaveCount(1);
    await expect(main).toBeVisible();
    await expect(main).not.toHaveAttribute("aria-busy", "true");
    return main;
}

/**
 * Confirma que a página não aumenta a largura do viewport.
 *
 * @param {import("@playwright/test").Page} page - Página estabilizada.
 * @returns {Promise<void>} Asserção com métricas numéricas mínimas.
 */
export async function expectNoHorizontalPageOverflow(page) {
    const dimensions = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body?.scrollWidth ?? 0,
    }));
    const renderedWidth = Math.max(
        dimensions.documentWidth,
        dimensions.bodyWidth,
    );

    expect(
        renderedWidth - dimensions.viewportWidth,
        `Overflow horizontal: viewport=${dimensions.viewportWidth}, documento=${renderedWidth}`,
    ).toBeLessThanOrEqual(1);
}
