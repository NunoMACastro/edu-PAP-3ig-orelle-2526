/**
 * Checks unitarios dos contratos de performance frontend da MF6.
 *
 * Este script evita depender de browser para validar o helper que traduz RNF06
 * para estados tecnicos minimizados usados pela UI.
 */
import assert from "node:assert/strict";

import {
    evaluatePageLoad,
    MAIN_PAGE_KEYS,
    PAGE_LOAD_BUDGET_MS,
} from "../src/utils/performanceBudget.js";

assert.equal(PAGE_LOAD_BUDGET_MS, 3000, "RNF06 deve usar budget de 3 segundos.");

assert.deepEqual(
    MAIN_PAGE_KEYS,
    ["catalog", "face-analysis", "face-report", "recommendations", "cart", "checkout"],
    "BK-MF6-02 deve medir exatamente as seis paginas principais.",
);

assert.equal(
    evaluatePageLoad({ pageKey: "catalog", durationMs: 2500 }).status,
    "ok",
    "Catalogo dentro do budget deve ficar ok.",
);

assert.equal(
    evaluatePageLoad({ pageKey: "checkout", durationMs: 3200 }).status,
    "slow",
    "Checkout acima do budget deve ficar slow.",
);

assert.equal(
    evaluatePageLoad({ pageKey: "admin", durationMs: 100 }).status,
    "ignored",
    "Paginas fora do contrato RNF06 devem ser ignoradas.",
);

const slowMetric = evaluatePageLoad({ pageKey: "face-analysis", durationMs: 3200 });
for (const sensitiveToken of ["@", "cookie", "token", "storageKey", "password"]) {
    assert.equal(
        JSON.stringify(slowMetric).includes(sensitiveToken),
        false,
        `Metricas de performance nao devem conter ${sensitiveToken}.`,
    );
}

console.log("BK-MF6-02 performance unit checks passed");
