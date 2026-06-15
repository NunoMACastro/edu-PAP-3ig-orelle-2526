// server/src/services/stock.service.js
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_ELIGIBLE_PAYMENT_STATUS = "paid";

/**
 * Lista produtos com stock abaixo do limite definido por RF32.
 * @returns {Promise<Array<{ productId: string, name: string, stock: number, priceCents: number, threshold: number }>>}
 */
export async function listLowStockProducts() {
    const products = await Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } })
        .select("name stock priceCents")
        .sort({ stock: 1, name: 1 });

    return products.map((product) => ({
        productId: product._id.toString(),
        name: product.name,
        stock: product.stock,
        priceCents: product.priceCents,
        threshold: LOW_STOCK_THRESHOLD,
    }));
}
/**
 * Define manualmente o stock de um produto.
 * @param {string} productId - ID do produto a atualizar.
 * @param {number} stock - Novo stock inteiro e não negativo.
 * @returns {Promise<{ productId: string, name: string, stock: number, priceCents: number }>}
 * @throws {AppError} Quando o stock é inválido ou o produto não existe.
 */
export async function setProductStock(productId, stock) {
    if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError(400, "Stock deve ser um número inteiro não negativo");
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { stock } },
        { new: true, runValidators: true },
    ).select("name stock priceCents");

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return {
        productId: product._id.toString(),
        name: product.name,
        stock: product.stock,
        priceCents: product.priceCents,
    };
}
/**
 * Reduz stock dos produtos de uma encomenda paga, uma única vez.
 * @param {string} orderId - ID da encomenda paga.
 * @returns {Promise<{ updated: boolean, reason?: string }>} Resultado da atualização.
 * @throws {AppError} Quando a encomenda não existe, não está paga ou não há stock suficiente.
 */
export async function applyOrderStockUpdate(orderId) {
    const session = await mongoose.startSession();

    try {
        let result = { updated: false };

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new AppError(404, "Encomenda não encontrada");
            }

            if (order.stockReserved) {
                result = { updated: false, reason: "Stock já atualizado para esta encomenda" };
                return;
            }

            if (order.payment?.status !== STOCK_ELIGIBLE_PAYMENT_STATUS) {
                throw new AppError(409, "Stock só pode ser atualizado depois de pagamento confirmado");
            }

            // Agrupar evita reduzir o mesmo produto em linhas separadas de forma inconsistente.
            const quantitiesByProduct = new Map();
            for (const item of order.items) {
                const productId = item.productId.toString();
                const current = quantitiesByProduct.get(productId) || {
                    productId: item.productId,
                    name: item.name,
                    quantity: 0,
                };
                current.quantity += item.quantity;
                quantitiesByProduct.set(productId, current);
            }

            const groupedItems = Array.from(quantitiesByProduct.values());
            const products = await Product.find({
                _id: { $in: groupedItems.map((item) => item.productId) },
            })
                .select("name stock")
                .session(session);
            const productsById = new Map(products.map((product) => [product._id.toString(), product]));

            // Preflight: se algum produto falhar, nenhum stock é reduzido.
            for (const item of groupedItems) {
                const product = productsById.get(item.productId.toString());
                if (!product || product.stock < item.quantity) {
                    throw new AppError(409, `Stock insuficiente para ${item.name}`);
                }
            }

            for (const item of groupedItems) {
                // A condição stock >= quantidade protege contra concorrência durante a transação.
                const updateResult = await Product.updateOne(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { session },
                );

                if (updateResult.modifiedCount !== 1) {
                    throw new AppError(409, `Stock insuficiente para ${item.name}`);
                }
            }

            order.stockReserved = true;
            await order.save({ session });
            result = { updated: true };
        });

        return result;
    } finally {
        await session.endSession();
    }
}