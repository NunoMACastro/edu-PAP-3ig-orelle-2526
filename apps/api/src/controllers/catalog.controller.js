/**
 * Controllers publicos do catalogo MF1.
 */
import { listCatalogProducts } from "../services/product.service.js";
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
