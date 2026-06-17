/**
 * Modelo de avaliacoes de produto da MF1.
 *
 * Cada cliente pode publicar uma unica avaliacao por produto. A moderacao fica
 * fora desta macrofase, mas o estado prepara o BK administrativo futuro.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 600,
        },
        status: {
            type: String,
            enum: ["published", "hidden"],
            default: "published",
        },
    },
    { timestamps: true },
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

/**
 * Modelo Mongoose de reviews.
 *
 * @type {import("mongoose").Model}
 */
export const Review = model("Review", reviewSchema);

// apps/api/src/models/review.model.js
const reviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 600,
        },
        status: {
            type: String,
            enum: ["published", "hidden"],
            default: "published",
            index: true,
        },
        // A moderação não apaga nem reescreve o comentário.
        // Guarda apenas o motivo administrativo para justificar a decisão.
        moderationReason: {
            type: String,
            trim: true,
            maxlength: 240,
            default: "",
        },
        // Estes campos permitem responder às perguntas "quem moderou?" e
        // "quando moderou?", sem misturar essa informação com o texto do cliente.
        moderatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        moderatedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);
