/** Contratos de integração dos labels fail-closed nas páginas consumidoras. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = Object.fromEntries(
    await Promise.all(
        [
            ["home", "../src/components/OrelleMockupHome.jsx"],
            ["productCard", "../src/components/ProductCard.jsx"],
            ["productPresentation", "../src/services/productPresentation.js"],
            ["catalog", "../src/pages/ProductSearchPage.jsx"],
            ["productAdmin", "../src/pages/AdminProductCreatePage.jsx"],
            ["comparison", "../src/pages/SkinComparisonPage.jsx"],
            ["evolution", "../src/pages/SkinEvolutionPage.jsx"],
            ["privacyClient", "../src/pages/BiometricDataRequestPage.jsx"],
            ["privacyAdmin", "../src/pages/BiometricDataRequestsAdminPage.jsx"],
            ["audit", "../src/pages/BiometricAuditPage.jsx"],
        ].map(async ([name, path]) => [
            name,
            await readFile(new URL(path, import.meta.url), "utf8"),
        ]),
    ),
);

test("todas as superfícies de pele usam o label canónico", () => {
    for (const name of [
        "catalog",
        "productAdmin",
        "comparison",
        "evolution",
    ]) {
        assert.match(files[name], /getSkinTypeLabel/);
    }

    assert.match(files.home, /ProductCard/);
    assert.match(files.productCard, /formatProductSkinTypes/);
    assert.match(files.productPresentation, /getSkinTypeLabel/);
    assert.doesNotMatch(files.home, /skinTypes\.slice\(0, 2\)\.join/);
    assert.doesNotMatch(files.catalog, />\s*\{type\}\s*</);
    assert.doesNotMatch(files.productAdmin, />\s*\{skinType\}\s*</);
    assert.doesNotMatch(files.comparison, /pele \{analysis\.skinType\}/);
    assert.doesNotMatch(files.evolution, /replaceAll\("_", " "\)/);
});

test("pedidos de privacidade usam labels tipados para todos os campos", () => {
    for (const source of [files.privacyClient, files.privacyAdmin]) {
        assert.match(source, /getPrivacyScopeLabel/);
        assert.match(source, /getPrivacyActionLabel/);
        assert.match(source, /getPrivacyStatusLabel/);
        assert.match(source, /getPrivacyResourceLabel/);
        assert.doesNotMatch(source, /getPrivacyLabel\(/);
    }
});

test("auditoria não traduz enums por underscore nem os reflete", () => {
    assert.match(files.audit, /getBiometricAuditEventLabel\(event\.action\)/);
    assert.match(files.audit, /getBiometricAuditOutcomeLabel\(event\.result\)/);
    assert.match(
        files.audit,
        /getBiometricAuditResourceLabel\(event\.resourceType\)/,
    );
    assert.doesNotMatch(files.audit, /replaceAll\("_", " "\)/);
    assert.doesNotMatch(files.audit, /\{event\.(?:action|result|resourceType)\}/);
});
