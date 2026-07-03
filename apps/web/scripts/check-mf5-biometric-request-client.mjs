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
 */
function assertContains(content, fragment, label) {
    if (!content.includes(fragment)) {
        throw new Error(`${label} nao contem: ${fragment}`);
    }
}

const page = await readSource("src/pages/BiometricDataRequestPage.jsx");
const app = await readSource("src/App.jsx");

for (const fragment of [
    "apiRequest(\"/me/biometric-data-requests\"",
    "FeedbackMessage",
    "SubmitButton",
    "resources: form.resources",
    "reason: form.reason",
    "Inicia sessao como cliente",
]) {
    assertContains(page, fragment, "src/pages/BiometricDataRequestPage.jsx");
}

if (page.includes("requesterId")) {
    throw new Error("A UI de cliente nao deve enviar requesterId.");
}

assertContains(app, "BiometricDataRequestPage", "src/App.jsx");

console.log("BK-MF5-01 client privacy-request smoke: PASS");
