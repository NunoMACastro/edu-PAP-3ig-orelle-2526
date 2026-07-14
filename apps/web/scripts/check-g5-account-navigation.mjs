/**
 * Smoke estrutural do incremento G5 de conta, perfil e navegação.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageRootUrl = new URL("../", import.meta.url);
const root = fileURLToPath(packageRootUrl).replace(/\/$/, "");

/**
 * Lê um ficheiro da aplicação a partir da raiz do pacote web.
 *
 * @param {string} relativePath - Caminho relativo ao pacote.
 * @returns {Promise<string>} Conteúdo UTF-8.
 */
function readSource(relativePath) {
    return readFile(new URL(relativePath, packageRootUrl), "utf8");
}

const [app, layouts, login, profile, accountOverview, skinOverview] =
    await Promise.all([
        readSource("src/App.jsx"),
        readSource("src/components/AppLayouts.jsx"),
        readSource("src/pages/LoginPage.jsx"),
        readSource("src/pages/ProfileSetupPage.jsx"),
        readSource("src/pages/AccountOverviewPage.jsx"),
        readSource("src/pages/SkinOverviewPage.jsx"),
    ]);

assert.match(app, /path="\/conta" element=\{<AccountOverviewPage \/>\}/);
assert.match(app, /path="\/pele" element=\{<SkinOverviewPage \/>\}/);
assert.match(app, /<ConsultationLayout \/>/);
assert.match(app, /Navigate to="\/conta\/perfil" replace/);

assert.match(login, /resolvePostLoginPath/);
assert.match(layouts, /secondaryLinks=\{CLIENT_ACCOUNT_LINKS\}/);
assert.match(layouts, /user\?\.role === USER_ROLES\.ADMINISTRADOR/);
assert.match(layouts, /user\?\.role === USER_ROLES\.CONSULTOR/);

assert.match(profile, /apiRequest\("\/profile\/me", \{ signal:/);
assert.match(profile, /requestError\.status === 404/);
assert.match(profile, /resolveProfileWriteMethod\(loadState\)/);
assert.match(profile, /method,/);
assert.match(profile, /Resumo atual/);

for (const source of [profile, accountOverview, skinOverview]) {
    assert.doesNotMatch(source, /\b(?:ObjectId|Mockup|BK|stub)\b/i);
}

assert.ok(root.endsWith("/real_dev/web"));
console.log("G5 account/profile/navigation smoke: PASS");
