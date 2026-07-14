/** Smoke do relatório canónico, recomendações e visualização cosmética. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const [app, report, reviews, api, dist] = await Promise.all(
    [
        "../src/App.jsx",
        "../src/features/consultation/ConsultationReportPage.jsx",
        "../src/features/consultation/ConsultationReviewsPage.jsx",
        "../src/features/consultation/consultationApi.js",
        "../dist/index.html",
    ].map(async (file) => {
        const url = new URL(file, import.meta.url);
        assert.equal(existsSync(url), true, `Ficheiro em falta: ${file}`);
        return readFile(url, "utf8");
    }),
);

assert.match(app, /path="\/consulta\/relatorios\/:reportId\/\*"/);
assert.match(report, /Produtos recomendados/);
assert.match(report, /currentAvailability/);
assert.match(report, /visualizationSpec/);
assert.match(report, /createCosmeticVisualization/);
assert.match(reviews, /adjustedRecommendationIds/);
assert.match(api, /\/face-reports\/\$\{encodeURIComponent\(reportId\)\}/);
assert.match(api, /\/cosmetic-visualizations\/\$\{encodeURIComponent\(visualizationId\)\}\/image/);
assert.match(dist, /<div id="root"><\/div>/);
assert.doesNotMatch(app, /pages\/(?:ProductRecommendations|MakeupSimulation|BeforeAfterVisualization)/);

console.log("MF2 canónico: relatório, recomendações e visualização cosmética validados.");
