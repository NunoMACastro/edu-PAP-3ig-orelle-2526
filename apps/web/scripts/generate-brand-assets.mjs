/**
 * Gera os assets responsivos e transparentes da identidade Orélle.
 *
 * O master permanece fora de `public` para não aumentar o bundle publicado.
 * A extração usa apenas os píxeis do master: separa os tons rose-gold do fundo
 * bordô sem redesenhar o símbolo, o lettering ou a tagline.
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_PATH = path.resolve(
    "assets-source/brand/orelle-logo-master.jpeg",
);
const OUTPUT_DIR = path.resolve("public/brand");
const LOCKUP_CROP = Object.freeze({
    left: 190,
    top: 75,
    width: 680,
    height: 610,
});
const SYMBOL_CROP = Object.freeze({
    left: 335,
    top: 65,
    width: 390,
    height: 390,
});
const LOCKUP_WIDTHS = Object.freeze([320, 640]);
const MARK_WIDTHS = Object.freeze([64, 128]);
const MAX_LOCKUP_BYTES = 120 * 1024;
const MAX_MARK_BYTES = 40 * 1024;

/**
 * Converte o fundo bordô em alpha preservando a arte rose-gold original.
 *
 * O score cromático mede a presença relativa de verde/azul face ao vermelho:
 * no fundo bordô é baixo; nos contornos metálicos e brilhos é elevado. A
 * transição suave evita serrilhado e a neutralização das franjas impede halos
 * bordô quando a marca é apresentada sobre superfícies claras.
 *
 * @returns {Promise<{data: Buffer, info: sharp.Raw}>} Píxeis RGBA extraídos.
 */
async function extractTransparentBrand() {
    const { data, info } = await sharp(SOURCE_PATH)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const foregroundScore = Math.max(green, blue) - 0.44 * red;
        const normalizedScore = Math.max(
            0,
            Math.min(1, (foregroundScore - 14) / (50 - 14)),
        );
        const smoothAlpha = normalizedScore
            * normalizedScore
            * (3 - 2 * normalizedScore);

        data[index + 3] = Math.round(smoothAlpha * 255);

        if (smoothAlpha > 0) {
            data[index + 1] = Math.max(green, Math.round(red * 0.6));
            data[index + 2] = Math.max(blue, Math.round(red * 0.56));
        }
    }

    return { data, info };
}

/**
 * Escreve um ficheiro e confirma imediatamente o respetivo budget.
 *
 * @param {sharp.Sharp} pipeline - Pipeline Sharp já configurado.
 * @param {string} filename - Nome do ficheiro de saída.
 * @param {number} maximumBytes - Limite máximo permitido.
 * @returns {Promise<number>} Tamanho final em bytes.
 */
async function writeWithinBudget(pipeline, filename, maximumBytes) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    await pipeline.toFile(outputPath);
    const fileStats = await stat(outputPath);

    if (fileStats.size > maximumBytes) {
        throw new Error(
            `${filename}: ${fileStats.size} bytes excedem ${maximumBytes} bytes`,
        );
    }

    return fileStats.size;
}

await mkdir(OUTPUT_DIR, { recursive: true });

const sourceMetadata = await sharp(SOURCE_PATH).metadata();
if (sourceMetadata.width !== 1061 || sourceMetadata.height !== 767) {
    throw new Error(
        `Master inesperado: ${sourceMetadata.width}x${sourceMetadata.height}; esperado 1061x767`,
    );
}

const generatedAssets = [];
const transparentBrand = await extractTransparentBrand();
const transparentPipeline = () =>
    sharp(Buffer.from(transparentBrand.data), { raw: transparentBrand.info });
const lockupPipeline = () =>
    transparentPipeline().extract(LOCKUP_CROP);

for (const width of LOCKUP_WIDTHS) {
    generatedAssets.push(
        [
            `orelle-lockup-${width}.avif`,
            await writeWithinBudget(
                lockupPipeline().resize({ width }).avif({ quality: 74 }),
                `orelle-lockup-${width}.avif`,
                MAX_LOCKUP_BYTES,
            ),
        ],
        [
            `orelle-lockup-${width}.webp`,
            await writeWithinBudget(
                lockupPipeline().resize({ width }).webp({ quality: 86 }),
                `orelle-lockup-${width}.webp`,
                MAX_LOCKUP_BYTES,
            ),
        ],
    );
}

generatedAssets.push([
    "orelle-lockup-640.png",
    await writeWithinBudget(
        lockupPipeline()
            .resize({ width: 640 })
            .png({ compressionLevel: 9, palette: true, quality: 92 }),
        "orelle-lockup-640.png",
        MAX_LOCKUP_BYTES,
    ),
]);

for (const width of MARK_WIDTHS) {
    const markPipeline = () =>
        transparentPipeline().extract(SYMBOL_CROP).resize(width, width, {
            fit: "cover",
        });

    generatedAssets.push(
        [
            `orelle-mark-${width}.avif`,
            await writeWithinBudget(
                markPipeline().avif({ quality: 72 }),
                `orelle-mark-${width}.avif`,
                MAX_MARK_BYTES,
            ),
        ],
        [
            `orelle-mark-${width}.webp`,
            await writeWithinBudget(
                markPipeline().webp({ quality: 84 }),
                `orelle-mark-${width}.webp`,
                MAX_MARK_BYTES,
            ),
        ],
    );
}

for (const width of [64, 128, 180]) {
    generatedAssets.push([
        `orelle-mark-${width}.png`,
        await writeWithinBudget(
            transparentPipeline()
                .extract(SYMBOL_CROP)
                .resize(width, width, { fit: "cover" })
                .png({ compressionLevel: 9, palette: true }),
            `orelle-mark-${width}.png`,
            MAX_MARK_BYTES,
        ),
    ]);
}

const totalBytes = generatedAssets.reduce((total, [, bytes]) => total + bytes, 0);
console.log(
    `Marca Orélle gerada: ${generatedAssets.length} assets, ${totalBytes} bytes`,
);
