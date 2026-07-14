/**
 * Controllers publicos do catalogo MF1.
 */
import {
    listCatalogProducts,
    listFeaturedCatalogProducts,
} from "../services/product.service.js";
import { listPublicCategories } from "../services/category.service.js";
import { validateCatalogQuery } from "../validators/catalog-query.validator.js";

/**
 * Lista produtos publicos com filtros validados.
 *
 * @async
 * @function listCatalogProductsController
 * @param {import("express").Request} req - Pedido com query params opcionais.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com `{ products }`.
 */
export async function listCatalogProductsController(req, res, next) {
    try {
        const filters = validateCatalogQuery(req.query);
        const products = await listCatalogProducts(filters);

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista produtos em destaque para a homepage publica.
 *
 * @async
 * @function listFeaturedCatalogProductsController
 * @param {import("express").Request} req - Pedido publico sem parametros.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com `{ products }`.
 */
export async function listFeaturedCatalogProductsController(req, res, next) {
    try {
        const products = await listFeaturedCatalogProducts();

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista categorias ativas sem expor campos administrativos.
 *
 * @async
 * @function listPublicCategoriesController
 * @param {import("express").Request} req - Pedido público.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta `{ categories }`.
 */
export async function listPublicCategoriesController(req, res, next) {
    try {
        const categories = await listPublicCategories();
        return res.status(200).json({ categories });
    } catch (err) {
        return next(err);
    }
}
