export const PAGE_LOAD_BUDGET_MS = 3_000;

export const MAIN_PAGE_DEFINITIONS = Object.freeze([
    { key: "catalog", label: "Catálogo" },
    { key: "face-analysis", label: "Análise facial" },
    { key: "face-report", label: "Relatório facial" },
    { key: "recommendations", label: "Recomendações" },
    { key: "cart", label: "Carrinho" },
    { key: "checkout", label: "Checkout" },
]);

export const MAIN_PAGE_KEYS = Object.freeze(
    MAIN_PAGE_DEFINITIONS.map((definition) => definition.key),
);

/**
 * Procura a definição técnica de uma página principal.
 *
 * @function getMainPageDefinition
 * @param {string} pageKey - Chave técnica da página medida.
 * @returns {{key: string, label: string}|null} Definição encontrada ou null.
 */
export function getMainPageDefinition(pageKey) {
    return MAIN_PAGE_DEFINITIONS.find((definition) => definition.key === pageKey) ?? null;
}

/**
 * Avalia se uma medição respeita o orçamento de RNF06.
 *
 * @function evaluatePageLoadBudget
 * @param {{pageKey: string, loadMs: number}} input - Página medida e duração observada.
 * @returns {{pageKey: string, pageLabel: string, loadMs: number, budgetMs: number, status: "ok"|"slow"|"ignored"}} Resultado minimizado para UI e evidence.
 */
export function evaluatePageLoadBudget({ pageKey, loadMs }) {
    const definition = getMainPageDefinition(pageKey);
    const safeLoadMs = Number.isFinite(loadMs) ? Math.max(0, Math.round(loadMs)) : 0;

    if (!definition) {
        // Chaves desconhecidas são ignoradas para evitar falsos alertas em páginas fora do RNF06.
        return {
            pageKey,
            pageLabel: "Página fora do orçamento RNF06",
            loadMs: safeLoadMs,
            budgetMs: PAGE_LOAD_BUDGET_MS,
            status: "ignored",
        };
    }

    return {
        pageKey: definition.key,
        pageLabel: definition.label,
        loadMs: safeLoadMs,
        budgetMs: PAGE_LOAD_BUDGET_MS,
        status: safeLoadMs <= PAGE_LOAD_BUDGET_MS ? "ok" : "slow",
    };
}