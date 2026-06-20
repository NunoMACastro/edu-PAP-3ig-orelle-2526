/**
 * Validador de preferencias do BK-MF0-06.
 *
 * O BK permite guardar marcas favoritas e, depois do BK-MF0-07, IDs de
 * produtos favoritos validados pelo service contra o catalogo real.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const MAX_BRANDS = 10;

/**
 * Normaliza uma marca escrita pelo utilizador.
 *
 * @function normalizeBrand
 * @param {unknown} value - Valor original.
 * @returns {string} Marca limpa e com espacos internos normalizados.
 */
function normalizeBrand(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Valida preferencias de marcas e produtos favoritos.
 *
 * @function validatePreferencesInput
 * @param {{favoriteBrandNames?: unknown, favoriteProductIds?: unknown}} body - Corpo do pedido.
 * @returns {{favoriteBrandNames: string[], favoriteProductIds: string[]}} Preferencias normalizadas.
 * @throws {AppError} Quando ha marcas em excesso ou IDs de produto invalidos.
 */
export function validatePreferencesInput(body) {
    const favoriteBrandNames = Array.isArray(body.favoriteBrandNames)
        ? [
              ...new Set(
                  body.favoriteBrandNames.map(normalizeBrand).filter(Boolean),
              ),
          ]
        : [];

    const favoriteProductIds = Array.isArray(body.favoriteProductIds)
        ? [...new Set(body.favoriteProductIds.map((id) => String(id).trim()))]
              .filter(Boolean)
        : [];

    const errors = {};

    if (favoriteBrandNames.length > MAX_BRANDS) {
        errors.favoriteBrandNames = `Máximo de ${MAX_BRANDS} marcas favoritas`;
    }

    const invalidProductIds = favoriteProductIds.filter(
        (id) => !mongoose.isValidObjectId(id),
    );

    if (invalidProductIds.length > 0) {
        errors.favoriteProductIds = "favoriteProductIds contem IDs invalidos";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Preferencias invalidas", errors);
    }

    return {
        favoriteBrandNames,
        favoriteProductIds,
    };
}
