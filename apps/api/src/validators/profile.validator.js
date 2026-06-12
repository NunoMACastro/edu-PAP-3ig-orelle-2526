/**
 * Validadores de perfil personalizado.
 *
 * O BK-MF0-03 cria o perfil inicial. O BK-MF0-04 reutiliza os mesmos limites
 * para edicao controlada, impedindo que o cliente altere campos de sistema.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { GENDERS, SKIN_TYPES } from "../models/profile.model.js";

/**
 * Normaliza texto simples vindo de formularios.
 *
 * @function normalizeText
 * @param {unknown} value - Valor original.
 * @returns {string} Texto sem espacos nas pontas.
 */
function normalizeText(value) {
    return String(value ?? "").trim();
}

/**
 * Normaliza listas de texto, removendo vazios e duplicados.
 *
 * @function normalizeList
 * @param {unknown} value - Valor original, esperado como array.
 * @returns {string[]} Lista em minusculas, sem vazios e sem duplicados.
 */
function normalizeList(value) {
    if (!Array.isArray(value)) return [];

    return [
        ...new Set(
            value
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

/**
 * Valida a criacao do perfil personalizado do RF03.
 *
 * @function validateCreateProfileInput
 * @param {{nome?: unknown, idade?: unknown, tipoDePele?: unknown, genero?: unknown, objetivos?: unknown}} body - Corpo do pedido.
 * @returns {{nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[]}} Dados validados.
 * @throws {AppError} Quando algum campo nao cumpre o contrato do perfil.
 */
export function validateCreateProfileInput(body) {
    const input = {
        nome: normalizeText(body.nome),
        idade: Number(body.idade),
        tipoDePele: normalizeText(body.tipoDePele).toLowerCase(),
        genero: normalizeText(body.genero).toLowerCase(),
        objetivos: normalizeList(body.objetivos),
    };

    const errors = {};

    if (input.nome.length < 2 || input.nome.length > 80) {
        errors.nome = "Nome deve ter entre 2 e 80 caracteres";
    }

    if (
        !Number.isInteger(input.idade) ||
        input.idade < 13 ||
        input.idade > 120
    ) {
        errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
    }

    if (!SKIN_TYPES.includes(input.tipoDePele)) {
        errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
    }

    if (!GENDERS.includes(input.genero)) {
        errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
    }

    if (input.objetivos.length === 0 || input.objetivos.length > 5) {
        errors.objetivos = "Indica entre 1 e 5 objetivos";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return input;
}

/**
 * Valida a edicao controlada do perfil do RF04.
 *
 * @function validateUpdateProfileInput
 * @param {Record<string, unknown>} body - Corpo do pedido de edicao.
 * @returns {Partial<{nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[]}>} Campos permitidos para atualizar.
 * @throws {AppError} Quando o payload esta vazio, invalido ou tenta alterar campos proibidos.
 */
export function validateUpdateProfileInput(body) {
    const forbiddenKeys = ["userId", "role", "_id", "createdAt", "updatedAt"];
    const payload = {};
    const errors = {};

    // Campos de sistema pertencem ao backend e nunca devem ser aceites do cliente.
    for (const key of forbiddenKeys) {
        if (key in body) {
            errors[key] = "Este campo não pode ser alterado pelo cliente";
        }
    }

    if ("nome" in body) {
        const nome = normalizeText(body.nome);
        if (nome.length < 2 || nome.length > 80) {
            errors.nome = "Nome deve ter entre 2 e 80 caracteres";
        } else {
            payload.nome = nome;
        }
    }

    if ("idade" in body) {
        const idade = Number(body.idade);
        if (!Number.isInteger(idade) || idade < 13 || idade > 120) {
            errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
        } else {
            payload.idade = idade;
        }
    }

    if ("tipoDePele" in body) {
        const tipoDePele = normalizeText(body.tipoDePele).toLowerCase();
        if (!SKIN_TYPES.includes(tipoDePele)) {
            errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
        } else {
            payload.tipoDePele = tipoDePele;
        }
    }

    if ("genero" in body) {
        const genero = normalizeText(body.genero).toLowerCase();
        if (!GENDERS.includes(genero)) {
            errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
        } else {
            payload.genero = genero;
        }
    }

    if ("objetivos" in body) {
        const objetivos = normalizeList(body.objetivos);
        if (objetivos.length === 0 || objetivos.length > 5) {
            errors.objetivos = "Indica entre 1 e 5 objetivos";
        } else {
            payload.objetivos = objetivos;
        }
    }

    if (Object.keys(payload).length === 0) {
        errors.base = "Nada para atualizar";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return payload;
}
