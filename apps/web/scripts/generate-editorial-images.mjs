/**
 * Gera fotografias editoriais responsivas para a homepage e autenticação.
 *
 * Os PNG de alta definição permanecem fora de `public`. As variantes finais
 * usam compressão conservadora para preservar pele, cabelo e olhos sem violar
 * o budget MF6 de 300 KiB por imagem publicada.
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("public/home");
const IMAGE_MAX_BYTES = 300 * 1024;
const EDITORIAL_ASSETS = Object.freeze([
    {
        source: path.resolve("assets-source/home/orelle-home-hero-v2-source.png"),
        prefix: "orelle-home-hero-v2",
        expectedSource: { width: 1774, height: 887 },
        widths: [640, 960, 1536, 1774],
    },
    {
        source: path.resolve(
            "assets-source/home/orelle-auth-portrait-v2-source.png",
        ),
        prefix: "orelle-auth-portrait-v2",
        expectedSource: { width: 1003, height: 1568 },
        widths: [480, 640, 960, 1003],
    },
]);

/**
 * Guarda uma variante e bloqueia a geração quando excede o budget publicado.
 *
 * @param {sharp.Sharp} pipeline - Pipeline de resize e encoding.
 * @param {string} filename - Nome final dentro de `public/home`.
 * @returns {Promise<number>} Tamanho final em bytes.
 */
async function writeVariant(pipeline, filename) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    await pipeline.toFile(outputPath);
    const fileStats = await stat(outputPath);

    if (fileStats.size > IMAGE_MAX_BYTES) {
        throw new Error(
            `${filename}: ${fileStats.size} bytes excedem ${IMAGE_MAX_BYTES} bytes`,
        );
    }

    return fileStats.size;
}

await mkdir(OUTPUT_DIR, { recursive: true });

const generated = [];

for (const asset of EDITORIAL_ASSETS) {
    const metadata = await sharp(asset.source).metadata();
    if (
        metadata.width !== asset.expectedSource.width ||
        metadata.height !== asset.expectedSource.height
    ) {
        throw new Error(
            `${asset.prefix}: master ${metadata.width}x${metadata.height}; esperado ${asset.expectedSource.width}x${asset.expectedSource.height}`,
        );
    }

    for (const width of asset.widths) {
        const resized = () =>
            sharp(asset.source).resize({
                width,
                fit: "inside",
                withoutEnlargement: true,
            });
        const avifFilename = `${asset.prefix}-${width}.avif`;
        const webpFilename = `${asset.prefix}-${width}.webp`;

        generated.push(
            [
                avifFilename,
                await writeVariant(
                    resized().avif({ quality: 78, effort: 5 }),
                    avifFilename,
                ),
            ],
            [
                webpFilename,
                await writeVariant(
                    resized().webp({ quality: 88, smartSubsample: true }),
                    webpFilename,
                ),
            ],
        );
    }
}

const totalBytes = generated.reduce((sum, [, bytes]) => sum + bytes, 0);
console.log(
    `Fotografias editoriais geradas: ${generated.length} assets, ${totalBytes} bytes`,
);
