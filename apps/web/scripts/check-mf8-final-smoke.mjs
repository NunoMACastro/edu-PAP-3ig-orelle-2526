/**
 * Smoke estatico do BK-MF8-15.
 *
 * Confirma que a matriz final, o contrato de evidence e o teste focal existem
 * antes de o BK-MF8-16 executar a bateria final de testes.
 */
import { access, readFile } from "node:fs/promises";

const FILES = {
    matrix: new URL("../../../docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md", import.meta.url),
    contract: new URL("../../api/tests/evidence/bk-mf8-15.evidence-contract.js", import.meta.url),
    test: new URL("../../api/tests/mf8.final-contracts.test.js", import.meta.url),
    smoke: new URL("./check-mf8-final-smoke.mjs", import.meta.url),
};

const REQUIRED_MARKERS = {
    matrix: [
        "BK-MF8-15",
        "RNF27",
        "proof_api",
        "proof_web_build",
        "proof_mf8_smoke",
        "proof_e2e",
        "TODO (BLOCKER)",
        "Handoff para BK-MF8-16",
    ],
    contract: [
        "validarBKMF815Matrix",
        "proof_e2e",
        "lacuna_controlada",
        "MINIMUM_NEGATIVE_SCENARIOS",
    ],
    test: [
        "BK-MF8-15 / RNF27",
        "falha quando falta proof_e2e",
        "falha quando ha menos de tres negativos P0",
        "falha quando uma linha expoe conteudo sensivel",
    ],
    smoke: [
        "check-mf8-final-smoke",
        "TESTES-ATUAIS-E-LACUNAS.md",
        "bk-mf8-15.evidence-contract.js",
    ],
};

/**
 * Confirma que um ficheiro existe.
 *
 * @param {string} label - Nome logico do ficheiro.
 * @param {URL} file - Caminho absoluto derivado de `import.meta.url`.
 * @returns {Promise<void>}
 * @throws {Error} Quando o ficheiro nao existe.
 */
async function assertFileExists(label, file) {
    try {
        await access(file);
    } catch {
        throw new Error(`Ficheiro obrigatorio em falta: ${label}`);
    }
}

/**
 * Confirma que o conteudo contem todos os marcadores de contrato.
 *
 * @param {string} label - Nome logico do ficheiro.
 * @param {string} content - Conteudo textual do ficheiro.
 * @param {string[]} markers - Fragmentos obrigatorios.
 * @returns {void}
 * @throws {Error} Quando algum marcador esta ausente.
 */
function assertContains(label, content, markers) {
    const missingMarkers = markers.filter((marker) => !content.includes(marker));

    if (missingMarkers.length > 0) {
        throw new Error(`${label} sem marcadores: ${missingMarkers.join(", ")}`);
    }
}

await Promise.all(
    Object.entries(FILES).map(([label, file]) => assertFileExists(label, file)),
);

const entries = await Promise.all(
    Object.entries(FILES).map(async ([label, file]) => [
        label,
        await readFile(file, "utf8"),
    ]),
);

for (const [label, content] of entries) {
    assertContains(label, content, REQUIRED_MARKERS[label]);
}

console.log("BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.");
