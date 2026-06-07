/**
 * Controller de produtos relacionados por catalogo.
 */
import { listRelatedCatalogProducts } from "../services/related-products.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

/**
 * Lista produtos semelhantes/complementares de um produto.
 *
 * @async
 * @function listRelatedProductsController
 * @param {import("express").Request} req - Pedido com `productId`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com `relatedProducts`.
 */
export async function listRelatedProductsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const relatedProducts = await listRelatedCatalogProducts(productId);

        return res.status(200).json({ relatedProducts });
    } catch (err) {
        return next(err);
    }
}
