import { getCatalogProductDetails } from "../services/product.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

export async function getProductDetailsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const product = await getCatalogProductDetails(productId);

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}