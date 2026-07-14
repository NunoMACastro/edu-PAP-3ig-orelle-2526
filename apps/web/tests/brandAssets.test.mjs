/** Contratos de dimensão e budget dos assets oficiais da marca. */
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const PUBLIC_BRAND_DIR = path.resolve("public/brand");

const ASSETS = Object.freeze([
    ["orelle-lockup-320.avif", 320, 287, 120 * 1024],
    ["orelle-lockup-320.webp", 320, 287, 120 * 1024],
    ["orelle-lockup-640.avif", 640, 574, 120 * 1024],
    ["orelle-lockup-640.webp", 640, 574, 120 * 1024],
    ["orelle-lockup-640.png", 640, 574, 120 * 1024],
    ["orelle-mark-64.avif", 64, 64, 40 * 1024],
    ["orelle-mark-64.webp", 64, 64, 40 * 1024],
    ["orelle-mark-64.png", 64, 64, 40 * 1024],
    ["orelle-mark-128.avif", 128, 128, 40 * 1024],
    ["orelle-mark-128.webp", 128, 128, 40 * 1024],
    ["orelle-mark-128.png", 128, 128, 40 * 1024],
    ["orelle-mark-180.png", 180, 180, 40 * 1024],
]);

test("assets da marca mantêm dimensões estáveis e budgets explícitos", async () => {
    for (const [filename, width, height, maximumBytes] of ASSETS) {
        const assetPath = path.join(PUBLIC_BRAND_DIR, filename);
        const [fileStats, metadata] = await Promise.all([
            stat(assetPath),
            sharp(assetPath).metadata(),
        ]);

        assert.equal(metadata.width, width, filename);
        assert.equal(metadata.height, height, filename);
        assert.equal(metadata.hasAlpha, true, `${filename} deve ter canal alpha`);
        assert.ok(
            fileStats.size <= maximumBytes,
            `${filename}: ${fileStats.size} > ${maximumBytes}`,
        );
    }
});

test("assets da marca têm cantos transparentes", async () => {
    for (const [filename] of ASSETS) {
        const { data, info } = await sharp(path.join(PUBLIC_BRAND_DIR, filename))
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const cornerIndexes = [
            3,
            (info.width - 1) * 4 + 3,
            (info.height - 1) * info.width * 4 + 3,
            (info.width * info.height - 1) * 4 + 3,
        ];

        for (const index of cornerIndexes) {
            assert.equal(data[index], 0, `${filename} deve ser transparente nos cantos`);
        }
    }
});
