/**
 * Gera variantes responsivas determinísticas para as imagens públicas.
 *
 * O script lê apenas os PNG canónicos em `public/products`, escreve todos os
 * resultados para ficheiros temporários, valida dimensões e budgets e só então
 * substitui os outputs finais. Assim, uma falha não deixa um PNG original
 * parcialmente reescrito.
 */
import { readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PRODUCT_DIR = path.resolve("public/products");
const WIDTHS = Object.freeze([320, 640, 960]);
const THUMBNAIL_MAX_BYTES = 120 * 1024;
const IMAGE_MAX_BYTES = 300 * 1024;

/**
 * Constrói o caminho temporário ao lado do output final.
 *
 * @param {string} finalPath - Caminho final do asset.
 * @returns {string} Caminho temporário único para esta execução.
 */
function temporaryPath(finalPath) {
    return `${finalPath}.orelle-tmp`;
}

/**
 * Valida tamanho e largura efetiva de uma variante antes do publish.
 *
 * @param {string} filePath - Ficheiro temporário gerado.
 * @param {number} expectedWidth - Largura declarada no srcset.
 * @returns {Promise<number>} Tamanho do ficheiro validado.
 */
async function validateVariant(filePath, expectedWidth) {
    const [fileStats, metadata] = await Promise.all([
        stat(filePath),
        sharp(filePath).metadata(),
    ]);
    const maximumBytes = expectedWidth === 320
        ? THUMBNAIL_MAX_BYTES
        : IMAGE_MAX_BYTES;

    if (metadata.width !== expectedWidth) {
        throw new Error(
            `${path.basename(filePath)} tem ${metadata.width}px; esperado ${expectedWidth}px`,
        );
    }
    if (fileStats.size > maximumBytes) {
        throw new Error(
            `${path.basename(filePath)} excede o budget: ${fileStats.size} > ${maximumBytes}`,
        );
    }

    return fileStats.size;
}

/**
 * Gera as seis variantes e um fallback PNG otimizado de um produto.
 *
 * @param {string} filename - Nome do PNG canónico.
 * @returns {Promise<{sourceBytes: number, outputs: Array<{finalPath: string, tempPath: string, bytes: number}>}>} Assets temporários validados.
 */
async function generateProduct(filename) {
    const sourcePath = path.join(PRODUCT_DIR, filename);
    const slug = path.basename(filename, ".png");
    const sourceStats = await stat(sourcePath);
    const source = sharp(sourcePath, { failOn: "error" }).rotate();
    const metadata = await source.metadata();

    if (!metadata.width || metadata.width < WIDTHS.at(-1)) {
        throw new Error(`${filename} não permite uma variante real de 960px`);
    }

    const outputs = [];

    for (const width of WIDTHS) {
        for (const format of ["avif", "webp"]) {
            const finalPath = path.join(PRODUCT_DIR, `${slug}-${width}.${format}`);
            const tempPath = temporaryPath(finalPath);
            let pipeline = sharp(sourcePath, { failOn: "error" })
                .rotate()
                .resize({ width, withoutEnlargement: true });

            pipeline = format === "avif"
                ? pipeline.avif({ quality: 54, effort: 6 })
                : pipeline.webp({ quality: 76, effort: 6, smartSubsample: true });

            await pipeline.toFile(tempPath);
            outputs.push({
                finalPath,
                tempPath,
                bytes: await validateVariant(tempPath, width),
            });
        }
    }

    const fallbackTempPath = temporaryPath(sourcePath);
    await sharp(sourcePath, { failOn: "error" })
        .rotate()
        .resize({ width: 960, withoutEnlargement: true })
        .png({
            palette: true,
            colours: 128,
            quality: 82,
            compressionLevel: 9,
            effort: 10,
            dither: 0.5,
        })
        .toFile(fallbackTempPath);
    outputs.push({
        finalPath: sourcePath,
        tempPath: fallbackTempPath,
        bytes: await validateVariant(fallbackTempPath, 960),
    });

    return { sourceBytes: sourceStats.size, outputs };
}

const filenames = (await readdir(PRODUCT_DIR))
    .filter((filename) => /^[a-z0-9-]+\.png$/i.test(filename))
    .sort();

if (filenames.length === 0) {
    throw new Error("Não existem PNG canónicos em public/products");
}

const generated = [];

try {
    for (const filename of filenames) {
        generated.push(await generateProduct(filename));
    }

    for (const product of generated) {
        for (const output of product.outputs) {
            await rename(output.tempPath, output.finalPath);
        }
    }
} finally {
    await Promise.all(
        generated.flatMap((product) =>
            product.outputs.map((output) =>
                rm(output.tempPath, { force: true }),
            ),
        ),
    );
}

const sourceBytes = generated.reduce((total, product) => total + product.sourceBytes, 0);
const publishedBytes = generated.reduce(
    (total, product) =>
        total + product.outputs.reduce((subtotal, output) => subtotal + output.bytes, 0),
    0,
);

console.log(JSON.stringify({
    products: generated.length,
    variants: generated.length * WIDTHS.length * 2,
    optimizedFallbacks: generated.length,
    sourceBytes,
    publishedBytes,
    thumbnailMaxBytes: THUMBNAIL_MAX_BYTES,
    imageMaxBytes: IMAGE_MAX_BYTES,
}));
