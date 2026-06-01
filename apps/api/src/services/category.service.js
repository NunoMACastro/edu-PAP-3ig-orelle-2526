/**
 * Servico de categorias.
 *
 * Implementa criacao, seed idempotente e associacao de categorias a produtos no
 * BK-MF0-08.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

/**
 * Converte uma categoria em resposta JSON.
 *
 * @function toCategoryResponse
 * @param {object} category - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, name: string, slug: string, description: string}} Categoria segura.
 */
function toCategoryResponse(category) {
    return {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
    };
}

/**
 * Converte o resultado de associacao de categorias num produto.
 *
 * @function toProductCategoryResponse
 * @param {object} product - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, name: string, categoryIds: string[]}} Produto com categorias.
 */
function toProductCategoryResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

/**
 * Cria uma categoria administrativamente.
 *
 * @async
 * @function createCategory
 * @param {{name: string, slug: string, description: string}} input - Categoria validada.
 * @returns {Promise<object>} Categoria criada.
 */
export async function createCategory(input) {
    const category = await Category.create(input);
    return toCategoryResponse(category);
}

/**
 * Lista categorias por ordem estavel de slug.
 *
 * @async
 * @function listCategories
 * @returns {Promise<object[]>} Categorias disponiveis para administracao.
 */
export async function listCategories() {
    const categories = await Category.find({}).sort({ slug: 1 });
    return categories.map(toCategoryResponse);
}

/**
 * Cria uma categoria inicial sem duplicar o mesmo slug.
 *
 * @async
 * @function seedCategory
 * @param {{name: string, slug: string, description: string}} input - Categoria inicial.
 * @returns {Promise<object>} Categoria existente ou criada.
 */
export async function seedCategory(input) {
    const category = await Category.findOneAndUpdate(
        { slug: input.slug },
        { $setOnInsert: input },
        { upsert: true, new: true },
    );

    return toCategoryResponse(category);
}

/**
 * Associa categorias existentes a um produto existente.
 *
 * @async
 * @function assignCategoriesToProduct
 * @param {string} productId - ID do produto alvo.
 * @param {string[]} categoryIds - IDs de categorias ja validados como ObjectId.
 * @returns {Promise<object>} Produto atualizado com categorias.
 * @throws {AppError} Quando alguma categoria ou produto nao existe.
 */
export async function assignCategoriesToProduct(productId, categoryIds) {
    const found = await Category.countDocuments({ _id: { $in: categoryIds } });

    if (found !== categoryIds.length) {
        throw new AppError(400, "Uma ou mais categorias não existem");
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { categoryIds } },
        { new: true, runValidators: true },
    );

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return toProductCategoryResponse(product);
}
