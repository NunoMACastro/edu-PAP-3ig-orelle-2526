/**
 * Smoke estatico dos contratos runtime da MF6 no frontend.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

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
 * Garante a presenca de um fragmento.
 *
 * @function assertContains
 * @param {string} source - Conteudo do ficheiro.
 * @param {string} fragment - Fragmento esperado.
 * @param {string} label - Descricao do contrato.
 * @returns {void}
 */
function assertContains(source, fragment, label) {
    if (!source.includes(fragment)) {
        throw new Error(`MF6 runtime frontend incompleto: ${label}`);
    }
}

const [
    performanceBudget,
    measuredSection,
    app,
    apiClient,
    imageOptimization,
    packageJson,
] = await Promise.all([
    readSource("src/utils/performanceBudget.js"),
    readSource("src/components/MeasuredPageSection.jsx"),
    readSource("src/App.jsx"),
    readSource("src/services/apiClient.js"),
    readSource("src/utils/imageOptimization.js"),
    readSource("package.json"),
]);

assertContains(performanceBudget, "PAGE_LOAD_BUDGET_MS = 3000", "budget de 3 segundos");
assertContains(performanceBudget, "MAIN_PAGE_DEFINITIONS", "lista fechada de paginas principais");
assertContains(measuredSection, "usePagePerformance", "wrapper mede primeiro frame");
assertContains(measuredSection, "mf6-page-measure", "wrapper expoe classe MF6 para evidence");
assertContains(measuredSection, "data-mf6-page", "wrapper expoe seletor de pagina MF6");
assertContains(measuredSection, "data-page-key", "wrapper preserva seletor tecnico legado");
assertContains(app, "pageKey=\"catalog\"", "catalogo medido");
assertContains(app, "pageKey=\"face-analysis\"", "analise facial medida");
assertContains(app, "pageKey=\"face-report\"", "relatorio facial medido");
assertContains(app, "pageKey=\"recommendations\"", "recomendacoes medidas");
assertContains(app, "pageKey=\"cart\"", "carrinho medido");
assertContains(app, "pageKey=\"checkout\"", "checkout medido");
assertContains(apiClient, "resolveApiBaseUrl", "validacao da API base URL");
assertContains(apiClient, "VITE_API_BASE_URL deve usar HTTPS", "erro HTTPS de build");
assertContains(imageOptimization, "catch", "fallback em erro de compressao");
assertContains(
    measuredSection,
    "PagePerformanceNotice measurement={measurement}",
    "wrapper renderiza aviso tecnico",
);
const notice = await readSource("src/components/PagePerformanceNotice.jsx");
assertContains(notice, "mf6-performance", "aviso expoe classe MF6");
assertContains(notice, "role=\"status\"", "aviso usa semantica de estado");
assertContains(notice, "aria-live=\"polite\"", "aviso comunica mudancas sem interromper");
assertContains(packageJson, "smoke:mf6-performance-unit", "script unitario MF6 publicado");

console.log("MF6 runtime frontend OK: performance, HTTPS e compressao validados");
