/**
 * Contrato estático G1 para runtime Node, API same-origin e configuração sem
 * resíduos de pagamentos externos.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const realDevRoot = path.resolve(webRoot, "..");
const apiRoot = path.resolve(realDevRoot, "api");
const EXPECTED_NODE_VERSION = "24.11.1";
const LOOPBACK_PATTERN = /(?:localhost|127\.0\.0\.1|\[?::1\]?)/i;

/**
 * Lê um ficheiro UTF-8 a partir de uma raiz conhecida.
 *
 * @async
 * @function readUtf8
 * @param {string} root - Diretório de referência.
 * @param {string} relativePath - Caminho relativo.
 * @returns {Promise<string>} Conteúdo do ficheiro.
 */
async function readUtf8(root, relativePath) {
    return readFile(path.resolve(root, relativePath), "utf8");
}

/**
 * Recolhe recursivamente os artefactos textuais relevantes de um build Vite.
 *
 * @async
 * @function collectTextBuildFiles
 * @param {string} directory - Diretório atual.
 * @returns {Promise<string[]>} Caminhos absolutos dos artefactos textuais.
 */
async function collectTextBuildFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nestedFiles = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return collectTextBuildFiles(entryPath);
            }

            return /\.(?:css|html|js|json|map|svg|txt)$/i.test(entry.name)
                ? [entryPath]
                : [];
        }),
    );

    return nestedFiles.flat();
}

const [nodeVersion, apiPackage, webPackage, apiLock, webLock, apiEnv, apiEnvExample, webEnvExample, apiClient, viteConfig] =
    await Promise.all([
        readUtf8(realDevRoot, ".nvmrc"),
        readUtf8(apiRoot, "package.json").then(JSON.parse),
        readUtf8(webRoot, "package.json").then(JSON.parse),
        readUtf8(apiRoot, "package-lock.json").then(JSON.parse),
        readUtf8(webRoot, "package-lock.json").then(JSON.parse),
        readUtf8(apiRoot, "src/config/env.js"),
        readUtf8(apiRoot, ".env.example"),
        readUtf8(webRoot, ".env.example"),
        readUtf8(webRoot, "src/services/apiClient.js"),
        readUtf8(webRoot, "vite.config.js"),
    ]);

assert.equal(nodeVersion.trim(), EXPECTED_NODE_VERSION, ".nvmrc deve fixar Node 24.11.1");
assert.equal(apiPackage.engines?.node, EXPECTED_NODE_VERSION);
assert.equal(webPackage.engines?.node, EXPECTED_NODE_VERSION);
assert.equal(apiLock.packages?.[""]?.engines?.node, EXPECTED_NODE_VERSION);
assert.equal(webLock.packages?.[""]?.engines?.node, EXPECTED_NODE_VERSION);

for (const [label, source] of [
    ["configuração API", apiEnv],
    [".env.example API", apiEnvExample],
]) {
    assert.doesNotMatch(source, /STRIPE_SECRET_KEY|stripeSecretKey/i, `${label} contém Stripe`);
}

assert.match(apiClient, /API_BASE_URL\s*=\s*["']\/api["']/, "cliente deve usar /api");
assert.doesNotMatch(apiClient, /VITE_API_BASE_URL/, "cliente não deve aceitar host por env");
assert.doesNotMatch(apiClient, LOOPBACK_PATTERN, "cliente não deve conter loopback");
assert.doesNotMatch(webEnvExample, /VITE_API_BASE_URL/, ".env não deve sugerir host no bundle");
assert.match(viteConfig, /["']\/api["']\s*:/, "Vite deve encaminhar /api");
assert.match(viteConfig, /LOCAL_API_PROXY_TARGET/, "proxy local deve ser explícito");

const distDirectory = path.resolve(webRoot, "dist");
const buildFiles = await collectTextBuildFiles(distDirectory);

for (const filePath of buildFiles) {
    const source = await readFile(filePath, "utf8");
    assert.doesNotMatch(
        source,
        LOOPBACK_PATTERN,
        `bundle contém endereço loopback em ${path.relative(webRoot, filePath)}`,
    );
}

console.log(
    `G1 config OK: Node ${EXPECTED_NODE_VERSION}, /api same-origin e ${buildFiles.length} artefactos sem loopback`,
);
