/**
 * Utilitários puros de minimização para overrides humanos históricos.
 *
 * A identidade do consultor permanece apenas nos campos pesquisáveis de
 * review/audit. Overrides cifrados referenciam a review, não o utilizador.
 */

/** Confirma um objeto de domínio sem aceitar arrays. */
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Remove a referência legacy `reviewerId`, preservando o restante override.
 *
 * @param {unknown} humanOverride - Override já autenticado e decifrado.
 * @param {object} [options] - Restrição opcional ao revisor apagado.
 * @param {unknown} [options.expectedReviewerId] - ID que pode ser removido.
 * @returns {{value: object|null, removed: boolean}} Valor minimizado e estado.
 * @throws {Error} Quando um override não nulo não é um objeto válido.
 */
export function stripLegacyReviewerId(
    humanOverride,
    { expectedReviewerId } = {},
) {
    if (humanOverride === null || humanOverride === undefined) {
        return { value: null, removed: false };
    }
    if (!isRecord(humanOverride)) {
        throw new Error("Override humano histórico inválido");
    }
    if (!Object.hasOwn(humanOverride, "reviewerId")) {
        return { value: humanOverride, removed: false };
    }
    if (
        expectedReviewerId !== undefined &&
        String(humanOverride.reviewerId ?? "") !== String(expectedReviewerId)
    ) {
        return { value: humanOverride, removed: false };
    }

    const value = { ...humanOverride };
    delete value.reviewerId;
    return { value, removed: true };
}
