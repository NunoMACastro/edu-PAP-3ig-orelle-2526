/**
 * Service de gestao de stock da MF3.
 */
import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import {
    buildProductVariantKey,
    resolveProductVariant,
    resolveVariantStock,
} from "./product-variant.service.js";

const LOW_STOCK_THRESHOLD = 5;

/**
 * Converte produto para DTO de stock.
 *
 * @function toStockProductResponse
 * @param {object} product - Produto Mongoose ou mock equivalente.
 * @returns {object} Produto minimizado para stock.
 */
function toStockProductResponse(product) {
    return {
        productId: product._id.toString(),
        name: product.name,
        priceCents: product.priceCents,
        stock: product.stock,
        variants: (product.variants ?? []).map((variant) => ({
            variantId: variant.variantId,
            label: variant.label,
            stock: variant.stock,
        })),
        threshold: LOW_STOCK_THRESHOLD,
    };
}

/**
 * Lista produtos com stock abaixo do limite canonico de RF32.
 *
 * @async
 * @function listLowStockProducts
 * @returns {Promise<object[]>} Produtos com stock inferior a 5.
 */
export async function listLowStockProducts() {
    const products = await Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } })
        .select("name priceCents stock")
        .sort({ stock: 1, name: 1 });

    return products.map(toStockProductResponse);
}

/**
 * Ajusta manualmente o stock de um produto.
 *
 * @async
 * @function setProductStock
 * @param {string} productId - Produto a atualizar.
 * @param {number} stock - Novo stock.
 * @returns {Promise<object>} Produto atualizado.
 * @throws {AppError} Quando produto nao existe.
 */
export async function setProductStock(productId, stock, variantId = null) {
    let product;
    if (!variantId) {
        product = await Product.findByIdAndUpdate(
            productId,
            [
                {
                    $set: {
                        stock: {
                            $cond: [
                                {
                                    $eq: [
                                        { $size: { $ifNull: ["$variants", []] } },
                                        0,
                                    ],
                                },
                                stock,
                                "$stock",
                            ],
                        },
                    },
                },
            ],
            { new: true },
        ).select("name priceCents stock variants");
        if (
            product &&
            (product.variants?.length ?? 0) > 0 &&
            product.stock !== stock
        ) {
            throw new AppError(
                400,
                "Produtos com variantes exigem variantId no ajuste de stock",
            );
        }
    } else {
        let current = await Product.findById(productId).select(
            "name priceCents stock variants",
        );
        if (!current) throw new AppError(404, "Produto nao encontrado");

        for (let attempt = 0; attempt < 3 && !product; attempt += 1) {
            const variant = current.variants.find(
                (candidate) => candidate.variantId === variantId,
            );
            if (!variant) throw new AppError(404, "Variante não encontrada");

            product = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    variants: {
                        $elemMatch: { variantId, stock: variant.stock },
                    },
                },
                {
                    $set: { "variants.$.stock": stock },
                    $inc: { stock: stock - variant.stock },
                },
                { new: true, runValidators: true },
            ).select("name priceCents stock variants");

            if (!product) {
                current = await Product.findById(productId).select(
                    "name priceCents stock variants",
                );
                if (!current) throw new AppError(404, "Produto nao encontrado");
            }
        }
    }

    if (!product) {
        throw new AppError(409, "Stock alterado concorrentemente; tenta novamente");
    }

    return toStockProductResponse(product);
}

/**
 * Agrupa linhas de encomenda por produto para reduzir cada stock uma unica vez.
 *
 * @function groupOrderItemsByProduct
 * @param {Array<object>} items - Linhas da encomenda.
 * @returns {Array<{productId: object, name: string, quantity: number}>} Linhas agrupadas.
 */
function groupOrderItemsByProduct(items) {
    const quantitiesByProduct = new Map();

    for (const item of items) {
        const productKey = buildProductVariantKey(
            item.productId,
            item.variantId,
        );
        const current = quantitiesByProduct.get(productKey) ?? {
            productId: item.productId,
            variantId: item.variantId ?? null,
            name: item.name,
            quantity: 0,
        };

        current.quantity += item.quantity;
        quantitiesByProduct.set(productKey, current);
    }

    return Array.from(quantitiesByProduct.values());
}

/**
 * Confirma que todos os produtos agrupados ainda têm stock suficiente.
 *
 * @async
 * @function assertEnoughStockForGroupedItems
 * @param {Array<{productId: object, name: string, quantity: number}>} items - Itens agrupados.
 * @param {import("mongoose").ClientSession} session - Sessao da transacao.
 * @returns {Promise<void>}
 * @throws {AppError} Quando algum produto nao existe ou nao tem stock.
 */
async function assertEnoughStockForGroupedItems(items, session) {
    const products = await Product.find({
        _id: { $in: items.map((item) => item.productId) },
    })
        .select("name stock")
        .session(session);
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    for (const item of items) {
        const product = productsById.get(item.productId.toString());

        let availableStock = product?.stock ?? 0;
        if (product && item.variantId) {
            const variant = resolveProductVariant(product, item.variantId);
            availableStock = resolveVariantStock(product, variant);
        }

        if (!product || availableStock < item.quantity) {
            throw new AppError(
                409,
                `Stock insuficiente para ${item.name}`,
            );
        }
    }
}

/**
 * Reduz stock uma unica vez para uma encomenda com pagamento confirmado.
 *
 * @async
 * @function applyOrderStockUpdate
 * @param {string} orderId - Encomenda confirmada.
 * @returns {Promise<{orderId: string, stockReserved: boolean, alreadyApplied: boolean}>} Resultado.
 * @throws {AppError} Quando a encomenda nao existe, nao esta paga ou stock nao chega.
 */
export async function applyOrderStockUpdate(orderId) {
    const session = await mongoose.startSession();

    try {
        let response = null;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new AppError(404, "Encomenda nao encontrada");
            }

            if (order.payment.status !== PAYMENT_STATUS.SIMULATED_PAID) {
                throw new AppError(
                    409,
                    "Stock só pode ser atualizado após pagamento simulado concluído",
                );
            }

            if (order.stockReserved) {
                response = {
                    orderId: order._id.toString(),
                    stockReserved: true,
                    alreadyApplied: true,
                };
                return;
            }

            const groupedItems = groupOrderItemsByProduct(order.items);

            // A pre-validacao dentro da transacao impede reducoes parciais.
            await assertEnoughStockForGroupedItems(groupedItems, session);

            for (const item of groupedItems) {
                const result = item.variantId
                    ? await Product.updateOne(
                          {
                              _id: item.productId,
                              stock: { $gte: item.quantity },
                              variants: {
                                  $elemMatch: {
                                      variantId: item.variantId,
                                      stock: { $gte: item.quantity },
                                  },
                              },
                          },
                          {
                              $inc: {
                                  stock: -item.quantity,
                                  "variants.$.stock": -item.quantity,
                              },
                          },
                          { session },
                      )
                    : await Product.updateOne(
                          {
                              _id: item.productId,
                              stock: { $gte: item.quantity },
                          },
                          { $inc: { stock: -item.quantity } },
                          { session },
                      );

                if (result.modifiedCount !== 1) {
                    throw new AppError(
                        409,
                        `Stock insuficiente para ${item.name}`,
                    );
                }
            }

            order.stockReserved = true;
            await order.save({ session });

            response = {
                orderId: order._id.toString(),
                stockReserved: true,
                alreadyApplied: false,
            };
        });

        return response;
    } finally {
        await session.endSession();
    }
}
