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
    compressionHelper,
    facePhotoUploadPage,
    productDetailsPage,
    productSearchPage,
    relatedProductsPage,
    packageJson,
] = await Promise.all([
    readSource("src/components/OptimizedImage.jsx"),
    readSource("src/utils/imageOptimization.js"),
    readSource("src/pages/FacePhotoUploadPage.jsx"),
    readSource("src/pages/ProductDetailsPage.jsx"),
    readSource("src/pages/ProductSearchPage.jsx"),
    readSource("src/pages/RelatedProductsPage.jsx"),
    readSource("package.json"),
]);

assertContains(optimizedImage, "export function OptimizedImage", "componente comum exportado");
assertContains(optimizedImage, 'loading="lazy"', "lazy loading centralizado");
assertContains(optimizedImage, 'decoding="async"', "decoding assincrono centralizado");
assertContains(optimizedImage, 'referrerPolicy="no-referrer"', "referer minimizado");
assertContains(optimizedImage, "alt={alt}", "texto alternativo preservado");

assertContains(compressionHelper, "compressImageForUpload", "helper de compressao exportado");
assertContains(compressionHelper, "createImageBitmap", "compressao usa API nativa");
assertContains(compressionHelper, "canvas.toBlob", "compressao usa canvas.toBlob");
assertContains(compressionHelper, "blob.size >= file.size", "fallback quando nao reduz tamanho");
assertContains(compressionHelper, "catch", "fallback em erro de compressao");
assertContains(compressionHelper, "bitmap?.close?.()", "bitmap libertado apos compressao");

assertContains(facePhotoUploadPage, 'apiRequest("/face-consent"', "consentimento preservado");
assertContains(facePhotoUploadPage, 'apiRequest("/face-photos"', "endpoint de upload preservado");
assertContains(facePhotoUploadPage, "compressImageForUpload(frontal)", "frontal comprimida antes do FormData");
assertContains(facePhotoUploadPage, "compressImageForUpload(perfil)", "perfil comprimida antes do FormData");
assertContains(facePhotoUploadPage, 'formData.append("frontal"', "campo frontal preservado");
assertContains(facePhotoUploadPage, 'formData.append("perfil"', "campo perfil preservado");
assertNotContains(facePhotoUploadPage, "import apiClient", "upload nao importa cliente paralelo");
assertNotContains(facePhotoUploadPage, "{ apiClient }", "upload nao usa cliente paralelo");

assertContains(productDetailsPage, "OptimizedImage", "detalhe usa imagem otimizada");
assertContains(productDetailsPage, "apiRequest(`/catalog/products/${productId}`)", "endpoint de detalhe preservado");
assertContains(productDetailsPage, "product.brandName", "contrato brandName preservado");
assertContains(productDetailsPage, "product.priceCents", "contrato priceCents preservado");
assertNotContains(productDetailsPage, "react-router-dom", "detalhe nao introduz router");
assertNotContains(productDetailsPage, "product.priceFormatted", "detalhe nao inventa priceFormatted");

assertContains(productSearchPage, "OptimizedImage", "catalogo usa imagem otimizada");
assertContains(relatedProductsPage, "OptimizedImage", "relacionados usam imagem otimizada");
assertContains(packageJson, "smoke:mf6-images", "script focal publicado");

const sourceFiles = await listFiles(SRC_DIR);
const imageTagsOutsideComponent = [];

for (const filePath of sourceFiles) {
    if (!/\.(jsx|js)$/.test(filePath)) continue;
    if (filePath.endsWith(path.join("components", "OptimizedImage.jsx"))) continue;

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
