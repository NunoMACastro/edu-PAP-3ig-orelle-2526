/**
 * Gate de sintaxe JavaScript para a implementação privada `real_dev`.
 *
 * O parser nativo do Node valida API, scripts, testes, configuração Vite e os
 * módulos frontend sem JSX. Ficheiros `.jsx` ficam a cargo do ESLint/Vite,
 * porque `node --check` não reconhece essa extensão nem a sintaxe JSX.
 */
import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { API_ROOT, WEB_ROOT } from "./e2e-runtime.core.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const CHECKED_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const EXCLUDED_DIRECTORY_NAMES = new Set([
    "node_modules",
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
]);
const MAX_CONCURRENT_CHECKS = 8;

/**
 * Determina se uma diretoria gerada/quarentenada deve ficar fora do gate.
 *
 * @param {string} name - Nome base encontrado no filesystem.
 * @returns {boolean} Verdadeiro quando o conteúdo não pertence ao source atual.
 */
function shouldExcludeDirectory(name) {
    return (
        EXCLUDED_DIRECTORY_NAMES.has(name) ||
        name.startsWith("node_modules.") ||
        name.startsWith("node_modules-")
    );
}

/**
 * Recolhe ficheiros JS sem seguir symlinks ou diretórios de dependências.
 *
 * @param {string} directory - Raiz absoluta a percorrer.
 * @returns {Promise<string[]>} Caminhos absolutos ordenados.
 */
export async function collectJavaScriptFiles(directory) {
    const files = [];

    async function walk(currentDirectory) {
        const entries = await readdir(currentDirectory, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                if (!shouldExcludeDirectory(entry.name)) await walk(entryPath);
            } else if (
                entry.isFile() &&
                CHECKED_EXTENSIONS.has(path.extname(entry.name))
            ) {
                files.push(entryPath);
            }
        }
    }

    await walk(directory);
    return files.sort((left, right) => left.localeCompare(right));
}

/**
 * Executa `node --check` e reduz qualquer erro ao caminho e parser output.
 *
 * @param {string} filePath - Ficheiro absoluto a validar.
 * @returns {Promise<void>} Resolve quando o parser aceita o ficheiro.
 */
async function checkFile(filePath) {
    try {
        await execFileAsync(process.execPath, ["--check", filePath], {
            cwd: API_ROOT,
            encoding: "utf8",
            maxBuffer: 1024 * 1024,
        });
    } catch (error) {
        const relativePath = path.relative(API_ROOT, filePath);
        const parserOutput = String(error?.stderr ?? error?.message ?? "")
            .trim()
            .replaceAll(filePath, relativePath);
        throw new Error(`${relativePath}: ${parserOutput}`);
    }
}

/**
 * Valida uma lista com concorrência limitada para não saturar ambientes locais.
 *
 * @param {string[]} files - Ficheiros absolutos únicos.
 * @returns {Promise<void>} Resolve quando todos passaram.
 */
async function checkFilesWithLimit(files) {
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < files.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            await checkFile(files[currentIndex]);
        }
    }

    await Promise.all(
        Array.from(
            { length: Math.min(MAX_CONCURRENT_CHECKS, files.length) },
            () => worker(),
        ),
    );
}

/**
 * Corre o gate sobre os dois packages da implementação real.
 *
 * @returns {Promise<{checkedFiles: number, skippedJsx: true}>} Evidência pública.
 */
export async function runSyntaxCheck() {
    const sourceRoots = [
        path.join(API_ROOT, "src"),
        path.join(API_ROOT, "scripts"),
        path.join(API_ROOT, "tests"),
        path.join(WEB_ROOT, "src"),
        path.join(WEB_ROOT, "scripts"),
        path.join(WEB_ROOT, "tests"),
    ];
    const nestedFiles = await Promise.all(
        sourceRoots.map((root) => collectJavaScriptFiles(root)),
    );
    const files = [
        path.join(WEB_ROOT, "eslint.config.js"),
        path.join(WEB_ROOT, "vite.config.js"),
        path.join(WEB_ROOT, "vitest.config.js"),
        ...nestedFiles.flat(),
    ];
    const uniqueFiles = [...new Set(files)].sort((left, right) =>
        left.localeCompare(right),
    );

    await checkFilesWithLimit(uniqueFiles);
    return { checkedFiles: uniqueFiles.length, skippedJsx: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
    runSyntaxCheck()
        .then((summary) => {
            console.log(
                `Syntax OK: ${summary.checkedFiles} ficheiros JS/MJS/CJS; JSX delegado a ESLint/Vite`,
            );
        })
        .catch((error) => {
            console.error(`Syntax falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
