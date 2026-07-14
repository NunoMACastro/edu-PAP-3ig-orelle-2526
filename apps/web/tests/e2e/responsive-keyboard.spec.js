/**
 * Responsive, landmarks e navegação por teclado cross-browser.
 */
import { expect, test } from "@playwright/test";
import { expectNoSeriousOrCriticalAxeViolations } from "./helpers/accessibility.js";
import { loginAs } from "./helpers/auth.js";
import {
    expectNoHorizontalPageOverflow,
    expectSingleReadyMain,
} from "./helpers/layout.js";

const VIEWPORTS = Object.freeze([
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
]);
const RESPONSIVE_ROUTES = Object.freeze(["/", "/login", "/registo", "/produtos"]);
const AUTHENTICATED_VIEWPORTS = Object.freeze([
    { width: 320, height: 720 },
    { width: 375, height: 812 },
]);
const AUTHENTICATED_ROUTES = Object.freeze([
    { path: "/conta", heading: /^(?:Olá, .+|A tua beleza, organizada à tua medida)$/ },
    { path: "/pele/evolucao", heading: "Evolução da tua pele" },
    { path: "/pele/comparacao", heading: "Compara dois momentos" },
]);

for (const viewport of VIEWPORTS) {
    test(`sem overflow horizontal a ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);

        for (const route of RESPONSIVE_ROUTES) {
            await page.goto(route);
            await expectSingleReadyMain(page);
            await expectNoHorizontalPageOverflow(page);

            if (route === "/") {
                const [skinCopyBox, skinDialogueBox] = await Promise.all([
                    page.locator(".mockup-skin-copy").boundingBox(),
                    page.locator(".mockup-skin-dialogue").boundingBox(),
                ]);

                expect(skinCopyBox).not.toBeNull();
                expect(skinDialogueBox).not.toBeNull();
                if (viewport.width <= 920) {
                    expect(skinCopyBox.y).toBeLessThan(skinDialogueBox.y);
                } else {
                    expect(skinDialogueBox.x).toBeLessThan(skinCopyBox.x);
                }
            }

            if (route === "/produtos") {
                const advancedFilters = page.locator("#catalog-advanced-filters");
                const filterToggle = page.getByRole("button", { name: "Filtrar" });
                if (viewport.width <= 620) {
                    await expect(filterToggle).toHaveAttribute(
                        "aria-expanded",
                        "false",
                    );
                    await expect(advancedFilters).toBeHidden();
                } else {
                    await expect(advancedFilters).toBeVisible();
                }

                const grid = page.locator(".catalog-product-grid");
                await expect(grid.locator(".product-card")).not.toHaveCount(0);
                const renderedColumns = await grid.evaluate((element) =>
                    getComputedStyle(element).gridTemplateColumns.split(" ").length,
                );
                const expectedColumns =
                    viewport.width >= 1360
                        ? 4
                        : viewport.width >= 921
                          ? 3
                          : viewport.width >= 621
                            ? 2
                            : 1;
                expect(renderedColumns).toBe(expectedColumns);

                const firstCard = grid.locator(".product-card").first();
                const firstCardBox = await firstCard.boundingBox();
                expect(firstCardBox).not.toBeNull();
                if (viewport.width <= 375) {
                    expect(firstCardBox.y).toBeLessThan(844);
                }

                const detailHref = await firstCard
                    .getByRole("link", { name: /^Ver / })
                    .first()
                    .getAttribute("href");
                await page.goto(detailHref);
                await expect(page.locator(".product-purchase-panel h1")).toBeVisible();
                await expectNoHorizontalPageOverflow(page);

                const detailImageBox = await page
                    .locator(".product-detail-media__image")
                    .boundingBox();
                expect(detailImageBox).not.toBeNull();
                expect(Math.abs(detailImageBox.width - detailImageBox.height)).toBeLessThanOrEqual(1);

                const heroColumns = await page
                    .locator(".product-detail-hero")
                    .evaluate((element) =>
                        getComputedStyle(element).gridTemplateColumns.split(" ").length,
                    );
                expect(heroColumns).toBe(viewport.width <= 760 ? 1 : 2);
            }
        }
    });
}

test("skip-link e foco pós-navegação funcionam por teclado", async ({
    page,
    browserName,
}) => {
    await page.goto("/login");
    await expect(
        page.getByRole("heading", { name: "Iniciar sessão", level: 1 }),
    ).toBeVisible();
    const main = await expectSingleReadyMain(page);
    const skipLink = page.getByRole("link", {
        name: "Saltar para o conteúdo principal",
    });

    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await expect(main).toBeFocused();

    const homeLink = page.getByRole("link", { name: "Voltar ao início" });
    await homeLink.click();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);
    await expect(page.locator("main")).toBeFocused();
});

test("área autenticada do cliente é responsiva e acessível em cada engine", async ({
    page,
}, testInfo) => {
    await page.setViewportSize(AUTHENTICATED_VIEWPORTS[0]);
    await loginAs(page, "cliente_existente", testInfo.project.name);

    // Cada rota entra uma única vez na aplicação. Redimensionar a mesma
    // montagem testa a matriz responsiva sem recriar todos os providers e sem
    // transformar o teste visual numa sequência artificial de novas sessões.
    for (const route of AUTHENTICATED_ROUTES) {
        await page.goto(route.path);
        for (const viewport of AUTHENTICATED_VIEWPORTS) {
            await page.setViewportSize(viewport);
            await expect(
                page.getByRole("heading", {
                    name: route.heading,
                    level: 1,
                }),
            ).toBeVisible();
            await expectSingleReadyMain(page);
            await expectNoHorizontalPageOverflow(page);
            await expectNoSeriousOrCriticalAxeViolations(page);
        }
    }
});
