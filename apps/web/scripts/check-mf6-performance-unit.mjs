import assert from "node:assert/strict";
import {
    evaluatePageLoadBudget,
    MAIN_PAGE_KEYS,
    PAGE_LOAD_BUDGET_MS,
} from "../src/utils/performance-budget.js";

assert.equal(PAGE_LOAD_BUDGET_MS, 3_000);
assert.deepEqual(MAIN_PAGE_KEYS, [
    "catalog",
    "face-analysis",
    "face-report",
    "recommendations",
    "cart",
    "checkout",
]);

// Estes asserts provam os três estados técnicos sem usar dados reais de clientes.
assert.equal(
    evaluatePageLoadBudget({ pageKey: "catalog", loadMs: 2_500 }).status,
    "ok",
);
assert.equal(
    evaluatePageLoadBudget({ pageKey: "checkout", loadMs: 3_200 }).status,
    "slow",
);
assert.equal(
    evaluatePageLoadBudget({ pageKey: "admin", loadMs: 100 }).status,
    "ignored",
);
console.log("BK-MF6-02 unit checks passed");