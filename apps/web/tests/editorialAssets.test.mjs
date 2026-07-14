/** Contratos das fotografias editoriais da homepage e autenticação. */
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 300 * 1024;
const PUBLIC_HOME_DIR = path.resolve("public/home");
const [homeSource, layoutsSource] = await Promise.all([
    readFile("src/components/OrelleMockupHome.jsx", "utf8"),
    readFile("src/components/AppLayouts.jsx", "utf8"),
]);
const EXPECTED_ASSETS = Object.freeze([
    {
        prefix: "orelle-home-hero-v2",
        dimensions: new Map([
            [640, 320],
            [960, 480],
            [1536, 768],
            [1774, 887],
        ]),
    },
    {
        prefix: "orelle-auth-portrait-v2",
        dimensions: new Map([
            [480, 750],
            [640, 1001],
            [960, 1501],
            [1003, 1568],
        ]),
    },
]);

test("homepage e autenticação usam pessoas e contratos de imagem distintos", () => {
    assert.match(homeSource, /orelle-home-hero-v2-1774\.webp/);
    assert.doesNotMatch(homeSource, /orelle-auth-portrait-v2/);
    assert.match(layoutsSource, /orelle-auth-portrait-v2-1003\.webp/);
    assert.doesNotMatch(layoutsSource, /orelle-consultation-hero/);
});

test("variantes editoriais preservam detalhe dentro do budget MF6", async () => {
    for (const asset of EXPECTED_ASSETS) {
        for (const [width, height] of asset.dimensions) {
            for (const format of ["avif", "webp"]) {
                const filename = `${asset.prefix}-${width}.${format}`;
                const filePath = path.join(PUBLIC_HOME_DIR, filename);
                const [fileStats, metadata] = await Promise.all([
                    stat(filePath),
                    sharp(filePath).metadata(),
                ]);

                assert.equal(metadata.width, width, filename);
                assert.equal(metadata.height, height, filename);
                assert.ok(
                    fileStats.size <= MAX_IMAGE_BYTES,
                    `${filename}: ${fileStats.size} > ${MAX_IMAGE_BYTES}`,
                );
            }
        }
    }
});
