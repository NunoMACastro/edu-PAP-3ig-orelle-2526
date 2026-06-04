import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

function normalizeText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value) {
    const text = normalizeText(value);
    return text.length > 0 ? text : undefined;
}

function parseOptionalPrice(value, fieldName, errors) {
    if (value === undefined || value === null || value === "") return undefined;

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
        errors[fieldName] = `${fieldName} deve ser inteiro em cêntimos`;
        return undefined;
    }

    return numberValue;
}

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