/**
 * Modelo de carrinho de compras da MF3.
 *
 * O carrinho pertence a um utilizador autenticado e guarda snapshots de nome e
 * preco para a UI. O checkout volta sempre a validar produto, preco e stock no
 * backend antes de criar uma encomenda.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const cartItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
        priceSnapshotCents: { type: Number, required: true, min: 0 },
        productNameSnapshot: { type: String, required: true },
    },
    { _id: false },
);

const cartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de carrinhos.
 *
 * @type {import("mongoose").Model}
 */
export const Cart = model("Cart", cartSchema);
