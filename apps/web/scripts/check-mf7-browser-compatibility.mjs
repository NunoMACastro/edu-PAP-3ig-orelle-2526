import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(WEB_ROOT, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx"]);
const BLOCKED_PATTERNS = [
    { label: "browser-name-branch:userAgent", pattern: /navigator\.userAgent/i },
    { label: "browser-name-branch:vendor", pattern: /navigator\.vendor/i },
    { label: "legacy-ie-branch:document-all", pattern: /document\.all/i },
    { label: "legacy-ie-branch:document-mode", pattern: /document\.documentMode/i },
];

/**
 * Indica se um ficheiro deve ser analisado pelo smoke de compatibilidade.
 *
 * @function isSourceFile
 * @param {string} filename - Nome do ficheiro encontrado dentro de `src`.
 * @returns {boolean} `true` para JavaScript/JSX da app, `false` para CSS/assets.
 */
function isSourceFile(filename) {
    // Prefixos CSS legítimos não são branches por browser; por isso o smoke analisa JS/JSX.
    return SOURCE_EXTENSIONS.has(path.extname(filename));
}

/**
 * Lista recursivamente os ficheiros JavaScript/JSX do frontend.
 *
 * @function listSourceFiles
 * @param {string} dir - Diretoria inicial a percorrer.
 * @returns {Promise<string[]>} Caminhos absolutos dos ficheiros analisáveis.
 */
async function listSourceFiles(dir) {
    const entries = await readdir(dir);
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const info = await stat(fullPath);

        if (info.isDirectory()) {
            files.push(...(await listSourceFiles(fullPath)));
        } else if (isSourceFile(entry)) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Procura decisões frágeis que escolhem comportamento pelo nome do browser.
 *
 * @function findBrowserBranches
 * @param {string[]} files - Ficheiros JavaScript/JSX a analisar.
 * @returns {Promise<string[]>} Lista de findings com caminho relativo e regra violada.
 */
async function findBrowserBranches(files) {
    const findings = [];

    for (const file of files) {
        const content = await readFile(file, "utf8");
        for (const rule of BLOCKED_PATTERNS) {
            if (rule.pattern.test(content)) {
                // O caminho relativo deixa o erro acionável para o aluno sem expor paths internos da máquina.
                findings.push(`${path.relative(WEB_ROOT, file)}: ${rule.label}`);
            }
        }
    }

    return findings;
}

/**
 * Executa o smoke de compatibilidade do BK-MF7-04.
 *
 * @function main
 * @returns {Promise<void>} Termina com exit code `0` quando não há branches por browser.
 */
async function main() {
    const files = await listSourceFiles(SRC_DIR);
    const findings = await findBrowserBranches(files);

    if (findings.length > 0) {
        // Falhar cedo evita soluções específicas para um browser sem necessidade real.
        console.error(findings.join("\n"));
        process.exit(1);
    }

    console.log(`MF7 browser compatibility static check OK (${files.length} ficheiros).`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});