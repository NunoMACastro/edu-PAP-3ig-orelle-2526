/**
 * Testes unitários do contrato de imagens responsivas do catálogo.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
    buildResponsiveSrcSet,
    getProductPictureSources,
} from "../src/utils/responsiveImageSources.js";

const [optimizedImage, productCard, homePage, comparisonPage] = await Promise.all([
    readFile(new URL("../src/components/OptimizedImage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ProductCard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/OrelleMockupHome.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/SkinComparisonPage.jsx", import.meta.url), "utf8"),
]);

/**
 * Recorta uma invocação de OptimizedImage a partir do respetivo fallback.
 *
 * @param {string} source - Código-fonte JSX da superfície.
 * @param {string} src - Caminho exato usado na propriedade src.
 * @returns {string} Bloco JSX da imagem ou uma string vazia.
 */
function getOptimizedImageBlock(source, src) {
    const srcIndex = source.indexOf(`src="${src}"`);
    if (srcIndex < 0) return "";

    const blockStart = source.lastIndexOf("<OptimizedImage", srcIndex);
    const blockEnd = source.indexOf("/>", srcIndex);
    if (blockStart < 0 || blockEnd < 0) return "";

    return source.slice(blockStart, blockEnd + 2);
}

test("constrói srcset 320/640/960 ordenado", () => {
    assert.equal(
        buildResponsiveSrcSet("/products/serum", "avif"),
        "/products/serum-320.avif 320w, /products/serum-640.avif 640w, /products/serum-960.avif 960w",
    );
});

test("normaliza URL localhost da API para assets same-origin", () => {
    assert.deepEqual(
        getProductPictureSources(
            "http://localhost:5173/products/gel-de-limpeza-suave.png",
        ),
        {
            avifSrcSet:
                "/products/gel-de-limpeza-suave-320.avif 320w, /products/gel-de-limpeza-suave-640.avif 640w, /products/gel-de-limpeza-suave-960.avif 960w",
            webpSrcSet:
                "/products/gel-de-limpeza-suave-320.webp 320w, /products/gel-de-limpeza-suave-640.webp 640w, /products/gel-de-limpeza-suave-960.webp 960w",
            fallbackSrc: "/products/gel-de-limpeza-suave.png",
        },
    );
});

test("preserva a origem de um CDN externo com o mesmo contrato", () => {
    const sources = getProductPictureSources(
        "https://cdn.example.test/products/serum-vitamina-c-10.png",
    );

    assert.equal(
        sources.fallbackSrc,
        "https://cdn.example.test/products/serum-vitamina-c-10.png",
    );
    assert.match(sources.avifSrcSet, /^https:\/\/cdn\.example\.test\/products\//);
});

test("não inventa variantes para imagens fora do catálogo publicado", () => {
    assert.equal(
        getProductPictureSources("/api/me/skin-analyses/analysis-id/image"),
        null,
    );
    assert.equal(getProductPictureSources("not a valid URL"), null);
});

test("a UI publica picture responsivo no catálogo, hero e inspiração de maquilhagem", () => {
    assert.match(optimizedImage, /<picture>/);
    assert.match(optimizedImage, /type="image\/avif"/);
    assert.match(optimizedImage, /type="image\/webp"/);
    assert.match(optimizedImage, /fetchpriority=\{priority \? "high" : undefined\}/);
    assert.doesNotMatch(optimizedImage, /fetchPriority=/);
    assert.match(homePage, /<main id="main-content" tabIndex=\{-1\}>/);
    assert.match(homePage, /ProductCard/);
    assert.match(productCard, /<OptimizedImage[\s\S]*?src=\{product\.imageUrl\}/);
    assert.match(homePage, /src="\/home\/orelle-home-hero-v2-1774\.webp"/);
    assert.match(homePage, /avifSrcSet="[^"]*?640\.avif 640w,[^"]*?1774\.avif 1774w"/);
    assert.match(homePage, /webpSrcSet="[^"]*?640\.webp 640w,[^"]*?1774\.webp 1774w"/);
    assert.match(homePage, /className="mockup-hero__image"[\s\S]*?priority/);
    assert.doesNotMatch(homePage, /orelle-skin-analysis-(?:before|after)/);

    for (const imageName of ["orelle-makeup-original", "orelle-makeup-preview"]) {
        const imageBlock = getOptimizedImageBlock(
            homePage,
            `/home/${imageName}-960.webp`,
        );

        assert.ok(imageBlock, `${imageName} deve usar OptimizedImage`);
        assert.match(imageBlock, /width=\{960\}/);
        assert.match(imageBlock, /height=\{960\}/);
        assert.match(
            imageBlock,
            new RegExp(
                `avifSrcSet="/home/${imageName}-320\\.avif 320w, /home/${imageName}-520\\.avif 520w, /home/${imageName}-960\\.avif 960w"`,
            ),
        );
        assert.match(
            imageBlock,
            new RegExp(
                `webpSrcSet="/home/${imageName}-320\\.webp 320w, /home/${imageName}-520\\.webp 520w, /home/${imageName}-960\\.webp 960w"`,
            ),
        );
    }

    assert.match(comparisonPage, /OptimizedImage/);
    assert.doesNotMatch(comparisonPage, /<img\b/);
});

test("assets da inspiração existem nos formatos e dimensões publicados", async () => {
    for (const imageName of ["orelle-makeup-original", "orelle-makeup-preview"]) {
        for (const width of [320, 520, 960]) {
            for (const format of ["avif", "webp"]) {
                const assetUrl = new URL(
                    `../public/home/${imageName}-${width}.${format}`,
                    import.meta.url,
                );
                const metadata = await sharp(fileURLToPath(assetUrl)).metadata();

                assert.equal(metadata.mediaType, `image/${format}`);
                assert.equal(metadata.width, width);
                assert.equal(metadata.height, width);
            }
        }
    }
});
