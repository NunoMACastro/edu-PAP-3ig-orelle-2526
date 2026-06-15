// server/src/controllers/stock.controller.js
import { listLowStockProducts, setProductStock } from "../services/stock.service.js";
import { validateProductStockParams, validateStockPayload } from "../validators/stock.validator.js";

/**
 * Handler HTTP que devolve produtos com baixo stock.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
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
 * Handler HTTP que atualiza manualmente o stock de um produto.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
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