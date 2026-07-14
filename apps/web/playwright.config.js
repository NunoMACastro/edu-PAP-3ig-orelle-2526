/**
 * Configuração browser E2E da aplicação Orélle.
 *
 * A infraestrutura (MongoDB efémero, API, build e gateway same-origin) é
 * responsabilidade do orquestrador de `real_dev/api`. Esta configuração nunca
 * inicia serviços nem aceita uma origem remota por engano.
 */
import { defineConfig, devices } from "@playwright/test";
import process from "node:process";
import { getE2EBaseUrl } from "./tests/e2e/helpers/environment.js";

const baseURL = getE2EBaseUrl();

export default defineConfig({
    testDir: "./tests/e2e",
    outputDir: "./test-results/e2e-artifacts",
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    forbidOnly: Boolean(process.env.CI),
    reporter: [
        ["line"],
        [
            "html",
            {
                outputFolder: "playwright-report/e2e-html-report",
                open: "never",
            },
        ],
    ],
    use: {
        baseURL,
        actionTimeout: 10_000,
        navigationTimeout: 20_000,
        screenshot: "only-on-failure",
        video: "off",
        // Traces podem persistir cookies HttpOnly e provas CSRF. Mantê-los
        // desligados é uma barreira deliberada contra artefactos com segredos.
        trace: "off",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],
});
