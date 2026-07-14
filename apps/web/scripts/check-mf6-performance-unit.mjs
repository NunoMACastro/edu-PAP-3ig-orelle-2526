/**
 * Checks unitários da avaliação de Web Vitals real.
 */
import assert from "node:assert/strict";
import {
    evaluateWebVitals,
    MAIN_PAGE_KEYS,
    WEB_VITAL_BUDGETS,
} from "../src/utils/performanceBudget.js";

assert.equal(WEB_VITAL_BUDGETS.lcpMs, 3_000);
assert.equal(WEB_VITAL_BUDGETS.cls, 0.1);
assert.deepEqual(MAIN_PAGE_KEYS, [
    "catalog",
    "guided-consultation",
    "consultation-report",
    "ai-history",
    "cart",
    "checkout",
]);

assert.equal(
    evaluateWebVitals({
        pageKey: "catalog",
        lcpMs: 2_500,
        cls: 0.05,
        supportsLcp: true,
        supportsCls: true,
    }).status,
    "monitoring",
    "A UI não deve converter uma amostra intermédia num PASS.",
);
assert.equal(
    evaluateWebVitals({
        pageKey: "checkout",
        lcpMs: 3_200,
        cls: 0.02,
        supportsLcp: true,
        supportsCls: true,
    }).status,
    "slow",
);
assert.equal(
    evaluateWebVitals({ pageKey: "catalog" }).status,
    "unsupported",
);
assert.equal(
    evaluateWebVitals({
        pageKey: "admin",
        lcpMs: 100,
        supportsLcp: true,
    }).status,
    "ignored",
);

const metric = evaluateWebVitals({
    pageKey: "guided-consultation",
    lcpMs: 3_200,
    supportsLcp: true,
});
for (const sensitiveToken of ["@", "cookie", "token", "password"]) {
    assert.equal(JSON.stringify(metric).includes(sensitiveToken), false);
}

console.log("MF6 Web Vitals unit checks passed");
