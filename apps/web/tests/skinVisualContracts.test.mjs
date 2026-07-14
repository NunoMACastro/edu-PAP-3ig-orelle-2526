/**
 * Testes estáticos dos contratos públicos de comparação e maquilhagem.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const comparisonSource = await readFile(
    new URL("../src/pages/SkinComparisonPage.jsx", import.meta.url),
    "utf8",
);
const homeSource = await readFile(
    new URL("../src/components/OrelleMockupHome.jsx", import.meta.url),
    "utf8",
);
const stylesSource = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
);
const evolutionSource = await readFile(
    new URL("../src/pages/SkinEvolutionPage.jsx", import.meta.url),
    "utf8",
);

test("comparação escolhe momentos por data e nunca pede IDs técnicos", () => {
    assert.match(comparisonSource, /skin-analyses\/comparison-options/);
    assert.match(comparisonSource, /Momento inicial/);
    assert.match(comparisonSource, /Momento final/);
    assert.match(comparisonSource, /baselineSelection, followUpSelection/);
    assert.doesNotMatch(comparisonSource, /ID da análise|ObjectId|analysisId/);
    assert.doesNotMatch(comparisonSource, /<input/);
});

test("evolução oferece os valores do gráfico numa tabela acessível", () => {
    assert.match(evolutionSource, /<table>/);
    assert.match(evolutionSource, /Valores da evolução cosmética por data/);
    assert.match(evolutionSource, /<th scope="col">/);
    assert.match(evolutionSource, /<th scope="row">/);
    assert.match(evolutionSource, /sem depender da cor ou do gráfico/);
    assert.doesNotMatch(evolutionSource, />\s*\{point\.analysisId\}\s*</);
});

test("comparação tem estado vazio, fotografias autorizadas e tabela acessível", () => {
    assert.match(comparisonSource, /pelo menos duas análises concluídas/);
    assert.match(comparisonSource, /Fotografia autorizada da análise/);
    assert.match(comparisonSource, /<table>/);
    assert.match(comparisonSource, /className="table-scroll"/);
    assert.match(comparisonSource, /role="region"/);
    assert.match(comparisonSource, /tabIndex=\{0\}/);
    assert.match(comparisonSource, /<caption>Métricas cosméticas nos dois momentos<\/caption>/);
    assert.match(comparisonSource, /<th scope="col">/);
    assert.match(comparisonSource, /<th scope="row">/);
});

test("home apresenta apenas uma inspiração de maquilhagem claramente identificada", () => {
    assert.doesNotMatch(homeSource, /orelle-skin-analysis-(?:before|after)/);
    assert.doesNotMatch(homeSource, /mockup-photo-pair/);
    assert.doesNotMatch(
        homeSource,
        /OpenAI|Exemplo ilustrativo|Exemplo publicitário|mockup-chat-(?:transcript|message)/i,
    );
    assert.match(homeSource, /<h2 id="mockup-ai-title">\s*Beleza que parte de ti\s*<\/h2>/);
    assert.match(homeSource, /aria-label="Benefícios da consulta"/);
    assert.match(homeSource, /src="\/home\/orelle-makeup-original-960\.webp"/);
    assert.match(homeSource, /src="\/home\/orelle-makeup-preview-960\.webp"/);
    assert.match(
        stylesSource,
        /\.mockup-makeup-preview img,[\s\S]*?height:\s*auto;[\s\S]*?aspect-ratio:\s*1 \/ 1/,
    );
    assert.equal(
        (
            homeSource.match(
                /Imagem gerada por IA — o resultado real poderá variar\./g,
            ) ?? []
        ).length,
        1,
    );
});

test("eyebrow da inspiração usa um token de texto com contraste", () => {
    const selectorIndex = stylesSource.indexOf(
        ".mockup-consultation-showcase__eyebrow",
    );
    const ruleStart = stylesSource.lastIndexOf("}", selectorIndex) + 1;
    const ruleEnd = stylesSource.indexOf("}", selectorIndex) + 1;
    const labelRule = selectorIndex >= 0 && ruleEnd > 0
        ? stylesSource.slice(ruleStart, ruleEnd)
        : "";

    assert.ok(labelRule);
    assert.match(
        labelRule,
        /color:\s*var\(--(?:muted|brand-accent-text)\)/,
    );
    assert.doesNotMatch(labelRule, /color:\s*var\(--mockup-secondary\)/);
});

test("home separa cuidados de pele da maquilhagem com conversa estática acessível", () => {
    assert.match(
        homeSource,
        /<section[\s\S]*?className="mockup-ai-section"[\s\S]*?<section[\s\S]*?className="mockup-skin-section"[\s\S]*?<section className="mockup-features-section"/,
    );
    assert.match(homeSource, /<h2 id="mockup-skin-title">\s*Compreender a tua pele muda tudo\s*<\/h2>/);
    assert.match(homeSource, /<ol\s+className="mockup-skin-dialogue__messages"/);
    assert.equal(
        (homeSource.match(/className="mockup-skin-dialogue__message /g) ?? [])
            .length,
        4,
    );
    assert.doesNotMatch(
        homeSource.match(
            /<article\s+className="mockup-skin-dialogue"[\s\S]*?<\/article>/,
        )?.[0] ?? "",
        /<form\b|<input\b|<button\b|typing|polling/i,
    );
    assert.match(
        stylesSource,
        /\.mockup-skin-grid\s*\{[\s\S]*?grid-template-areas:\s*"dialogue copy"/,
    );
    assert.match(
        stylesSource,
        /@media \(max-width: 920px\)[\s\S]*?\.mockup-skin-grid\s*\{[\s\S]*?"copy"[\s\S]*?"dialogue"/,
    );
});
