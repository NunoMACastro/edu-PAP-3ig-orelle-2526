import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { clearCart, getMyCart } from "./cart.service.js";
import { createPaymentSession } from "../providers/payment.provider.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Constrói as linhas da encomenda a partir do carrinho validando produtos atuais.
 * @param {Array<{ productId: string, quantity: number }>} cartItems - Itens do carrinho autenticado.
 * @returns {Promise<Array<object>>} Itens prontos para gravar na encomenda.
 * @throws {AppError} Quando um produto está inativo ou sem stock suficiente.
 */
async function buildOrderItems(cartItems) {
    const items = [];

    for (const item of cartItems) {
        // Preço e stock são lidos da base de dados para impedir manipulação no frontend.
        const product = await Product.findById(item.productId).select("name priceCents stock isActive");
        if (!product || product.isActive === false) {
            throw new AppError(404, `Produto ${item.productId} não está disponível`);
        }
        if (product.stock < item.quantity) {
            throw new AppError(409, `Stock insuficiente para ${product.name}`);
        }

        items.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents * item.quantity,
        });
    }

    return items;
}

/**
 * Converte uma encomenda num DTO seguro para a API.
 * @param {object} order - Documento Order persistido.
 * @returns {{ id: string, items: Array<object>, totalCents: number, orderStatus: string, payment: object, createdAt: Date }}
 */
function serializeOrder(order) {
    return {
        id: order._id.toString(),
        items: order.items,
        totalCents: order.totalCents,
        orderStatus: order.orderStatus,
        payment: order.payment,
        createdAt: order.createdAt,
    };
}

/**
 * Cria uma encomenda a partir do carrinho do cliente e inicia o pagamento.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @param {{ paymentMethod: "stripe" | "paypal" | "mbway" }} payload - Método escolhido.
 * @returns {Promise<object>} Encomenda criada com dados de pagamento.
 * @throws {AppError} Quando o carrinho está vazio, há stock insuficiente ou o provider falha.
 */
export async function checkoutMyCart(userId, { paymentMethod }) {
    const cart = await getMyCart(userId);

    if (cart.items.length === 0) {
        throw new AppError(400, "Carrinho vazio");
    }

    const items = await buildOrderItems(cart.items);
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

    // A encomenda nasce do carrinho validado; o cliente não envia total nem lista de produtos.
    const order = new Order({
        userId,
        items,
        totalCents,
        payment: {
            method: paymentMethod,
            status: "requires_payment",
        },
    });

    const payment = await createPaymentSession({ method: paymentMethod, order });
    order.payment = payment;
    await order.save();
    // O carrinho só é limpo depois de a encomenda estar gravada.
    await clearCart(userId);

    return serializeOrder(order);
}

/**
 * Lista as encomendas do cliente autenticado para histórico pessoal.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @returns {Promise<Array<object>>} Encomendas ordenadas da mais recente para a mais antiga.
 */
export async function listMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return orders.map(serializeOrder);
}