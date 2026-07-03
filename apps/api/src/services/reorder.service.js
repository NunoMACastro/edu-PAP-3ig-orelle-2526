/**
 * Service de recompra a partir de encomendas anteriores.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { addItemToCart } from "./cart.service.js";

/**
 * Recompra produtos disponiveis de uma encomenda anterior, adicionando-os ao carrinho.
 *
 * @async
 * @function reorderFromOrder
 * @param {string} userId - ID autenticado.
 * @param {string} orderId - Encomenda original.
 * @returns {Promise<{cart: object, skipped: object[]}>} Carrinho atualizado e produtos ignorados.
 * @throws {AppError} Quando a encomenda nao pertence ao utilizador ou nenhum produto esta disponivel.
 */
export async function reorderFromOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
        throw new AppError(404, "Encomenda nao encontrada");
    }

    const skipped = [];
    let cart = null;

    for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product) {
            skipped.push({
                productId: item.productId.toString(),
                reason: "Produto ja nao existe",
            });
            continue;
        }

        if (product.stock < item.quantity) {
            skipped.push({
                productId: item.productId.toString(),
                reason: "Stock insuficiente",
            });
            continue;
        }

        cart = await addItemToCart(userId, {
            productId: product._id.toString(),
            quantity: item.quantity,
        });
    }

    if (!cart) {
        throw new AppError(
            409,
            "Nenhum produto da encomenda esta disponivel para recompra",
            { skipped },
        );
    }

    return { cart, skipped };
}
