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
 * @throws {Error} Quando o contrato textual esperado esta ausente.
 */
function assertContains(source, fragment, label) {
    if (!source.includes(fragment)) {
        throw new Error(`MF6 runtime frontend incompleto: ${label}`);
    }
}

/**
 * Garante a ausência de um fragmento obsoleto.
 *
 * @function assertNotContains
 * @param {string} source - Conteúdo do ficheiro.
 * @param {string} fragment - Fragmento proibido.
 * @param {string} label - Descrição do contrato.
 * @returns {void}
 * @throws {Error} Quando o fragmento ainda existe.
 */
function assertNotContains(source, fragment, label) {
    if (source.includes(fragment)) {
        throw new Error(`MF6 runtime frontend inválido: ${label}`);
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

assertContains(performanceBudget, "lcpMs: 3_000", "budget LCP de 3 segundos");
assertContains(performanceBudget, "cls: 0.1", "budget CLS de 0.1");
assertContains(performanceBudget, "MAIN_PAGE_DEFINITIONS", "lista fechada de paginas principais");
assertContains(measuredSection, "usePagePerformance", "wrapper observa Web Vitals");
assertContains(measuredSection, "mf6-page-measure", "wrapper expoe classe MF6 para evidence");
assertContains(measuredSection, "data-mf6-page", "wrapper expoe seletor de pagina MF6");
assertContains(measuredSection, "data-page-key", "wrapper preserva seletor tecnico legado");
assertContains(app, "function MeasuredRoute", "medicao encapsulada por rota");
assertContains(app, 'path="/produtos"', "catalogo exposto por rota");
assertContains(app, "pageKey=\"catalog\"", "catalogo medido");
assertContains(app, "pageKey=\"guided-consultation\"", "consulta guiada medida");
assertContains(app, "pageKey=\"consultation-report\"", "relatorio da consulta medido");
assertContains(app, "pageKey=\"ai-history\"", "historico da consulta medido");
assertContains(app, "pageKey=\"cart\"", "carrinho medido");
assertContains(app, "pageKey=\"checkout\"", "checkout medido");
assertContains(apiClient, 'API_BASE_URL = "/api"', "API usa a mesma origem");
assertNotContains(apiClient, "VITE_API_BASE_URL", "API configurável no bundle");
assertNotContains(apiClient, "127.0.0.1", "fallback local no bundle");
assertContains(imageOptimization, "catch", "fallback em erro de compressao");
assertNotContains(
    measuredSection,
    "PagePerformanceNotice",
    "wrapper nao mostra métricas técnicas ao utilizador",
);
const performanceHook = await readSource("src/hooks/usePagePerformance.js");
assertContains(performanceHook, "PerformanceObserver", "hook usa métrica browser real");
assertNotContains(performanceHook, "requestAnimationFrame", "medição first-frame obsoleta");
assertContains(packageJson, "smoke:mf6-performance-unit", "script unitario MF6 publicado");

console.log("MF6 runtime frontend OK: performance, same-origin e compressao validados");
