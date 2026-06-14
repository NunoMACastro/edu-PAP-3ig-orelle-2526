import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Representa uma linha imutável da encomenda.
 * O preço fica gravado para preservar o histórico mesmo que o produto mude depois.
 */
const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceCents: { type: Number, required: true, min: 0 },
        lineTotalCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

/**
 * Representa o estado de pagamento associado à encomenda.
 * `payment.status` é separado de `orderStatus` para não confundir logística com cobrança.
 */
const paymentSchema = new Schema(
    {
        method: { type: String, enum: ["stripe", "paypal", "mbway"], required: true },
        status: {
            type: String,
            enum: ["requires_payment", "pending_manual_confirmation", "paid", "failed"],
            required: true,
        },
        providerReference: { type: String, default: null },
        checkoutUrl: { type: String, default: null },
    },
    { _id: false },
);

/**
 * Guarda uma encomenda criada a partir do carrinho de um cliente.
 * O campo stockReserved permite reduzir stock uma única vez num BK posterior.
 */
const orderSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        items: { type: [orderItemSchema], required: true },
        totalCents: { type: Number, required: true, min: 1 },
        orderStatus: {
            type: String,
            enum: ["pendente", "enviado", "entregue", "cancelado"],
            default: "pendente",
            index: true,
        },
        payment: { type: paymentSchema, required: true },
        stockReserved: { type: Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Modelo MongoDB usado para encomendas, histórico e estatísticas comerciais.
 */
export const Order = model("Order", orderSchema);