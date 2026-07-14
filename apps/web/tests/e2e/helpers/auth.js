/**
 * Ações de autenticação browser usando apenas nomes acessíveis.
 */
import { expect } from "@playwright/test";
import { getE2ECredentials } from "./environment.js";

const ROLE_DESTINATIONS = Object.freeze({
    cliente: /\/conta(?:[/?#]|$)/,
    cliente_existente: /\/conta(?:[/?#]|$)/,
    cliente_eliminar: /\/conta(?:[/?#]|$)/,
    consultor: /\/consultoria\/revisoes(?:[/?#]|$)/,
    administrador: /\/admin(?:[/?#]|$)/,
});
const SESSION_ROLES = Object.freeze({
    cliente: "Cliente",
    cliente_existente: "Cliente",
    cliente_eliminar: "Cliente",
    consultor: "Consultor",
    administrador: "Administrador",
});
const ROLE_CLIENT_IPS = Object.freeze({
    cliente: "192.0.2.11",
    cliente_existente: "192.0.2.12",
    cliente_eliminar: "192.0.2.13",
    consultor: "192.0.2.21",
    administrador: "192.0.2.31",
});

/**
 * Inicia uma sessão real por cookie HttpOnly e confirma o destino da role.
 *
 * @param {import("@playwright/test").Page} page - Página isolada do teste.
 * @param {"cliente"|"cliente_existente"|"cliente_eliminar"|"consultor"|"administrador"} role - Identidade pretendida.
 * @param {string} projectName - Projeto Playwright atual.
 * @returns {Promise<void>} Conclusão após autenticação e redirect.
 */
export async function loginAs(page, role, projectName) {
    const credentials = getE2ECredentials(role, projectName);
    const clientIp = ROLE_CLIENT_IPS[role];
    if (!clientIp) throw new Error("Identidade de rede E2E não suportada");

    // Cada identidade representa um browser distinto atrás do único proxy
    // Vite loopback confiado pelo runtime E2E. Os endereços TEST-NET não são
    // roteáveis e evitam colidir artificialmente no limite de login por IP.
    await page.setExtraHTTPHeaders({ "X-Forwarded-For": clientIp });

    await page.goto("/login");
    await expect(
        page.getByRole("heading", { name: "Iniciar sessão", level: 1 }),
    ).toBeVisible();
    await page.getByLabel("Email").fill(credentials.email);
    await page
        .getByLabel("Palavra-passe", { exact: true })
        .fill(credentials.password);

    const loginResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/auth/login",
    );
    await page.getByRole("button", { name: "Entrar" }).click();
    const loginResponse = await loginResponsePromise;

    expect(loginResponse.status()).toBe(200);
    await expect(page).toHaveURL(ROLE_DESTINATIONS[role]);
    const accountButton = page.getByRole("button", { name: "Abrir menu da conta" });
    await expect(accountButton).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Terminar sessão" }),
    ).toBeVisible();
    await accountButton.click();
    await expect(page.getByRole("dialog", { name: "Conta e sessão" })).toContainText(
        SESSION_ROLES[role],
    );
    await page.keyboard.press("Escape");
}

/**
 * Termina a sessão pela ação visível do shell.
 *
 * @param {import("@playwright/test").Page} page - Página autenticada.
 * @param {{expectedDestination?: "login"|"public"}} [options] - Comportamento esperado para rotas protegidas ou públicas.
 * @returns {Promise<void>} Conclusão depois do backend revogar a sessão.
 */
export async function logoutViaUi(
    page,
    { expectedDestination = "login" } = {},
) {
    const logoutButton = page.getByRole("button", { name: "Terminar sessão" });
    const logoutResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/auth/logout",
    );
    await logoutButton.click();
    const logoutResponse = await logoutResponsePromise;

    expect(logoutResponse.status()).toBe(204);
    if (expectedDestination === "login") {
        await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
        return;
    }

    await expect(logoutButton).not.toBeVisible();
    await expect(
        page.getByRole("link", { name: "Iniciar sessão" }).first(),
    ).toBeVisible();
}

/**
 * Executa `fetch` same-origin dentro do browser sem persistir headers sensíveis.
 *
 * @param {import("@playwright/test").Page} page - Página com o cookie de sessão.
 * @param {string} path - Endpoint real iniciado por `/api/`.
 * @param {{method?: string, headers?: Record<string, string>, body?: string}} [options] - Pedido controlado.
 * @returns {Promise<{status: number, body: object|null}>} Resposta pública mínima.
 */
export async function browserApiRequest(page, path, options = {}) {
    if (!path.startsWith("/api/")) {
        throw new Error("O helper E2E só aceita endpoints same-origin /api/");
    }

    return page.evaluate(
        async ({ requestPath, requestOptions }) => {
            const response = await fetch(requestPath, {
                method: requestOptions.method ?? "GET",
                headers: requestOptions.headers,
                body: requestOptions.body,
                credentials: "include",
            });
            const text = await response.text();
            let body = null;

            if (text) {
                try {
                    body = JSON.parse(text);
                } catch {
                    body = { malformedJson: true };
                }
            }

            return { status: response.status, body };
        },
        { requestPath: path, requestOptions: options },
    );
}
