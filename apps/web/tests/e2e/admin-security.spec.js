/**
 * Roles, modal acessível, CSRF negativo e revogação imediata da sessão.
 */
import { expect, test } from "@playwright/test";
import { expectNoSeriousOrCriticalAxeViolations } from "./helpers/accessibility.js";
import { browserApiRequest, loginAs } from "./helpers/auth.js";
import { isMutationReferenceProject } from "./helpers/environment.js";

test("admin respeita role, focus trap, CSRF e logout-all", async ({
    page,
}, testInfo) => {
    test.skip(
        !isMutationReferenceProject(testInfo.project.name),
        "A sessão administrativa mutável corre uma vez sobre o seed partilhado",
    );

    await loginAs(page, "administrador", testInfo.project.name);
    await page.goto("/");
    await expect(
        page
            .getByRole("navigation", { name: "Navegação principal" })
            .getByRole("link", { name: "Área de administração" }),
    ).toBeVisible();
    await page.goto("/produtos");
    await expect(
        page
            .getByRole("navigation", { name: "Navegação Orélle" })
            .getByRole("link", { name: "Área de administração" }),
    ).toBeVisible();
    await page.goto("/admin/produtos");
    await expect(
        page.getByRole("heading", { name: "Produtos", level: 1 }),
    ).toBeVisible();
    const curationTrigger = page
        .getByRole("button", { name: /^Editar curadoria de / })
        .first();
    await expect(curationTrigger).toBeVisible();
    await curationTrigger.click();
    const curationDialog = page.getByRole("dialog", { name: /^Editar / });
    await expect(curationDialog).toBeVisible();
    await expect(page.getByLabel(/identificador/i)).toHaveCount(0);
    await curationDialog.getByRole("button", { name: "Fechar modal" }).click();
    await expect(curationDialog).toBeHidden();
    await expect(curationTrigger).toBeFocused();
    await expectNoSeriousOrCriticalAxeViolations(page);
    await page.goto("/admin/utilizadores");
    await expect(
        page.getByRole("heading", { name: "Utilizadores", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await expectNoSeriousOrCriticalAxeViolations(page);

    const deactivateTrigger = page
        .getByRole("button", { name: "Desativar conta" })
        .first();
    await deactivateTrigger.click();
    const dialog = page.getByRole("dialog", { name: /Desativar conta/i });
    await expect(dialog).toBeVisible();
    const confirmation = dialog.getByLabel(/Escreve DESATIVAR para confirmar/i);
    await expect(confirmation).toBeFocused();
    await confirmation.fill("DESATIVAR");
    const confirmButton = dialog.getByRole("button", { name: /Desativar conta/i });
    await confirmation.press("Shift+Tab");
    await expect(confirmButton).toBeFocused();
    await confirmButton.press("Tab");
    await expect(confirmation).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(deactivateTrigger).toBeFocused();

    await page.goto("/conta");
    await expect(
        page.getByRole("heading", {
            name: "Esta área não está disponível para o teu perfil de acesso.",
            level: 1,
        }),
    ).toBeVisible();

    const missingCsrf = await browserApiRequest(page, "/api/auth/logout-all", {
        method: "POST",
    });
    expect(missingCsrf.status).toBe(403);

    const csrfResponse = await browserApiRequest(page, "/api/auth/csrf");
    expect(csrfResponse.status).toBe(200);
    const csrfToken = csrfResponse.body?.csrfToken;
    expect(typeof csrfToken).toBe("string");
    expect(csrfToken).toHaveLength(43);

    const logoutAll = await browserApiRequest(page, "/api/auth/logout-all", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
    });
    expect(logoutAll.status).toBe(204);

    const revokedSession = await browserApiRequest(page, "/api/auth/me");
    expect(revokedSession.status).toBe(401);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});
