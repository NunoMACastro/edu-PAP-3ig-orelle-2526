/**
 * Modelo de encomendas e pagamento da MF3.
 *
 * A encomenda e criada a partir do carrinho autenticado. O preco e o stock sao
 * sempre revalidados no backend antes da criacao. O pagamento fica separado do
 * estado logistico da encomenda para permitir Stripe controlado e stubs honestos
 * de PayPal/MBWay sem fingir pagamento concluido.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const ORDER_STATUS = Object.freeze({
    PENDENTE: "pendente",
    ENVIADO: "enviado",
    ENTREGUE: "entregue",
});

export const PAYMENT_GATEWAYS = Object.freeze({
    STRIPE: "stripe",
    PAYPAL: "paypal",
    MBWAY: "mbway",
});

export const PAYMENT_STATUS = Object.freeze({
    REQUIRES_PAYMENT: "requires_payment",
    PENDING_MANUAL_CONFIRMATION: "pending_manual_confirmation",
    PAID: "paid",
    FAILED: "failed",
});

/**
 * Confirma que a encomenda contém pelo menos um item.
 *
 * @function hasAtLeastOneOrderItem
 * @param {unknown} items - Valor recebido pelo validador Mongoose.
 * @returns {boolean} True quando o valor é um array não vazio.
 */
function hasAtLeastOneOrderItem(items) {
    return Array.isArray(items) && items.length > 0;
}

const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        unitPriceCents: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        lineTotalCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

const paymentSchema = new Schema(
    {
        gateway: {
            type: String,
            enum: Object.values(PAYMENT_GATEWAYS),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            required: true,
        },
        providerReference: {
            type: String,
            default: null,
        },
        checkoutUrl: {
            type: String,
            default: null,
        },
        message: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const orderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: hasAtLeastOneOrderItem,
                message: "Encomenda precisa de pelo menos um produto",
            },
        },
        totalCents: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDENTE,
        },
        payment: {
            type: paymentSchema,
            required: true,
        },
        stockReserved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });

/**
 * Modelo Mongoose de encomendas.
 *
 * @type {import("mongoose").Model}
 */
export const Order = model("Order", orderSchema);
