import { AppError } from "../middlewares/error.middleware.js";

const MAX_BRANDS = 10;

function normalizeBrand(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

export function validatePreferencesInput(body) {
    const favoriteBrandNames = Array.isArray(body.favoriteBrandNames)
        ? [
              ...new Set(
                  body.favoriteBrandNames.map(normalizeBrand).filter(Boolean),
              ),
          ]
        : [];

    const favoriteProductIds = Array.isArray(body.favoriteProductIds)
        ? body.favoriteProductIds
        : [];

    const errors = {};

    if (favoriteBrandNames.length > MAX_BRANDS) {
        errors.favoriteBrandNames = `Maximo de ${MAX_BRANDS} marcas favoritas`;
    }

    if (favoriteProductIds.length > 0) {
        errors.favoriteProductIds =
            "Produtos favoritos so ficam ativos depois do BK-MF0-07 criar o catalogo";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Preferencias invalidas", errors);
    }

    return {
        favoriteBrandNames,
        favoriteProductIds: [],
    };
}