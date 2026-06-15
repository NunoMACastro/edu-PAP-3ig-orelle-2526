import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { addItemToCart, getMyCart } from "./cart.service.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Recria no carrinho os produtos disponíveis de uma encomenda antiga do cliente.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @param {string} orderId - ID da encomenda a recomprar.
 * @returns {Promise<{ cart: object, skipped: Array<{ productId: string, reason: string }> }>}
 * @throws {AppError} Quando a encomenda não pertence ao cliente ou não existe.
 */
export async function reorderFromOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId }).select("items");

    if (!order) {
        throw new AppError(404, "Encomenda não encontrada");
    }

    const skipped = [];

    for (const item of order.items) {
        // A recompra usa o catálogo atual: preço e disponibilidade podem ter mudado.
        const product = await Product.findById(item.productId).select("name stock isActive");
        if (!product || product.isActive === false) {
            skipped.push({ productId: item.productId.toString(), reason: "Produto indisponível" });
            continue;
        }
        if (product.stock < item.quantity) {
            skipped.push({ productId: item.productId.toString(), reason: "Stock insuficiente" });
            continue;
        }

        await addItemToCart(userId, {
            productId: item.productId.toString(),
            quantity: item.quantity,
        });
    }

    const cart = await getMyCart(userId);
    return { cart, skipped };
}