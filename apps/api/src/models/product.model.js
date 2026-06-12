/**
 * Modelo de produto da Orélle.
 *
 * O BK-MF0-07 cria o catalogo administravel. O BK-MF0-08 acrescenta
 * `categoryIds` para permitir associar categorias aos produtos.
 */
import mongoose from "mongoose";
import { SKIN_TYPES } from "./profile.model.js";

const { Schema, model } = mongoose;

/**
 * Schema MongoDB do produto.
 *
 * Os nomes dos campos seguem o contrato dos BKs: nome, descricao,
 * ingredientes, tipo de pele indicado, imagem, preco e stock.
 */
const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        brandName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        ingredientNames: {
            type: [String],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Produto deve ter pelo menos um ingrediente",
            },
        },
        skinTypes: {
            type: [String],
            required: true,
            enum: SKIN_TYPES,
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        priceCents: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        categoryIds: {
            type: [Schema.Types.ObjectId],
            ref: "Category",
            default: [],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

// Indice textual preparado para o BK-MF1-01 reutilizar na pesquisa.
productSchema.index({ name: "text", brandName: "text", description: "text" });

/**
 * Modelo Mongoose de produtos.
 *
 * @type {import("mongoose").Model}
 */
export const Product = model("Product", productSchema);
