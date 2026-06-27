/**
 * Validadores de categorias do BK-MF0-08.
 *
 * As categorias sao administradas por endpoints protegidos e associadas a
 * produtos ja existentes, preparando o handoff para pesquisa e filtragem.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Cria um slug estavel a partir de texto humano.
 *
 * @function slugify
 * @param {unknown} value - Nome ou slug enviado.
 * @returns {string} Slug minusculo, sem acentos e separado por hifens.
 */
export function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Valida a criacao de uma categoria.
 *
 * @function validateCategoryInput
 * @param {{name?: unknown, slug?: unknown, description?: unknown}} body - Corpo do pedido.
 * @returns {{name: string, slug: string, description: string}} Categoria normalizada.
 * @throws {AppError} Quando nome, slug ou descricao sao invalidos.
 */
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
        errors.description = "Descrição deve ter no máximo 300 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Categoria invalida", errors);
    }

    return { name, slug, description };
}

/**
 * Valida a lista de categorias a associar a um produto.
 *
 * @function validateCategoryIds
 * @param {{categoryIds?: unknown}} body - Corpo do pedido.
 * @returns {string[]} Lista unica de ObjectIds em formato string.
 * @throws {AppError} Quando a lista esta vazia ou contem IDs invalidos.
 */
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
