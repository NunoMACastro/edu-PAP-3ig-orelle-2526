import { listRelatedCatalogProducts } from "../services/related-products.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

export async function listRelatedProductsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const products = await listRelatedCatalogProducts(productId);

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}