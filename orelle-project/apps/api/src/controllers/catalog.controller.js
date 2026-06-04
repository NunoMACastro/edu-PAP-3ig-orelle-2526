import { listCatalogProducts } from "../services/product.service.js";
import { validateCatalogQuery } from "../validators/catalog-query.validator.js";

export async function listCatalogProductsController(req, res, next) {
    try {
        const filters = validateCatalogQuery(req.query);
        const products = await listCatalogProducts(filters);

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}