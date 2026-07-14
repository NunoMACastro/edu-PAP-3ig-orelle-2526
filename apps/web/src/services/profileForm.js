/**
 * Transformações puras entre o perfil da API e o formulário da conta.
 */

export const PROFILE_LOAD_STATES = Object.freeze({
    LOADING: "loading",
    MISSING: "missing",
    EXISTING: "existing",
    ERROR: "error",
});

/**
 * Cria o estado inicial do formulário sem partilhar referências mutáveis.
 *
 * @returns {Record<string, string>} Campos vazios e defaults do perfil.
 */
export function createEmptyProfileForm() {
    return {
        nome: "",
        idade: "",
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivosTexto: "hidratar",
        allergiesTexto: "",
        avoidIngredientsTexto: "",
        lightMedicalRestrictionsTexto: "",
    };
}

/**
 * Converte um perfil público da API em valores editáveis.
 *
 * @param {Record<string, unknown>} profile - Perfil devolvido por GET/PUT.
 * @returns {Record<string, string>} Estado adequado ao formulário.
 */
export function profileToForm(profile) {
    return {
        nome: String(profile.nome ?? ""),
        idade: String(profile.idade ?? ""),
        tipoDePele: String(profile.tipoDePele ?? "mista"),
        genero: String(profile.genero ?? "prefiro_nao_dizer"),
        objetivosTexto: (profile.objetivos ?? []).join(", "),
        allergiesTexto: (profile.allergies ?? []).join(", "),
        avoidIngredientsTexto: (profile.avoidIngredients ?? []).join(", "),
        lightMedicalRestrictionsTexto: (
            profile.lightMedicalRestrictions ?? []
        ).join(", "),
    };
}

/**
 * Converte texto separado por vírgulas numa lista limpa para a API.
 *
 * @param {unknown} value - Texto introduzido no formulário.
 * @returns {string[]} Itens não vazios.
 */
function splitList(value) {
    return String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

/**
 * Constrói apenas os campos aceites pelos endpoints de perfil.
 *
 * @param {Record<string, string>} form - Estado atual do formulário.
 * @returns {Record<string, unknown>} Payload de criação ou edição.
 */
export function profileFormToPayload(form) {
    return {
        nome: form.nome.trim(),
        idade: Number(form.idade),
        tipoDePele: form.tipoDePele,
        genero: form.genero,
        objetivos: splitList(form.objetivosTexto),
        allergies: splitList(form.allergiesTexto),
        avoidIngredients: splitList(form.avoidIngredientsTexto),
        lightMedicalRestrictions: splitList(
            form.lightMedicalRestrictionsTexto,
        ),
    };
}

/**
 * Escolhe o verbo correto após o GET inicial do perfil.
 *
 * @param {string} loadState - Estado resultante do GET `/profile/me`.
 * @returns {"POST"|"PUT"} POST apenas para 404 e PUT para perfil existente.
 * @throws {Error} Quando ainda não é seguro guardar.
 */
export function resolveProfileWriteMethod(loadState) {
    if (loadState === PROFILE_LOAD_STATES.MISSING) return "POST";
    if (loadState === PROFILE_LOAD_STATES.EXISTING) return "PUT";

    throw new Error("O estado atual do perfil não permite guardar alterações");
}
