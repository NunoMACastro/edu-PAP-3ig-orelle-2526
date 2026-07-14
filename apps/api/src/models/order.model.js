/**
 * Modelo de encomendas e pagamento da MF3.
 *
 * A encomenda e criada a partir do carrinho autenticado. O preco e o stock sao
 * sempre revalidados no backend antes da criacao. O pagamento fica separado do
 * estado logistico da encomenda e a `checkoutKey` evita duplicar encomendas
 * quando o mesmo checkout e repetido por retry ou duplo clique.
 */
import mongoose from "mongoose";
import {
    ORDER_STATUS,
    PAYMENT_MODE,
    PAYMENT_STATUS,
} from "../constants/domain.constants.js";

const { Schema, model } = mongoose;

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
        variantId: { type: String, default: null, trim: true, maxlength: 64 },
        name: { type: String, required: true },
        variantSnapshot: {
            variantId: { type: String, default: null },
            label: { type: String, default: null },
            colorHex: { type: String, default: null },
            undertone: { type: String, default: null },
            finish: { type: String, default: null },
            coverage: { type: String, default: null },
            imageUrl: { type: String, default: null },
        },
        unitPriceCents: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        lineTotalCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

const paymentSchema = new Schema(
    {
        mode: {
            type: String,
            enum: Object.values(PAYMENT_MODE),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            required: true,
        },
        simulationReference: {
            type: String,
            default: null,
        },
        simulatedAt: {
            type: Date,
            default: null,
        },
        idempotencyKeyHash: {
            type: String,
            default: null,
            select: false,
        },
        message: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

/**
 * Registo interno e imutável de uma tentativa de simulação.
 *
 * O snapshot permite devolver exatamente a mesma resposta quando uma
 * `Idempotency-Key` é repetida, mesmo que uma tentativa posterior tenha
 * alterado o estado atual da encomenda. Todo o array fica excluído das queries
 * normais e nunca faz parte do DTO público.
 */
const paymentAttemptSchema = new Schema(
    {
        idempotencyKeyHash: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: [
                PAYMENT_STATUS.SIMULATED_PAID,
                PAYMENT_STATUS.SIMULATED_FAILED,
            ],
            required: true,
        },
        simulationReference: {
            type: String,
            required: true,
        },
        simulatedAt: {
            type: Date,
            required: true,
        },
        responseSnapshot: {
            type: Schema.Types.Mixed,
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
            default: null,
            required() {
                return !this.ownerErasedAt;
            },
            index: true,
        },
        ownerErasedAt: {
            type: Date,
            default: null,
            index: true,
        },
        checkoutKey: {
            type: String,
            required: true,
            trim: true,
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
        subtotalCents: {
            type: Number,
            required: true,
            min: 0,
        },
        discountCents: {
            type: Number,
            default: 0,
            min: 0,
        },
        voucher: {
            voucherId: {
                type: Schema.Types.ObjectId,
                ref: "Voucher",
                default: null,
            },
            code: {
                type: String,
                default: null,
                trim: true,
            },
            amountCents: {
                type: Number,
                default: 0,
                min: 0,
            },
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
        paymentAttempts: {
            type: [paymentAttemptSchema],
            default: [],
            select: false,
        },
        stockReserved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index(
    { "payment.simulationReference": 1 },
    {
        unique: true,
        partialFilterExpression: {
            "payment.simulationReference": { $type: "string" },
        },
    },
);
// A combinacao userId + checkoutKey e a barreira minima contra encomendas
// duplicadas na mesma tentativa de checkout.
orderSchema.index({ userId: 1, checkoutKey: 1 }, { unique: true });

/**
 * Modelo Mongoose de encomendas.
 *
 * @type {import("mongoose").Model}
 */
export const Order = model("Order", orderSchema);
