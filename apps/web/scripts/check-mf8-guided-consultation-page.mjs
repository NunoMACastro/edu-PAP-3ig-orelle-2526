/** Smoke estático do fluxo conversacional canónico `/consulta/*`. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, active, newConsultation, api] = await Promise.all(
    [
        "../src/App.jsx",
        "../src/features/consultation/ActiveConsultationPage.jsx",
        "../src/features/consultation/NewConsultationPage.jsx",
        "../src/features/consultation/consultationApi.js",
    ].map((file) => readFile(new URL(file, import.meta.url), "utf8")),
);

assert.match(app, /path="\/consulta\/nova"/);
assert.match(app, /path="\/consulta\/ativa"/);
assert.match(app, /path="\/consulta\/relatorios\/:reportId\/\*"/);
assert.match(active, /Pergunta \$\{/);
assert.match(active, /answerConsultationQuestion/);
assert.match(active, /submitConsultationSession/);
assert.match(newConsultation, /fotografias frontal e de perfil/);
assert.match(newConsultation, /requiresNewPhotos/);
assert.match(newConsultation, /Precisamos da tua decisão/);
assert.match(newConsultation, /Continuar com estas fotografias/);
assert.match(newConsultation, /warningHeadingRef\.current\?\.focus/);
assert.match(api, /\/ai-consultation\/sessions\/\$\{encodeURIComponent\(sessionId\)\}\/answers/);
assert.doesNotMatch(active + newConsultation, /localStorage|sessionStorage/);
assert.doesNotMatch(app, /pages\/(?:GuidedConsultation|AssistedConsultationHub)/);

console.log("MF8 consulta canónica: rotas, consentimento e conversa validados.");
