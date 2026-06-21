/**
 * Service de encomendas, historico e checkout.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Cart } from "../models/cart.model.js";
import { Order, ORDER_STATUS } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { createOrderStatusNotification } from "./notification.service.js";
import { clearCart } from "./cart.service.js";
import {
    assertPaymentGatewayReady,
    createPaymentSession,
} from "../providers/payment.provider.js";

/**
 * Atualiza o estado logístico de uma encomenda e emite notificação interna.
 *
 * @async
 * @function updateOrderStatusAndNotify
 * @param {string} orderId - ID da encomenda.
 * @param {string} nextStatus - Estado permitido em `ORDER_STATUS`.
 * @returns {Promise<object>} DTO da encomenda atualizada.
 * @throws {AppError} Quando o estado é inválido ou a encomenda não existe.
 */
export async function updateOrderStatusAndNotify(orderId, nextStatus) {
    const allowedStatuses = Object.values(ORDER_STATUS);

    if (!allowedStatuses.includes(nextStatus)) {
        throw new AppError(400, "Estado de encomenda invalido");
    }

    // Procuramos a encomenda real para usar o estado e o dono guardados no backend.
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(404, "Encomenda nao encontrada");
    }

    if (order.status === nextStatus) {
        return toOrderResponse(order);
    }

    order.status = nextStatus;
    await order.save();
    // A notificação é uma consequência da alteração persistida.
    await createOrderStatusNotification(order._id);

    return toOrderResponse(order);
}
/**
 * Converte encomenda para DTO publico.
 *
 * @function toOrderResponse
 * @param {object} order - Documento Mongoose ou mock equivalente.
 * @returns {object} Encomenda sem userId nem detalhes internos.
 */
export function toOrderResponse(order) {
    return {
        id: order._id.toString(),
        items: order.items.map((item) => ({
            productId: item.productId.toString(),
            name: item.name,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents,
        })),
        totalCents: order.totalCents,
        status: order.status,
        payment: {
            gateway: order.payment.gateway,
            status: order.payment.status,
            providerReference: order.payment.providerReference,
            checkoutUrl: order.payment.checkoutUrl,
            message: order.payment.message,
        },
        stockReserved: order.stockReserved,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

/**
 * Rele produtos atuais e constroi linhas de encomenda seguras.
 *
 * @async
 * @function buildOrderItemsFromCart
 * @param {Array<object>} cartItems - Itens do carrinho.
 * @returns {Promise<Array<object>>} Itens revalidados.
 * @throws {AppError} Quando produto falta ou stock nao chega.
 */
async function buildOrderItemsFromCart(cartItems) {
    const productIds = cartItems.map((item) => item.productId.toString());
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    return cartItems.map((item) => {
        const productId = item.productId.toString();
        const product = productsById.get(productId);

        if (!product) {
            throw new AppError(404, "Produto do carrinho nao encontrado");
        }

        if (product.stock < item.quantity) {
            throw new AppError(
                409,
                `Stock insuficiente para ${product.name}`,
            );
        }

        return {
            productId: product._id,
            name: product.name,
            unitPriceCents: product.priceCents,
            quantity: item.quantity,
            lineTotalCents: product.priceCents * item.quantity,
        };
    });
}

/**
 * Cria encomenda a partir do carrinho autenticado e inicia pagamento.
 *
 * @async
 * @function checkoutMyCart
 * @param {string} userId - ID autenticado.
 * @param {{gateway: string}} input - Gateway validado.
 * @returns {Promise<object>} Encomenda criada.
 */
export async function checkoutMyCart(userId, input) {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        throw new AppError(400, "Carrinho vazio");
    }

    assertPaymentGatewayReady(input.gateway);

    const items = await buildOrderItemsFromCart(cart.items);
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

    let order = await Order.create({
        userId,
        items,
        totalCents,
        status: ORDER_STATUS.PENDENTE,
        payment: {
            gateway: input.gateway,
            status: "requires_payment",
            providerReference: null,
            checkoutUrl: null,
            message: "Pagamento ainda nao iniciado.",
        },
        stockReserved: false,
    });

    const payment = await createPaymentSession(order, input.gateway);
    order.payment = payment;
    await order.save();
    await clearCart(userId);

    return toOrderResponse(order);
}

/**
 * Lista historico de compras do cliente autenticado.
 *
 * @async
 * @function listMyOrders
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object[]>} Encomendas ordenadas por data.
 */
export async function listMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders.map(toOrderResponse);
}
