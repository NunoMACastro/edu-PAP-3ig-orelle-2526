/**
 * Cobertura pública e Axe em Chromium, Firefox e WebKit.
 */
import { expect, test } from "@playwright/test";
import { expectNoSeriousOrCriticalAxeViolations } from "./helpers/accessibility.js";
import { expectSingleReadyMain } from "./helpers/layout.js";

const PUBLIC_ROUTES = Object.freeze([
    {
        path: "/",
        heading: "Descobre a beleza com inteligência",
        expectedProductCards: 3,
    },
    { path: "/login", heading: "Iniciar sessão", expectedProductCards: 0 },
    { path: "/registo", heading: "Criar conta", expectedProductCards: 0 },
    { path: "/produtos", heading: "Catálogo Orélle", expectedProductCards: 3 },
]);

for (const route of PUBLIC_ROUTES) {
    test(`rota pública ${route.path} não tem violações Axe bloqueantes`, async ({
        page,
    }) => {
        await page.goto(route.path);
        await expect(
            page.getByRole("heading", { name: route.heading, level: 1 }),
        ).toBeVisible();
        await expectSingleReadyMain(page);
        if (route.expectedProductCards > 0) {
            await expect(page.locator(".product-card")).toHaveCount(
                route.expectedProductCards,
            );
        }
        if (["/login", "/registo"].includes(route.path)) {
            const lockup = page.getByRole("img", {
                name: "Orélle — Consultoria Cosmética Inteligente",
            });
            await expect(lockup).toBeVisible();
            await expect(lockup).toHaveAttribute("width", "640");
            await expect(lockup).toHaveAttribute("height", "574");
            await expect
                .poll(() =>
                    lockup.evaluate((image) => ({
                        complete: image.complete,
                        hasIntrinsicSize:
                            image.naturalWidth >= 320 && image.naturalHeight > 0,
                    })),
                )
                .toEqual({
                    complete: true,
                    hasIntrinsicSize: true,
                });
        }
        if (route.path === "/") {
            await expect(
                page.getByRole("heading", {
                    name: "Beleza que parte de ti",
                    level: 2,
                }),
            ).toBeVisible();
            await expect(
                page.locator(".mockup-consultation-showcase"),
            ).toHaveCount(1);
            await expect(
                page.getByRole("img", {
                    name: "Retrato original sem a pré-visualização de maquilhagem",
                }),
            ).toBeVisible();
            await expect(
                page.getByRole("img", {
                    name: "Pré-visualização de maquilhagem luminosa em tons rose-gold",
                }),
            ).toBeVisible();
            await expect(page.locator(".mockup-chat-message")).toHaveCount(0);
            await expect(
                page.getByRole("heading", {
                    name: "Compreender a tua pele muda tudo",
                    level: 2,
                }),
            ).toBeVisible();
            const skinDialogue = page.getByRole("article", {
                name: "Conversa sobre cuidados de pele",
            });
            await expect(skinDialogue).toBeVisible();
            await expect(
                skinDialogue.getByRole("list", {
                    name: "Perguntas e respostas da consulta",
                }).getByRole("listitem"),
            ).toHaveCount(4);
            await expect(skinDialogue.getByRole("textbox")).toHaveCount(0);
            await expect(skinDialogue.getByRole("button")).toHaveCount(0);

            const [
                copyBox,
                showcaseBox,
                imageBoxes,
                skinCopyBox,
                skinDialogueBox,
                sectionPositions,
            ] = await Promise.all([
                page.locator(".mockup-ai-copy").boundingBox(),
                page.locator(".mockup-consultation-showcase").boundingBox(),
                page.locator(".mockup-makeup-preview img").evaluateAll((images) =>
                    images.map((image) => {
                        const box = image.getBoundingClientRect();
                        return {
                            width: box.width,
                            height: box.height,
                            complete: image.complete,
                            currentSrc: image.currentSrc,
                            naturalWidth: image.naturalWidth,
                        };
                    }),
                ),
                page.locator(".mockup-skin-copy").boundingBox(),
                page.locator(".mockup-skin-dialogue").boundingBox(),
                page.evaluate(() =>
                    [
                        ".mockup-ai-section",
                        ".mockup-skin-section",
                        ".mockup-features-section",
                    ].map((selector) =>
                        document.querySelector(selector)?.getBoundingClientRect().top,
                    ),
                ),
            ]);

            expect(copyBox).not.toBeNull();
            expect(showcaseBox).not.toBeNull();
            expect(
                showcaseBox.height,
                JSON.stringify({ copyBox, showcaseBox, imageBoxes }),
            ).toBeLessThanOrEqual(700);
            expect(showcaseBox.height).toBeLessThanOrEqual(copyBox.height * 1.25);
            expect(imageBoxes).toHaveLength(2);
            for (const image of imageBoxes) {
                expect(Math.abs(image.width - image.height)).toBeLessThanOrEqual(1);
                expect(image.complete).toBe(true);
                expect(image.currentSrc).toMatch(
                    /orelle-makeup-(?:original|preview)-(?:320|520|960)\.(?:avif|webp)$/,
                );
            }
            expect(skinCopyBox).not.toBeNull();
            expect(skinDialogueBox).not.toBeNull();
            expect(skinDialogueBox.x).toBeLessThan(skinCopyBox.x);
            expect(skinDialogueBox.height).toBeLessThanOrEqual(700);
            expect(skinDialogueBox.height).toBeLessThanOrEqual(
                skinCopyBox.height * 1.25,
            );
            expect(sectionPositions[0]).toBeLessThan(sectionPositions[1]);
            expect(sectionPositions[1]).toBeLessThan(sectionPositions[2]);
        }
        await expectNoSeriousOrCriticalAxeViolations(page);

        if (["/", "/login", "/registo", "/produtos"].includes(route.path)) {
            for (const theme of ["Escuro", "Contraste"]) {
                await page.getByRole("button", { name: `Tema ${theme}` }).click();
                await expect(page.locator("html")).toHaveAttribute(
                    "data-theme",
                    theme === "Escuro" ? "dark" : "contrast",
                );
                await expectNoSeriousOrCriticalAxeViolations(page);
            }
        }
    });
}

test("detalhe e relacionados mantêm a experiência comercial acessível", async ({
    page,
}) => {
    await page.goto("/produtos");
    const detailLinks = page.locator(".product-card h2 a");
    await expect(detailLinks).not.toHaveCount(0);
    const detailHref = await detailLinks.first().getAttribute("href");
    expect(detailHref).toMatch(/^\/produtos\/[^/]+$/);

    await page.goto(detailHref);
    await expect(page.locator(".product-purchase-panel h1")).toBeVisible();
    await expect(page.locator(".product-detail-media__image")).toBeVisible();
    await expectSingleReadyMain(page);
    await expectNoSeriousOrCriticalAxeViolations(page);

    for (const theme of ["Escuro", "Contraste"]) {
        await page.getByRole("button", { name: `Tema ${theme}` }).click();
        await expectNoSeriousOrCriticalAxeViolations(page);
    }

    const relatedLink = page.getByRole("link", { name: "Ver todos" });
    await expect(relatedLink).toBeVisible();
    const relatedHref = await relatedLink.getAttribute("href");
    expect(relatedHref).toMatch(/^\/produtos\/[^/]+\/relacionados$/);

    await page.goto(relatedHref);
    await expect(
        page.getByRole("heading", {
            name: "Produtos semelhantes e complementares",
            level: 1,
        }),
    ).toBeVisible();
    await expect(
        page.locator(".related-products-page__grid .product-card"),
    ).not.toHaveCount(0);
    await expectSingleReadyMain(page);
    await expectNoSeriousOrCriticalAxeViolations(page);
});

test("home mantém navegação e conteúdo utilizáveis a 320 píxeis", async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    await expect(
        page.getByRole("heading", {
            name: "Descobre a beleza com inteligência",
            level: 1,
        }),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        )
        .toBe(true);
    await expectNoSeriousOrCriticalAxeViolations(page);
});
