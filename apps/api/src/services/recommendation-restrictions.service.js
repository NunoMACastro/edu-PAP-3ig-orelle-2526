/**
 * Helpers de restricoes de perfil para recomendacoes.
 */

/**
 * Normaliza termos de ingredientes/restricoes para comparacao exata.
 *
 * @function normalizeRestrictionTerm
 * @param {unknown} value - Valor original.
 * @returns {string} Termo normalizado.
 */
function normalizeRestrictionTerm(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Junta alergias e ingredientes a evitar declarados no perfil.
 *
 * @function getBlockedIngredientsFromProfile
 * @param {object|null} profile - Perfil do utilizador.
 * @returns {string[]} Ingredientes bloqueados.
 */
export function getBlockedIngredientsFromProfile(profile) {
    return [
        ...new Set(
            [
                ...(profile?.allergies ?? []),
                ...(profile?.avoidIngredients ?? []),
            ]
                .map(normalizeRestrictionTerm)
                .filter(Boolean),
        ),
    ];
}

/**
 * Verifica se um produto viola restricoes declaradas.
 *
 * @function getProductRestrictionConflict
 * @param {object} product - Produto candidato.
 * @param {object|null} profile - Perfil do utilizador.
 * @returns {{blocked: boolean, matchedIngredients: string[]}} Resultado.
 */
export function getProductRestrictionConflict(product, profile) {
    const blockedIngredients = getBlockedIngredientsFromProfile(profile);
    const productIngredients = (product.ingredientNames ?? []).map(
        normalizeRestrictionTerm,
    );
    const matchedIngredients = productIngredients.filter((ingredient) =>
        blockedIngredients.includes(ingredient),
    );

    return {
        blocked: matchedIngredients.length > 0,
        matchedIngredients,
    };
}

/**
 * Remove produtos incompativeis com alergias/ingredientes a evitar.
 *
 * @function filterProductsBlockedByProfile
 * @param {object[]} products - Produtos candidatos.
 * @param {object|null} profile - Perfil do utilizador.
 * @returns {object[]} Produtos seguros para ranking.
 */
export function filterProductsBlockedByProfile(products, profile) {
    return products.filter(
        (product) => !getProductRestrictionConflict(product, profile).blocked,
    );
}
