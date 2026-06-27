/**
 * Contratos de performance local da MF6.
 *
 * A medicao fica no browser e guarda apenas dados tecnicos minimizados:
 * identificador da area, duracao, orcamento e estado.
 */

export const PAGE_LOAD_BUDGET_MS = 3000;

export const MAIN_PAGE_DEFINITIONS = Object.freeze([
    { key: "catalog", label: "Catalogo" },
    { key: "face-analysis", label: "Analise facial" },
    { key: "face-report", label: "Relatorio facial" },
    { key: "recommendations", label: "Recomendacoes" },
    { key: "cart", label: "Carrinho" },
    { key: "checkout", label: "Checkout" },
]);

export const MAIN_PAGE_KEYS = Object.freeze(
    MAIN_PAGE_DEFINITIONS.map((definition) => definition.key),
);

/**
 * Procura a definicao de uma area principal.
 *
 * @function findMainPageDefinition
 * @param {string} pageKey - Identificador tecnico da area.
 * @returns {{key: string, label: string}|undefined} Definicao encontrada.
 */
export function findMainPageDefinition(pageKey) {
    return MAIN_PAGE_DEFINITIONS.find((definition) => definition.key === pageKey);
}

/**
 * Avalia uma medicao face ao orcamento canonico de 3 segundos.
 *
 * @function evaluatePageLoad
 * @param {{pageKey: string, label?: string, durationMs: number}} input - Dados tecnicos da medicao.
 * @returns {{pageKey: string, label: string, durationMs: number, budgetMs: number, status: "ok"|"slow"|"ignored"}} Resultado minimizado.
 */
export function evaluatePageLoad({ pageKey, label, durationMs }) {
    const definition = findMainPageDefinition(pageKey);

    if (!definition) {
        return {
            pageKey,
            label: label ?? pageKey,
            durationMs,
            budgetMs: PAGE_LOAD_BUDGET_MS,
            status: "ignored",
        };
    }

    return {
        pageKey,
        label: label ?? definition.label,
        durationMs,
        budgetMs: PAGE_LOAD_BUDGET_MS,
        status: durationMs <= PAGE_LOAD_BUDGET_MS ? "ok" : "slow",
    };
}
