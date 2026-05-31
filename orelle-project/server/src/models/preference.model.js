import mongoose from "mongoose";

const { Schema, model } = mongoose;

const preferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        favoriteBrandNames: {
            type: [String],
            default: [],
        },
        favoriteProductIds: {
            type: [Schema.Types.ObjectId],
            ref: "Product",
            default: [],
        },
    },
    { timestamps: true },
);

export const Preference = model("Preference", preferenceSchema);