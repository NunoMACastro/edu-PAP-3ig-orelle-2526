import mongoose from "mongoose";

const { Schema, model } = mongoose;

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
    },
    { timestamps: true },
);

export const Category = model("Category", categorySchema);