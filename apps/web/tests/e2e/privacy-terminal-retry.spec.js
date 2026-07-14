/**
 * Prova browser dos dois estados destrutivos de privacidade que exigem
 * persistência real: retry com eliminação verificada e conta terminal.
 */
import { expect, test } from "@playwright/test";
import {
    browserApiRequest,
    loginAs,
    logoutViaUi,
} from "./helpers/auth.js";
import {
    getE2ECredentials,
    getE2EPrivacyReportId,
    isMutationReferenceProject,
} from "./helpers/environment.js";

test("admin reprocessa falha e a ausência física do relatório é observável", async ({
    page,
}, testInfo) => {
    test.skip(
        !isMutationReferenceProject(testInfo.project.name),
        "O retry destrutivo corre uma vez sobre a fixture efémera dedicada",
    );
    test.setTimeout(60_000);

    await loginAs(page, "administrador", testInfo.project.name);
    await page.goto("/admin/pedidos-privacidade");
    await expect(
        page.getByRole("heading", { name: "Privacidade", level: 1 }),
    ).toBeVisible();

    const failedRequest = page
        .getByRole("button")
        .filter({ hasText: "Falhou — pode ser reprocessado" })
        .first();
    await expect(failedRequest).toBeVisible();
    await failedRequest.click();
    await expect(
        page.getByRole("heading", { name: "Reprocessar falha", level: 3 }),
    ).toBeVisible();
    await page
        .getByLabel("Nota de reprocessamento opcional")
        .fill("Retry E2E com verificação do recurso eliminado.");
    await page
        .getByLabel(/Escreve REPROCESSAR para confirmar/i)
        .fill("REPROCESSAR");

    const retryResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            /\/api\/admin\/privacy-requests\/[^/]+\/retry$/.test(
                new URL(response.url()).pathname,
            ),
    );
    let retryRequestCount = 0;
    const countRetryRequest = (request) => {
        if (
            request.method() === "POST" &&
            /\/api\/admin\/privacy-requests\/[^/]+\/retry$/.test(
                new URL(request.url()).pathname,
            )
        ) {
            retryRequestCount += 1;
        }
    };
    page.on("request", countRetryRequest);
    await page
        .getByRole("button", { name: "Reprocessar pedido" })
        .evaluate((button) => {
            button.click();
            button.click();
        });
    const retryResponse = await retryResponsePromise;
    expect(retryRequestCount).toBe(1);
    page.off("request", countRetryRequest);
    expect(retryResponse.status()).toBe(200);
    const retryPayload = await retryResponse.json();
    expect(retryPayload.request?.status).toBe("completed");
    expect(retryPayload.request?.attempts).toBe(2);
    expect(retryPayload.request?.completedAt).toBeTruthy();
    await expect(
        page.getByText(
            "Pedido reprocessado e estado atualizado.",
        ),
    ).toBeVisible();
    await expect(page.getByText("Concluído").first()).toBeVisible();

    // A confirmação não depende só do estado do job: o antigo endpoint do
    // próprio titular tem de devolver 404 para o relatório removido.
    await logoutViaUi(page);
    await loginAs(page, "cliente_existente", testInfo.project.name);
    const csrfResponse = await browserApiRequest(page, "/api/auth/csrf");
    expect(csrfResponse.status).toBe(200);
    const removedReport = await browserApiRequest(
        page,
        `/api/face-reports/${getE2EPrivacyReportId()}/unlock/simulate-payment`,
        {
            method: "POST",
            headers: {
                "Idempotency-Key": "privacy-proof-report-removed",
                "X-CSRF-Token": csrfResponse.body.csrfToken,
            },
        },
    );
    expect(removedReport.status).toBe(404);
});

test("titular elimina a conta e a autenticação fica terminal", async ({
    page,
}, testInfo) => {
    test.skip(
        !isMutationReferenceProject(testInfo.project.name),
        "A eliminação terminal corre uma vez sobre uma conta seed exclusiva",
    );
    test.setTimeout(60_000);

    const credentials = getE2ECredentials(
        "cliente_eliminar",
        testInfo.project.name,
    );
    await loginAs(page, "cliente_eliminar", testInfo.project.name);
    await page.goto("/conta/privacidade-biometrica");
    await page
        .getByText("Zona de risco — eliminar conta", { exact: true })
        .click();
    await page.getByLabel("Password atual").fill(credentials.password);
    await page
        .getByLabel(/Escreve ELIMINAR para confirmar/i)
        .fill("ELIMINAR");

    const erasureResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "DELETE" &&
            new URL(response.url()).pathname === "/api/me/account",
    );
    let erasureRequestCount = 0;
    const countErasureRequest = (request) => {
        if (
            request.method() === "DELETE" &&
            new URL(request.url()).pathname === "/api/me/account"
        ) {
            erasureRequestCount += 1;
        }
    };
    page.on("request", countErasureRequest);
    await page
        .getByRole("button", { name: "Eliminar a minha conta" })
        .evaluate((button) => {
            button.click();
            button.click();
        });
    const erasureResponse = await erasureResponsePromise;
    expect(erasureRequestCount).toBe(1);
    page.off("request", countErasureRequest);
    expect([200, 202]).toContain(erasureResponse.status());
    const erasurePayload = await erasureResponse.json();
    expect(erasurePayload.account?.status).toBe("deleted");
    await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(page.getByRole("status")).toContainText("Conta eliminada");

    const revokedSession = await browserApiRequest(page, "/api/auth/me");
    expect(revokedSession.status).toBe(401);

    const repeatedLoginPromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/auth/login",
    );
    await page.getByLabel("Email").fill(credentials.email);
    await page
        .getByLabel("Palavra-passe", { exact: true })
        .fill(credentials.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    const repeatedLogin = await repeatedLoginPromise;
    expect(repeatedLogin.status()).toBe(401);
    await expect(page.getByRole("alert")).toContainText("Credenciais");
});
