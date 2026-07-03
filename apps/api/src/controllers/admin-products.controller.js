/**
 * Controllers administrativos de produtos.
 */
import { createProduct } from "../services/product.service.js";
import { validateProductInput } from "../validators/product.validator.js";

/**
 * Cria um produto no catalogo.
 *
 * @async
 * @function createProductController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com produto criado.
 */
export async function createProductController(req, res, next) {
    try {
        const input = validateProductInput(req.body);
        const product = await createProduct(input, req.user.id);

        return res.status(201).json({ product });
    } catch (err) {
        return next(err);
    }
}
