/**
 * Smoke de orçamento de carregamento MF6.
 *
 * Mede assets gerados pelo Vite sem abrir browser. O limite é conservador para
 * esta PAP e funciona como aviso técnico de regressões grosseiras de bundle.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const MAX_TOTAL_ASSET_BYTES = 1_500_000;
const ASSET_EXTENSIONS = new Set([".js", ".css"]);

/**
 * Lista ficheiros recursivamente.
 *
 * @async
 * @function listFiles
 * @param {string} dir - Diretoria a percorrer.
 * @returns {Promise<string[]>} Caminhos absolutos encontrados.
 */
async function listFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) return listFiles(entryPath);
            return [entryPath];
        }),
    );

    return nested.flat();
}

const files = await listFiles(DIST_DIR);
const assetFiles = files.filter((file) => ASSET_EXTENSIONS.has(path.extname(file)));
let totalBytes = 0;

for (const file of assetFiles) {
    totalBytes += (await stat(file)).size;
}

if (totalBytes > MAX_TOTAL_ASSET_BYTES) {
    throw new Error(
        `MF6 page budget excedido: ${totalBytes} bytes > ${MAX_TOTAL_ASSET_BYTES} bytes`,
    );
}

console.log(
    `MF6 page budget OK: ${totalBytes} bytes em ${assetFiles.length} assets JS/CSS`,
);
