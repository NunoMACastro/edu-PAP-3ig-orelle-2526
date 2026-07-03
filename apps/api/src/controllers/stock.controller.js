/**
 * Controllers de gestao administrativa de stock.
 */
import {
    listLowStockProducts,
    setProductStock,
} from "../services/stock.service.js";
import {
    validateProductStockParams,
    validateStockPayload,
} from "../validators/stock.validator.js";

/**
 * Lista alertas de baixo stock.
 *
 * @async
 * @function listLowStockProductsController
 * @param {import("express").Request} req - Pedido admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listLowStockProductsController(req, res, next) {
    try {
        const products = await listLowStockProducts();
        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza stock de um produto.
 *
 * @async
 * @function updateProductStockController
 * @param {import("express").Request} req - Pedido admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function updateProductStockController(req, res, next) {
    try {
        const { productId } = validateProductStockParams(req.params);
        const { stock } = validateStockPayload(req.body);
        const product = await setProductStock(productId, stock);

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}
