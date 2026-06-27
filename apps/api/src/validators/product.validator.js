/**
 * Validador de produtos do BK-MF0-07.
 *
 * O objetivo e proteger a rota admin de produtos contra payloads incompletos,
 * precos/stock invalidos e claims medicos que nao pertencem ao escopo cosmetico
 * documentado da MF0.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

const BLOCKED_CLAIM_WORDS = [
    "cura",
    "curar",
    "tratamento medico",
    "tratamento clinico",
    "elimina acne",
    "remove rugas",
    "doenca",
    "medicamento",
];

/**
 * Normaliza texto simples.
 *
 * @function normalizeText
 * @param {unknown} value - Valor recebido do cliente.
 * @returns {string} Texto limpo e com espacos internos normalizados.
 */
function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Normaliza uma lista de strings.
 *
 * @function normalizeList
 * @param {unknown} value - Valor esperado como array.
 * @returns {string[]} Lista normalizada, em minusculas e sem duplicados.
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
 * Valida e normaliza o URL da imagem do produto.
 *
 * @function assertControlledImageUrl
 * @param {unknown} value - Valor recebido em `imageUrl`.
 * @param {Record<string, string>} errors - Objeto de erros a preencher.
 * @returns {string} URL normalizado ou string vazia em caso de erro.
 */
function assertControlledImageUrl(value, errors) {
    try {
        const url = new URL(String(value ?? "").trim());
        if (!["http:", "https:"].includes(url.protocol)) {
            errors.imageUrl = "Imagem deve ser URL http/https";
        }
        return url.toString();
    } catch {
        errors.imageUrl = "Imagem deve ser URL valido";
        return "";
    }
}

/**
 * Deteta claims medicos bloqueados no texto do produto.
 *
 * @function hasBlockedClaims
 * @param {string} description - Descricao normalizada do produto.
 * @returns {boolean} Verdadeiro quando a descricao contem claim bloqueado.
 */
function hasBlockedClaims(description) {
    const normalized = description.toLowerCase();
    return BLOCKED_CLAIM_WORDS.some((word) => normalized.includes(word));
}

/**
 * Valida o payload de criacao de produto.
 *
 * @function validateProductInput
 * @param {Record<string, unknown>} body - Corpo do pedido admin.
 * @returns {{name: string, brandName: string, description: string, ingredientNames: string[], skinTypes: string[], imageUrl: string, priceCents: number, stock: number}} Produto normalizado.
 * @throws {AppError} Quando algum campo quebra o contrato do RF07.
 */
export function validateProductInput(body) {
    const input = {
        name: normalizeText(body.name),
        brandName: normalizeText(body.brandName),
        description: normalizeText(body.description),
        ingredientNames: normalizeList(body.ingredientNames),
        skinTypes: normalizeList(body.skinTypes),
        imageUrl: "",
        priceCents: Number(body.priceCents),
        stock: Number(body.stock),
    };

    const errors = {};
    input.imageUrl = assertControlledImageUrl(body.imageUrl, errors);

    if (input.name.length < 2 || input.name.length > 120) {
        errors.name = "Nome deve ter entre 2 e 120 caracteres";
    }

    if (input.brandName.length < 2 || input.brandName.length > 80) {
        errors.brandName = "Marca deve ter entre 2 e 80 caracteres";
    }

    if (input.description.length < 20 || input.description.length > 1000) {
        errors.description = "Descrição deve ter entre 20 e 1000 caracteres";
    }

    if (hasBlockedClaims(input.description)) {
        errors.description =
            "Descrição não pode conter claims clínicos ou médicos não documentados";
    }

    if (input.ingredientNames.length === 0) {
        errors.ingredientNames = "Indica pelo menos um ingrediente";
    }

    if (
        input.skinTypes.length === 0 ||
        input.skinTypes.some((type) => !SKIN_TYPES.includes(type))
    ) {
        errors.skinTypes = `Tipos de pele devem ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
        errors.priceCents =
            "Preço deve ser inteiro em cêntimos e maior ou igual a zero";
    }

    if (!Number.isInteger(input.stock) || input.stock < 0) {
        errors.stock = "Stock deve ser inteiro maior ou igual a zero";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Produto invalido", errors);
    }

    return input;
}
