/**
 * Controllers administrativos de categorias.
 */
import {
    assignCategoriesToProduct,
    createCategory,
    listCategories,
} from "../services/category.service.js";
import {
    validateCategoryIds,
    validateCategoryInput,
} from "../validators/category.validator.js";

/**
 * Cria uma categoria.
 *
 * @async
 * @function createCategoryController
 * @param {import("express").Request} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com categoria.
 */
export async function createCategoryController(req, res, next) {
    try {
        const input = validateCategoryInput(req.body);
        const category = await createCategory(input);

        return res.status(201).json({ category });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista categorias administraveis.
 *
 * @async
 * @function listCategoriesController
 * @param {import("express").Request} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com categorias.
 */
export async function listCategoriesController(req, res, next) {
    try {
        const categories = await listCategories();

        return res.status(200).json({ categories });
    } catch (err) {
        return next(err);
    }
}

/**
 * Associa categorias existentes a um produto.
 *
 * @async
 * @function assignProductCategoriesController
 * @param {import("express").Request} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com produto atualizado.
 */
export async function assignProductCategoriesController(req, res, next) {
    try {
        const categoryIds = validateCategoryIds(req.body);
        const product = await assignCategoriesToProduct(
            req.params.productId,
            categoryIds,
        );

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}
