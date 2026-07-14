/**
 * Service do carrinho de compras.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
    buildVariantSnapshot,
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";

/**
 * Converte item de carrinho para DTO publico.
 *
 * @function toCartItemResponse
 * @param {object} item - Item Mongoose ou mock equivalente.
 * @returns {object} Item seguro para frontend.
 */
function toCartItemResponse(item) {
    const lineTotalCents = item.priceSnapshotCents * item.quantity;

    return {
        productId: item.productId.toString(),
        variantId: item.variantId ?? null,
        variant: item.variantId
            ? {
                  variantId: item.variantSnapshot?.variantId ?? item.variantId,
                  label: item.variantSnapshot?.label ?? null,
                  colorHex: item.variantSnapshot?.colorHex ?? null,
                  undertone: item.variantSnapshot?.undertone ?? null,
                  finish: item.variantSnapshot?.finish ?? null,
                  coverage: item.variantSnapshot?.coverage ?? null,
                  imageUrl: item.variantSnapshot?.imageUrl ?? null,
              }
            : null,
        name: item.productNameSnapshot,
        quantity: item.quantity,
        priceSnapshotCents: item.priceSnapshotCents,
        lineTotalCents,
    };
}

/**
 * Converte carrinho para DTO publico.
 *
 * @function toCartResponse
 * @param {object|null} cart - Documento de carrinho ou null.
 * @returns {{items: object[], totalQuantity: number, totalCents: number}} DTO.
 */
export function toCartResponse(cart) {
    const items = cart?.items?.map(toCartItemResponse) ?? [];

    return {
        items,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    };
}

/**
 * Carrega o carrinho do utilizador autenticado.
 *
 * @async
 * @function getMyCart
 * @param {string} userId - ID de sessao.
 * @returns {Promise<object>} Carrinho publico.
 */
export async function getMyCart(userId) {
    const cart = await Cart.findOne({ userId });
    return toCartResponse(cart);
}

/**
 * Procura produto vendavel para carrinho.
 *
 * @async
 * @function findPurchasableProduct
 * @param {string} productId - ID do produto.
 * @param {number} quantity - Quantidade pedida.
 * @returns {Promise<object>} Produto existente.
 * @throws {AppError} Quando produto nao existe ou stock nao chega.
 */
async function findPurchasableProduct(productId, quantity, variantId = null) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto nao encontrado");
    }

    const variant = resolveProductVariant(product, variantId);
    const availableStock = resolveVariantStock(product, variant);

    if (availableStock < quantity) {
        throw new AppError(409, "Stock insuficiente para a quantidade pedida");
    }

    return {
        product,
        variant,
        availableStock,
        priceCents: resolveVariantPriceCents(product, variant),
    };
}

/**
 * Devolve carrinho existente ou cria um carrinho vazio para o utilizador.
 *
 * @async
 * @function findOrCreateCart
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object>} Carrinho Mongoose.
 */
async function findOrCreateCart(userId) {
    try {
        return await Cart.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId, items: [] } },
            {
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
                upsert: true,
            },
        );
    } catch (error) {
        if (error?.code !== 11000) throw error;
        const winner = await Cart.findOne({ userId });
        if (winner) return winner;
        throw error;
    }
}

/**
 * Adiciona produto ao carrinho autenticado, sem aceitar preco ou userId do frontend.
 *
 * @async
 * @function addItemToCart
 * @param {string} userId - ID autenticado.
 * @param {{productId: string, quantity: number}} input - Produto e quantidade.
 * @returns {Promise<object>} Carrinho atualizado.
 */
export async function addItemToCart(userId, input) {
    const resolved = await findPurchasableProduct(
        input.productId,
        input.quantity,
        input.variantId,
    );
    const { product, variant, availableStock, priceCents } = resolved;
    const variantId = variant?.variantId ?? null;
    const variantSnapshot = buildVariantSnapshot(variant);
    await findOrCreateCart(userId);

    const identityMatch = {
        productId: product._id,
        variantId,
    };
    const pipelineIdentityMatch = {
        $and: [
            { $eq: ["$$item.productId", product._id] },
            {
                $eq: [
                    { $ifNull: ["$$item.variantId", null] },
                    variantId,
                ],
            },
        ],
    };

    const cart = await Cart.findOneAndUpdate(
        {
            userId,
            $or: [
                { items: { $not: { $elemMatch: identityMatch } } },
                {
                    items: {
                        $elemMatch: {
                            ...identityMatch,
                            quantity: {
                                $lte: availableStock - input.quantity,
                            },
                        },
                    },
                },
            ],
        },
        [
            {
                $set: {
                    items: {
                        $cond: [
                            {
                                $anyElementTrue: {
                                    $map: {
                                        input: "$items",
                                        as: "item",
                                        in: pipelineIdentityMatch,
                                    },
                                },
                            },
                            {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $cond: [
                                            {
                                                ...pipelineIdentityMatch,
                                            },
                                            {
                                                $mergeObjects: [
                                                    "$$item",
                                                    {
                                                        quantity: {
                                                            $add: [
                                                                "$$item.quantity",
                                                                input.quantity,
                                                            ],
                                                        },
                                                        priceSnapshotCents: priceCents,
                                                        productNameSnapshot:
                                                            product.name,
                                                        variantId,
                                                        variantSnapshot,
                                                    },
                                                ],
                                            },
                                            "$$item",
                                        ],
                                    },
                                },
                            },
                            {
                                $concatArrays: [
                                    "$items",
                                    [
                                        {
                                            productId: product._id,
                                            variantId,
                                            quantity: input.quantity,
                                            priceSnapshotCents: priceCents,
                                            productNameSnapshot: product.name,
                                            variantSnapshot,
                                        },
                                    ],
                                ],
                            },
                        ],
                    },
                },
            },
        ],
        { new: true },
    );

    if (!cart) {
        throw new AppError(409, "Stock insuficiente para a quantidade pedida");
    }

    return toCartResponse(cart);
}

/**
 * Atualiza quantidade de um item ja presente no carrinho.
 *
 * @async
 * @function updateCartItemQuantity
 * @param {string} userId - ID autenticado.
 * @param {string} productId - Produto a atualizar.
 * @param {number} quantity - Nova quantidade.
 * @returns {Promise<object>} Carrinho atualizado.
 * @throws {AppError} Quando o carrinho ou o produto nao existem no carrinho.
 */
export async function updateCartItemQuantity(
    userId,
    productId,
    quantity,
    variantId = null,
) {
    const resolved = await findPurchasableProduct(
        productId,
        quantity,
        variantId,
    );
    const { product, variant, priceCents } = resolved;
    const normalizedVariantId = variant?.variantId ?? null;
    const cart = await Cart.findOneAndUpdate(
        {
            userId,
            items: {
                $elemMatch: {
                    productId: product._id,
                    variantId: normalizedVariantId,
                },
            },
        },
        {
            $set: {
                "items.$.quantity": quantity,
                "items.$.priceSnapshotCents": priceCents,
                "items.$.productNameSnapshot": product.name,
                "items.$.variantId": normalizedVariantId,
                "items.$.variantSnapshot": buildVariantSnapshot(variant),
            },
        },
        { new: true, runValidators: true },
    );

    if (!cart) {
        throw new AppError(404, "Produto nao encontrado no carrinho");
    }

    return toCartResponse(cart);
}

/**
 * Remove item do carrinho autenticado.
 *
 * @async
 * @function removeCartItem
 * @param {string} userId - ID autenticado.
 * @param {string} productId - Produto a remover.
 * @returns {Promise<object>} Carrinho atualizado.
 */
export async function removeCartItem(userId, productId, variantId = null) {
    const cart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId, variantId } } },
        { new: true, runValidators: true },
    );

    if (!cart) {
        return toCartResponse(null);
    }

    return toCartResponse(cart);
}

/**
 * Limpa o carrinho depois de criar encomenda.
 *
 * @async
 * @function clearCart
 * @param {string} userId - ID autenticado.
 * @returns {Promise<void>}
 */
export async function clearCart(userId) {
    await Cart.deleteOne({ userId });
}
