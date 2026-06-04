import mongoose from "mongoose";
import { SKIN_TYPES } from "./profile.model.js";

const { Schema, model } = mongoose;

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

productSchema.index({ name: "text", brandName: "text", description: "text" });

export const Product = model("Product", productSchema);