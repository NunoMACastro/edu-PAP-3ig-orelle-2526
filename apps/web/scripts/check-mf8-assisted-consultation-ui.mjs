/** Smoke estático da integração end-to-end da consulta OpenAI. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, dashboard, active, report, reviews] = await Promise.all(
    [
        "../src/App.jsx",
        "../src/features/consultation/ConsultationDashboardPage.jsx",
        "../src/features/consultation/ActiveConsultationPage.jsx",
        "../src/features/consultation/ConsultationReportPage.jsx",
        "../src/features/consultation/ConsultationReviewsPage.jsx",
    ].map((file) => readFile(new URL(file, import.meta.url), "utf8")),
);

assert.match(app, /ConsultationDashboardPage/);
assert.match(app, /ConsultationReportPage/);
assert.match(app, /path="\/consultoria\/revisoes"/);
assert.match(dashboard, /useConsultationAvailability/);
assert.match(dashboard, /consultation-dashboard__progress/);
assert.match(active, /getSessionPhase/);
assert.match(active, /Guardar e continuar/);
assert.match(active, /Rever respostas/);
assert.match(report, /A revisão humana é opcional/);
assert.match(report, /Finalizar o meu plano/);
assert.match(report, /Simular pagamento e desbloquear/);
assert.match(report, /Pré-visualização cosmética/);
assert.match(reviews, /decideConsultationReview/);
assert.doesNotMatch(app, /pages\/(?:Assisted|ProductRecommendations|FaceAnalysis)/);

console.log("MF8 UI integrada: dashboard, segundo wizard, report e revisão validados.");
