import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Define um item guardado no carrinho de um cliente.
 * O preço e o nome ficam como snapshot para a UI, mas o checkout volta a validar o produto.
 */
const cartItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
        priceSnapshotCents: { type: Number, required: true, min: 0 },
        productNameSnapshot: { type: String, required: true },
    },
    { _id: false },
);

/**
 * Guarda o carrinho ativo de um utilizador autenticado.
 * O índice único em userId impede a criação de vários carrinhos ativos para a mesma conta.
 */
const cartSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
        items: { type: [cartItemSchema], default: [] },
    },
    { timestamps: true },
);

/**
 * Modelo MongoDB usado para consultar e persistir carrinhos.
 */
export const Cart = model("Cart", cartSchema);