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

export const Review = model("Review", reviewSchema);