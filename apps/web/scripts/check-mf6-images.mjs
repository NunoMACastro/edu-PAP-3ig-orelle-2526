/**
 * Smoke estatico dos contratos de imagem do BK-MF6-04.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = path.resolve("src");

/**
 * Le um ficheiro do frontend.
 *
 * @async
 * @function readSource
 * @param {string} relativePath - Caminho relativo a real_dev/web.
 * @returns {Promise<string>} Conteudo UTF-8.
 */
async function readSource(relativePath) {
    return readFile(path.resolve(relativePath), "utf8");
}

/**
 * Garante a presenca de um fragmento textual.
 *
 * @function assertContains
 * @param {string} source - Conteudo do ficheiro.
 * @param {string} fragment - Fragmento esperado.
 * @param {string} label - Descricao do contrato.
 * @returns {void}
 * @throws {Error} Quando o fragmento esperado esta ausente.
 */
function assertContains(source, fragment, label) {
    if (!source.includes(fragment)) {
        throw new Error(`BK-MF6-04 incompleto: ${label}`);
    }
}

/**
 * Garante a ausencia de um fragmento textual.
 *
 * @function assertNotContains
 * @param {string} source - Conteudo do ficheiro.
 * @param {string} fragment - Fragmento proibido.
 * @param {string} label - Descricao do contrato negativo.
 * @returns {void}
 * @throws {Error} Quando o fragmento proibido esta presente.
 */
function assertNotContains(source, fragment, label) {
    if (source.includes(fragment)) {
        throw new Error(`BK-MF6-04 com drift: ${label}`);
    }
}

/**
 * Lista ficheiros recursivamente para confirmar centralizacao de imagens.
 *
 * @async
 * @function listFiles
 * @param {string} directory - Diretoria a percorrer.
 * @returns {Promise<string[]>} Caminhos absolutos dos ficheiros encontrados.
 */
async function listFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nestedEntries = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return listFiles(fullPath);
            }

            return [fullPath];
        }),
    );

    return nestedEntries.flat();
}

const [
    optimizedImage,
    productCard,
    responsiveSources,
    compressionHelper,
    newConsultationPage,
    consultationApi,
    productDetailsPage,
    productSearchPage,
    relatedProductsPage,
    packageJson,
] = await Promise.all([
    readSource("src/components/OptimizedImage.jsx"),
    readSource("src/components/ProductCard.jsx"),
    readSource("src/utils/responsiveImageSources.js"),
    readSource("src/utils/imageOptimization.js"),
    readSource("src/features/consultation/NewConsultationPage.jsx"),
    readSource("src/features/consultation/consultationApi.js"),
    readSource("src/pages/ProductDetailsPage.jsx"),
    readSource("src/pages/ProductSearchPage.jsx"),
    readSource("src/pages/RelatedProductsPage.jsx"),
    readSource("package.json"),
]);

assertContains(optimizedImage, "export function OptimizedImage", "componente comum exportado");
assertContains(optimizedImage, "<picture>", "picture responsivo centralizado");
assertContains(optimizedImage, 'type="image/avif"', "source AVIF centralizada");
assertContains(optimizedImage, 'type="image/webp"', "source WebP centralizada");
assertContains(
    optimizedImage,
    'loading={priority ? "eager" : "lazy"}',
    "eager apenas por prioridade explicita",
);
assertContains(optimizedImage, "fetchpriority={priority", "prioridade React 18 sem warning");
assertNotContains(optimizedImage, "fetchPriority=", "prop React incompatível");
assertContains(optimizedImage, 'decoding="async"', "decoding assincrono centralizado");
assertContains(optimizedImage, 'referrerPolicy="no-referrer"', "referer minimizado");
assertContains(optimizedImage, "alt={alt}", "texto alternativo preservado");
assertContains(responsiveSources, "PRODUCT_IMAGE_WIDTHS", "larguras fechadas publicadas");
assertContains(responsiveSources, "avifSrcSet", "resolver publica srcset AVIF");
assertContains(responsiveSources, "webpSrcSet", "resolver publica srcset WebP");

assertContains(compressionHelper, "compressImageForUpload", "helper de compressao exportado");
assertContains(compressionHelper, "createImageBitmap", "compressao usa API nativa");
assertContains(compressionHelper, "canvas.toBlob", "compressao usa canvas.toBlob");
assertContains(compressionHelper, "blob.size >= file.size", "fallback quando nao reduz tamanho");
assertContains(compressionHelper, "catch", "fallback em erro de compressao");
assertContains(compressionHelper, "bitmap?.close?.()", "bitmap libertado apos compressao");

assertContains(newConsultationPage, "acceptFaceConsent", "consentimento preservado");
assertContains(newConsultationPage, "uploadFacePhotos", "upload canónico preservado");
assertContains(newConsultationPage, "compressImageForUpload(files.frontal)", "frontal comprimida antes do FormData");
assertContains(newConsultationPage, "compressImageForUpload(files.perfil)", "perfil comprimida antes do FormData");
assertContains(consultationApi, 'formData.append("frontal"', "campo frontal preservado");
assertContains(consultationApi, 'formData.append("perfil"', "campo perfil preservado");
assertNotContains(newConsultationPage, "import apiClient", "upload nao importa cliente paralelo");

assertContains(productDetailsPage, "OptimizedImage", "detalhe usa imagem otimizada");
assertContains(
    productDetailsPage,
    "apiRequest(`/catalog/products/${productId}`, { signal })",
    "endpoint de detalhe preservado com cancelamento",
);
assertContains(productDetailsPage, "useParams", "detalhe usa productId da rota");
assertContains(productDetailsPage, "product.brandName", "contrato brandName preservado");
assertContains(productDetailsPage, "product.priceCents", "contrato priceCents preservado");
assertNotContains(productDetailsPage, "product.priceFormatted", "detalhe nao inventa priceFormatted");

assertContains(productCard, "OptimizedImage", "card partilhado usa imagem otimizada");
assertContains(productSearchPage, "ProductCard", "catalogo usa card com imagem otimizada");
assertContains(relatedProductsPage, "ProductCard", "relacionados usam card com imagem otimizada");
assertContains(packageJson, "smoke:mf6-images", "script focal publicado");
assertContains(packageJson, "images:generate", "gerador responsivo publicado");
assertContains(packageJson, "check:g6-image-budgets", "budget de imagem publicado");
assertContains(packageJson, '"sharp": "0.35.3"', "Sharp fixado em desenvolvimento");

const sourceFiles = await listFiles(SRC_DIR);
const imageTagsOutsideComponent = [];

for (const filePath of sourceFiles) {
    if (!/\.(jsx|js)$/.test(filePath)) continue;
    if (filePath.endsWith(path.join("components", "OptimizedImage.jsx"))) continue;
    if (filePath.endsWith(path.join("consultation", "ConsultationReportPage.jsx"))) continue;
    if (filePath.endsWith(path.join("consultation", "ConsultationReviewsPage.jsx"))) continue;
    // Previews biométricos usam URLs locais/autenticados e não podem ser
    // transformados em variantes públicas de catálogo pelo OptimizedImage.
    if (filePath.endsWith(path.join("consultation", "NewConsultationPage.jsx"))) continue;

    const source = await readFile(filePath, "utf8");

    if (source.includes("<img")) {
        imageTagsOutsideComponent.push(path.relative(process.cwd(), filePath));
    }
}

if (imageTagsOutsideComponent.length > 0) {
    throw new Error(
        `BK-MF6-04 com <img> fora de OptimizedImage: ${imageTagsOutsideComponent.join(", ")}`,
    );
}

console.log("BK-MF6-04 image checks passed");
