/**
 * Smoke de orçamento de carregamento MF6.
 *
 * Mede assets gerados pelo Vite sem abrir browser. LCP/CLS reais pertencem ao
 * E2E; este gate cobre o JS inicial comprimido e cada imagem publicada. Não
 * soma todos os chunks lazy como se fossem transferidos por uma única página.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const DIST_DIR = path.resolve("dist");
const MAX_INITIAL_JS_GZIP_BYTES = 200 * 1024;
const MAX_THUMBNAIL_BYTES = 120 * 1024;
const MAX_IMAGE_BYTES = 300 * 1024;
const ASSET_EXTENSIONS = new Set([".js", ".css"]);
const IMAGE_EXTENSIONS = new Set([".avif", ".webp", ".png", ".jpg", ".jpeg"]);

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
const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(path.extname(file)));
let totalBytes = 0;

for (const file of assetFiles) {
    totalBytes += (await stat(file)).size;
}

const initialJsFiles = assetFiles.filter(
    (file) => path.extname(file) === ".js" && /^index-[^.]+\.js$/.test(path.basename(file)),
);
if (initialJsFiles.length !== 1) {
    throw new Error(`MF6 esperava um entry JS inicial; encontrou ${initialJsFiles.length}`);
}
const initialJsGzipBytes = gzipSync(await readFile(initialJsFiles[0])).byteLength;
if (initialJsGzipBytes > MAX_INITIAL_JS_GZIP_BYTES) {
    throw new Error(
        `MF6 JS inicial excedido: ${initialJsGzipBytes} > ${MAX_INITIAL_JS_GZIP_BYTES} bytes gzip`,
    );
}

for (const imageFile of imageFiles) {
    const imageBytes = (await stat(imageFile)).size;
    const isThumbnail = /-320\.(avif|webp)$/i.test(imageFile);
    const maximumBytes = isThumbnail ? MAX_THUMBNAIL_BYTES : MAX_IMAGE_BYTES;
    if (imageBytes > maximumBytes) {
        throw new Error(
            `MF6 imagem excedida: ${path.relative(DIST_DIR, imageFile)} ${imageBytes} > ${maximumBytes}`,
        );
    }
}

console.log(
    `MF6 page budget OK: JS inicial ${initialJsGzipBytes} bytes gzip; ${imageFiles.length} imagens dentro do limite; ${totalBytes} bytes em ${assetFiles.length} chunks lazy reportados apenas como inventário`,
);
