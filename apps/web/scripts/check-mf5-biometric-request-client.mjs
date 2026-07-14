import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");

/**
 * Le um ficheiro do frontend e devolve o seu conteudo textual.
 *
 * @async
 * @function readSource
 * @param {string} relativePath - Caminho relativo ao root web.
 * @returns {Promise<string>} Conteudo UTF-8.
 */
async function readSource(relativePath) {
    return readFile(resolve(webRoot, relativePath), "utf8");
}

/**
 * Garante que um fragmento existe no conteudo de um ficheiro.
 *
 * @function assertContains
 * @param {string} content - Conteudo do ficheiro.
 * @param {string} fragment - Fragmento esperado.
 * @param {string} label - Nome do ficheiro para erro.
 * @returns {void}
 * @throws {Error} Quando o fragmento esperado nao existe no ficheiro.
 */
function assertContains(content, fragment, label) {
    if (!content.includes(fragment)) {
        throw new Error(`${label} nao contem: ${fragment}`);
    }
}

const page = await readSource("src/pages/BiometricDataRequestPage.jsx");
const app = await readSource("src/App.jsx");
const privacyContracts = await readSource("src/services/privacyManagement.js");

for (const fragment of [
    "PRIVACY_ENDPOINTS.myRequests",
    "PRIVACY_ENDPOINTS.eraseAccount",
    "FeedbackMessage",
    "SubmitButton",
    "resources: form.resources",
    "reason: form.reason",
    "confirmation: \"\"",
]) {
    assertContains(page, fragment, "src/pages/BiometricDataRequestPage.jsx");
}

for (const fragment of [
    'myRequests: "/me/privacy-requests"',
    'eraseAccount: "/me/account"',
    'ACCOUNT_ERASURE_CONFIRMATION = "ELIMINAR"',
]) {
    assertContains(
        privacyContracts,
        fragment,
        "src/services/privacyManagement.js",
    );
}

if (/name=["'](?:requesterId|userId|requestId)["']/.test(page)) {
    throw new Error("A UI de cliente nao deve pedir identificadores tecnicos.");
}

if (page.includes("/me/biometric-data-requests")) {
    throw new Error("A UI de cliente deve usar apenas o endpoint canonico.");
}

assertContains(app, "BiometricDataRequestPage", "src/App.jsx");
assertContains(app, 'path="/conta/privacidade-biometrica"', "src/App.jsx");
assertContains(app, "<RequireRole allowedRoles={CLIENT_ONLY}>", "src/App.jsx");
assertContains(app, "<ClientLayout />", "src/App.jsx");

console.log("BK-MF5-01 client privacy-request smoke: PASS");
