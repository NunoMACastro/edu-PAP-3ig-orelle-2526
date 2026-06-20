/**
 * Modelo de avaliacoes de produto da MF1.
 *
 * Cada cliente pode publicar uma unica avaliacao por produto. A moderacao fica
 * fora desta macrofase, mas o estado prepara o BK administrativo futuro.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const REVIEW_STATUSES = Object.freeze({
    PUBLISHED: "published",
    HIDDEN: "hidden",
});

export const REVIEW_STATUS_VALUES = Object.freeze(Object.values(REVIEW_STATUSES));

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
            enum: REVIEW_STATUS_VALUES,
            default: REVIEW_STATUSES.PUBLISHED,
        },
        moderationReason: {
            type: String,
            default: null,
            trim: true,
            maxlength: 300,
        },
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

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

/**
 * Modelo Mongoose de reviews.
 *
 * @type {import("mongoose").Model}
 */
export const Review = model("Review", reviewSchema);
