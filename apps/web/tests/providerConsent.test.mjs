/** Contrato frontend do consentimento OpenAI v2. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
    new URL(
        "../src/features/consultation/NewConsultationPage.jsx",
        import.meta.url,
    ),
    "utf8",
);

test("enumera os dados enviados e pede consentimento OpenAI v2", () => {
    assert.match(source, /getFaceConsent/);
    assert.match(source, /providerConsentRequirement\?\.required/);
    assert.match(source, /providerConsentAccepted/);
    assert.match(source, /noticeVersion/);
    assert.match(source, /fotografias frontal e de perfil/);
    assert.match(source, /respostas e os factos cosméticos derivados/);
    assert.match(source, /perfil mínimo relevante/);
    assert.match(source, /catálogo já filtrado/);
    assert.match(source, /sem autorização de\s+treino/);
});

test("não incorpora credenciais ou URL de provider no frontend", () => {
    assert.doesNotMatch(source, /OPENAI_API_KEY|AI_PROVIDER_KEY|Bearer\s/i);
    assert.doesNotMatch(source, /api\.openai\.com|AI_PROVIDER_URL/);
});

test("não persiste fotografias, respostas ou consentimento no browser", () => {
    assert.doesNotMatch(source, /localStorage|sessionStorage|FileReader/);
    assert.match(source, /acceptFaceConsent/);
    assert.match(source, /version: "face-analysis-v2"/);
});
