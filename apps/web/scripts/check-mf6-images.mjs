import { readFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);

/**
 * Lê um ficheiro dentro de apps/web usando caminho relativo.
 *
 * @async
 * @function readProjectFile
 * @param {string} relativePath - Caminho dentro de apps/web.
 * @returns {Promise<string>} Conteúdo textual do ficheiro.
 */
async function readProjectFile(relativePath) {
    return readFile(new URL(relativePath, projectRoot), "utf8");
}

/**
 * Confirma que um ficheiro contém texto obrigatório.
 *
 * @function assertIncludes
 * @param {string} content - Conteúdo do ficheiro.
 * @param {string} expected - Texto esperado.
 * @param {string} label - Descrição da regra.
 * @returns {void}
 */
function assertIncludes(content, expected, label) {
    if (!content.includes(expected)) {
        throw new Error(`${label}: falta "${expected}"`);
    }
}

/**
 * Confirma que um ficheiro não contém texto proibido para este BK.
 *
 * @function assertNotIncludes
 * @param {string} content - Conteúdo do ficheiro.
 * @param {string} forbidden - Texto proibido.
 * @param {string} label - Descrição da regra.
 * @returns {void}
 */
function assertNotIncludes(content, forbidden, label) {
    if (content.includes(forbidden)) {
        throw new Error(`${label}: remove "${forbidden}"`);
    }
}

const [
    optimizedImage,
    compressionHelper,
    facePhotoUploadPage,
    productDetailsPage,
    styles,
] = await Promise.all([
    readProjectFile("src/components/OptimizedImage.jsx"),
    readProjectFile("src/utils/image-compression.js"),
    readProjectFile("src/pages/FacePhotoUploadPage.jsx"),
    readProjectFile("src/pages/ProductDetailsPage.jsx"),
    readProjectFile("src/styles.css"),
]);

// Estas regras garantem que a imagem tem atributos reais de performance.
assertIncludes(optimizedImage, "loading={loadingMode}", "OptimizedImage controla lazy loading");
assertIncludes(optimizedImage, 'decoding="async"', "OptimizedImage usa descodificação assíncrona");

assertIncludes(
    compressionHelper,
    'typeof createImageBitmap === "function"',
    "compressão verifica suporte do browser",
);
assertIncludes(compressionHelper, "catch", "compressão tem fallback em erro");
assertIncludes(compressionHelper, "bitmap?.close?.()", "compressão liberta bitmap");

assertIncludes(facePhotoUploadPage, "apiRequest", "upload facial usa cliente real");
assertNotIncludes(facePhotoUploadPage, "apiClient", "upload facial não deve importar apiClient");
assertIncludes(facePhotoUploadPage, "compressImageForUpload", "upload comprime antes do envio");
assertIncludes(facePhotoUploadPage, 'formData.append("frontal"', "upload mantém campo frontal");
assertIncludes(facePhotoUploadPage, 'formData.append("perfil"', "upload mantém campo perfil");

// A página de produto deve preservar o contrato real do backend.
assertIncludes(productDetailsPage, "OptimizedImage", "detalhe usa imagem otimizada");
assertIncludes(productDetailsPage, "apiRequest", "detalhe usa cliente real");
assertNotIncludes(productDetailsPage, "react-router-dom", "detalhe não introduz router");
assertIncludes(productDetailsPage, "product.brandName", "detalhe usa brandName");
assertIncludes(productDetailsPage, "product.priceCents", "detalhe usa priceCents");
assertNotIncludes(productDetailsPage, "product.priceFormatted", "detalhe não usa preço inexistente");

assertIncludes(styles, ".optimized-image", "CSS contém classe comum");
assertIncludes(styles, ".product-detail-image", "CSS reserva layout da imagem");

console.log("BK-MF6-04 image checks passed");