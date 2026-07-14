/**
 * Controllers administrativos de produtos.
 */
import {
    createProduct,
    getAdminProductForCuration,
    listAdminProducts,
    updateProductAiMetadata,
} from "../services/product.service.js";
import {
    validateProductAiMetadataInput,
    validateProductInput,
} from "../validators/product.validator.js";
import { validateProductStockParams } from "../validators/stock.validator.js";
import { validateAdminProductsQuery } from "../validators/admin-products-query.validator.js";

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

/** Lista produtos para o seletor humano da curadoria administrativa. */
export async function listAdminProductsController(req, res, next) {
    try {
        const filters = validateAdminProductsQuery(req.query);
        return res.status(200).json(await listAdminProducts(filters));
    } catch (error) {
        return next(error);
    }
}

/** Atualiza apenas metadata IA e variantes de um produto existente. */
export async function updateProductAiMetadataController(req, res, next) {
    try {
        const { productId } = validateProductStockParams(req.params);
        const current = await getAdminProductForCuration(productId);
        const metadata = validateProductAiMetadataInput(req.body, current.stock);
        const product = await updateProductAiMetadata(
            productId,
            current.stock,
            metadata,
        );
        return res.status(200).json({ product });
    } catch (error) {
        return next(error);
    }
}
