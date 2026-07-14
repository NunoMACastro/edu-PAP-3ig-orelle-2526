/**
 * Verifica que cada produto tem variantes reais e respeita os budgets G6.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PRODUCT_DIR = path.resolve("public/products");
const WIDTHS = Object.freeze([320, 640, 960]);
const THUMBNAIL_MAX_BYTES = 120 * 1024;
const IMAGE_MAX_BYTES = 300 * 1024;

const files = await readdir(PRODUCT_DIR);
const pngs = files.filter((filename) => /^[a-z0-9-]+\.png$/i.test(filename)).sort();
const failures = [];
let totalBytes = 0;

for (const png of pngs) {
    const slug = path.basename(png, ".png");
    const expected = [
        { filename: png, width: 960, maximumBytes: IMAGE_MAX_BYTES },
        ...WIDTHS.flatMap((width) =>
            ["avif", "webp"].map((format) => ({
                filename: `${slug}-${width}.${format}`,
                width,
                maximumBytes: width === 320
                    ? THUMBNAIL_MAX_BYTES
                    : IMAGE_MAX_BYTES,
            })),
        ),
    ];

    for (const asset of expected) {
        const filePath = path.join(PRODUCT_DIR, asset.filename);
        try {
            const [fileStats, metadata] = await Promise.all([
                stat(filePath),
                sharp(filePath).metadata(),
            ]);
            totalBytes += fileStats.size;
            if (metadata.width !== asset.width) {
                failures.push(`${asset.filename}: ${metadata.width}px != ${asset.width}px`);
            }
            if (fileStats.size > asset.maximumBytes) {
                failures.push(
                    `${asset.filename}: ${fileStats.size} > ${asset.maximumBytes} bytes`,
                );
            }
        } catch (error) {
            failures.push(`${asset.filename}: ${error.code ?? error.message}`);
        }
    }
}

if (pngs.length === 0) failures.push("zero PNG canónicos");
if (failures.length > 0) {
    throw new Error(`G6 image budget falhou:\n${failures.join("\n")}`);
}

console.log(
    `G6 image budget OK: ${pngs.length} produtos, ${pngs.length * 6} variantes, ${totalBytes} bytes publicados`,
);
