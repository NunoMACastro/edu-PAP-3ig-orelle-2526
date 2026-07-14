/**
 * Gate Axe sem serializar conteúdo, PII ou HTML dos nós em falha.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";

const WCAG_TAGS = Object.freeze([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
]);
const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

/**
 * Exige zero violações Axe serious/critical no documento atual.
 *
 * O resumo de erro inclui apenas rule id, impacto e contagem. Nunca inclui o
 * HTML, seletores, emails ou dados biométricos devolvidos por `nodes`.
 *
 * @param {import("@playwright/test").Page} page - Página pronta para análise.
 * @returns {Promise<void>} Conclusão do scan e da asserção.
 */
export async function expectNoSeriousOrCriticalAxeViolations(page) {
    const results = await new AxeBuilder({ page })
        .withTags([...WCAG_TAGS])
        .analyze();
    const blockingSummary = results.violations
        .filter((violation) => BLOCKING_IMPACTS.has(violation.impact))
        .map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodeCount: violation.nodes.length,
        }));
    expect(
        blockingSummary,
        "Axe encontrou violações serious/critical (resumo sanitizado)",
    ).toEqual([]);
}
