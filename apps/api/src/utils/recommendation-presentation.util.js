/**
 * Helpers puros para apresentar recomendações sem misturar o snapshot da
 * máquina com uma correção humana persistida separadamente.
 */

/**
 * Resolve a explicação visível, preservando sempre a explicação de máquina no
 * documento e usando o ajuste humano apenas no boundary de apresentação.
 *
 * @param {object} recommendation - Recomendação lógica já decifrada.
 * @returns {string} Explicação humana ajustada ou snapshot da máquina.
 */
export function resolveEffectiveRecommendationExplanation(recommendation) {
    return resolveEffectiveRecommendationGuidance(recommendation).explanation;
}

/**
 * Resolve toda a orientação pública de uma recomendação.
 *
 * Os campos `adjusted*` são o contrato canónico v6. Os nomes sem prefixo são
 * aceites apenas como fallback de leitura para overrides legacy já persistidos.
 *
 * @param {object} recommendation - Recomendação lógica já decifrada.
 * @returns {{explanation: string|null, usage: string|null, cautions: string[]}}
 */
export function resolveEffectiveRecommendationGuidance(recommendation) {
    const override = recommendation?.humanOverride;
    const isAdjusted =
        override?.decision === "adjusted" ||
        (override && override.decision === undefined);
    const adjustedExplanation = isAdjusted
        ? override?.adjustedExplanation ?? override?.explanation
        : null;
    const adjustedUsage = isAdjusted
        ? override?.adjustedUsage ?? override?.usage
        : null;
    const adjustedCautions = isAdjusted
        ? override?.adjustedCautions ?? override?.cautions
        : null;

    return {
        explanation:
            typeof adjustedExplanation === "string" &&
            adjustedExplanation.trim()
                ? adjustedExplanation
                : recommendation?.explanation ?? null,
        usage:
            typeof adjustedUsage === "string" && adjustedUsage.trim()
                ? adjustedUsage
                : recommendation?.machineResult?.usage ?? null,
        cautions: Array.isArray(adjustedCautions)
            ? adjustedCautions
            : recommendation?.machineResult?.cautions ?? [],
    };
}
