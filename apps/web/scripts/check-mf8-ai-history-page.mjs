/** Smoke estático do histórico canónico e minimizado. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, page, api] = await Promise.all(
    [
        "../src/App.jsx",
        "../src/features/consultation/ConsultationHistoryPage.jsx",
        "../src/features/consultation/consultationApi.js",
    ].map((file) => readFile(new URL(file, import.meta.url), "utf8")),
);

assert.match(app, /path="\/consulta\/historico"/);
assert.match(page, /listConsultationHistory/);
assert.match(page, /Continuar consulta/);
assert.match(page, /Abrir relatório/);
assert.match(api, /\/ai-consultation\/sessions\?limit=20/);
assert.match(page, /Histórico seguro e minimizado/);
assert.doesNotMatch(page, /event\.(?:transcript|photos|answers)/);
assert.doesNotMatch(app, /pages\/AiHistory/);

console.log("MF8 histórico canónico: sessão, relatório e minimização validados.");
