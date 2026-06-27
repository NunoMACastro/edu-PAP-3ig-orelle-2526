/**
 * Validador dos filtros publicos do catalogo da MF1.
 *
 * O backend recebe query params como texto, normaliza-os e rejeita valores que
 * possam quebrar o contrato do RF09 antes de consultar MongoDB.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

/**
 * Normaliza texto simples vindo da query string.
 *
 * @function normalizeText
 * @param {unknown} value - Valor recebido do cliente.
 * @returns {string} Texto com espacos normalizados.
 */
function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Devolve texto normalizado ou undefined quando o filtro nao foi enviado.
 *
 * @function normalizeOptionalText
 * @param {unknown} value - Valor opcional da query.
 * @returns {string|undefined} Texto seguro ou ausencia de filtro.
 */
function normalizeOptionalText(value) {
    const text = normalizeText(value);
    return text.length > 0 ? text : undefined;
}

/**
 * Converte precos opcionais em inteiros de centimos.
 *
 * @function parseOptionalPrice
 * @param {unknown} value - Valor recebido na query.
 * @param {string} fieldName - Nome do campo para mensagens de erro.
 * @param {Record<string, string>} errors - Acumulador de erros.
 * @returns {number|undefined} Preco validado ou undefined.
 */
function parseOptionalPrice(value, fieldName, errors) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
        errors[fieldName] = `${fieldName} deve ser inteiro em cêntimos`;
        return undefined;
    }

    return numberValue;
}

/**
 * Valida filtros publicos do catalogo.
 *
 * @function validateCatalogQuery
 * @param {Record<string, unknown>} query - Query params do Express.
 * @returns {{search?: string, brandName?: string, skinType?: string, categoryId?: string, minPriceCents?: number, maxPriceCents?: number}} Filtros normalizados.
 * @throws {AppError} Quando algum filtro quebra o contrato do BK-MF1-01.
 */
export function validateCatalogQuery(query) {
    const errors = {};
    const input = {
        search: normalizeOptionalText(query.search),
        brandName: normalizeOptionalText(query.brandName),
        skinType: normalizeOptionalText(query.skinType),
        categoryId: normalizeOptionalText(query.categoryId),
        minPriceCents: parseOptionalPrice(
            query.minPriceCents,
            "minPriceCents",
            errors,
        ),
        maxPriceCents: parseOptionalPrice(
            query.maxPriceCents,
            "maxPriceCents",
            errors,
        ),
    };

    if (input.skinType && !SKIN_TYPES.includes(input.skinType)) {
        errors.skinType = `Tipo de pele deve ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (input.categoryId && !mongoose.isValidObjectId(input.categoryId)) {
        errors.categoryId = "Categoria invalida";
    }

    if (
        input.minPriceCents !== undefined &&
        input.maxPriceCents !== undefined &&
        input.minPriceCents > input.maxPriceCents
    ) {
        errors.price = "Preço mínimo não pode ser maior do que preço máximo";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Filtros de catálogo inválidos", errors);
    }

    return input;
}
