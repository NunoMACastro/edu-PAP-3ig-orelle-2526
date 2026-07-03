/**
 * Controller de detalhe publico de produto.
 */
import { getCatalogProductDetails } from "../services/product.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

/**
 * Devolve detalhe publico de um produto.
 *
 * @async
 * @function getProductDetailsController
 * @param {import("express").Request} req - Pedido com `productId`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com `{ product }`.
 */
export async function getProductDetailsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const product = await getCatalogProductDetails(productId);

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}
