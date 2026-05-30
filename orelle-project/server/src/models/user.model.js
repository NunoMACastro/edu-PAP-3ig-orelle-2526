import mongoose from "mongoose";

const { Schema, model } = mongoose;

const USER_ROLES = ["cliente", "consultor", "administrador"];

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: USER_ROLES,
            default: "cliente",
        },
    },
    {
        timestamps: true,
    },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model("User", userSchema);