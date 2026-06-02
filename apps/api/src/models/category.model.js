/**
 * Modelo de categorias do catalogo.
 *
 * Implementa o RF08 no BK-MF0-08, permitindo categorias como limpeza,
 * maquilhagem, tratamento e protetor solar.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Schema MongoDB da categoria.
 *
 * `slug` e unico para manter um identificador estavel e reutilizavel em filtros
 * e URLs futuras.
 */
const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 300,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de categorias.
 *
 * @type {import("mongoose").Model}
 */
export const Category = model("Category", categorySchema);
