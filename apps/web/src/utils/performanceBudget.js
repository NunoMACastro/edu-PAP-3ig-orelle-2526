/**
 * Contratos de Web Vitals das áreas principais.
 *
 * Nenhum estado positivo é inferido a partir do tempo de montagem React. A UI
 * só alerta quando uma métrica browser real excede o orçamento; a validação de
 * PASS continua reservada à suite Playwright com LCP, CLS e transferência.
 */

export const WEB_VITAL_BUDGETS = Object.freeze({
    lcpMs: 3_000,
    cls: 0.1,
});

export const MAIN_PAGE_DEFINITIONS = Object.freeze([
    { key: "catalog", label: "Catálogo" },
    { key: "guided-consultation", label: "Consulta guiada" },
    { key: "consultation-report", label: "Relatório da consulta" },
    { key: "ai-history", label: "Histórico da consulta" },
    { key: "cart", label: "Carrinho" },
    { key: "checkout", label: "Confirmar encomenda" },
]);

export const MAIN_PAGE_KEYS = Object.freeze(
    MAIN_PAGE_DEFINITIONS.map((definition) => definition.key),
);

/**
 * Procura a definição de uma área principal.
 *
 * @param {string} pageKey - Identificador técnico da área.
 * @returns {{key: string, label: string}|undefined} Definição encontrada.
 */
export function findMainPageDefinition(pageKey) {
    return MAIN_PAGE_DEFINITIONS.find((definition) => definition.key === pageKey);
}

/**
 * Avalia apenas LCP e CLS observados pelo browser.
 *
 * @param {{pageKey: string, label?: string, lcpMs?: number|null, cls?: number|null, supportsLcp?: boolean, supportsCls?: boolean}} input - Métricas reais minimizadas.
 * @returns {{pageKey: string, label: string, lcpMs: number|null, cls: number|null, budgets: typeof WEB_VITAL_BUDGETS, status: "monitoring"|"slow"|"unsupported"|"ignored", violations: string[]}} Avaliação sem dados pessoais.
 */
export function evaluateWebVitals({
    pageKey,
    label,
    lcpMs = null,
    cls = null,
    supportsLcp = false,
    supportsCls = false,
}) {
    const definition = findMainPageDefinition(pageKey);
    const result = {
        pageKey,
        label: label ?? definition?.label ?? pageKey,
        lcpMs,
        cls,
        budgets: WEB_VITAL_BUDGETS,
        status: "monitoring",
        violations: [],
    };

    if (!definition) return { ...result, status: "ignored" };
    if (!supportsLcp && !supportsCls) {
        return { ...result, status: "unsupported" };
    }
    if (supportsLcp && Number(lcpMs) > WEB_VITAL_BUDGETS.lcpMs) {
        result.violations.push(
            `LCP ${Math.round(Number(lcpMs))}ms acima de ${WEB_VITAL_BUDGETS.lcpMs}ms`,
        );
    }
    if (supportsCls && Number(cls) > WEB_VITAL_BUDGETS.cls) {
        result.violations.push(
            `CLS ${Number(cls).toFixed(3)} acima de ${WEB_VITAL_BUDGETS.cls}`,
        );
    }

    return {
        ...result,
        status: result.violations.length > 0 ? "slow" : "monitoring",
    };
}
