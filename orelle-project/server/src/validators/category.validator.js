import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function validateCategoryInput(body) {
    const name = String(body.name ?? "").trim();
    const slug = slugify(body.slug ?? name);
    const description = String(body.description ?? "").trim();
    const errors = {};

    if (name.length < 2 || name.length > 80) {
        errors.name = "Nome da categoria deve ter entre 2 e 80 caracteres";
    }

    if (slug.length < 2) {
        errors.slug = "Slug da categoria invalido";
    }

    if (description.length > 300) {
        errors.description = "Descricao deve ter no maximo 300 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Categoria invalida", errors);
    }

    return { name, slug, description };
}

export function validateCategoryIds(body) {
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    if (categoryIds.length === 0) {
        throw new AppError(400, "Indica pelo menos uma categoria");
    }

    const invalid = categoryIds.filter((id) => !mongoose.isValidObjectId(id));

    if (invalid.length > 0) {
        throw new AppError(400, "categoryIds contem IDs invalidos", {
            invalid,
        });
    }

    return [...new Set(categoryIds)];
}