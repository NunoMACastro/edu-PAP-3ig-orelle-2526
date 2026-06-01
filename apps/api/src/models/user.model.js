/**
 * Modelo de utilizador da MF0.
 *
 * Criado no BK-MF0-01 para registo com email/password e estendido no
 * BK-MF0-05 para suportar as roles `cliente`, `consultor` e `administrador`.
 */
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../constants/roles.js";

const { Schema, model } = mongoose;

/**
 * Schema MongoDB do utilizador.
 *
 * `passwordHash` fica com `select: false` para impedir que hashes sejam
 * devolvidos por queries normais. Quando o login precisa comparar a password,
 * o service pede explicitamente `+passwordHash`.
 */
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
            enum: ROLE_VALUES,
            default: ROLES.CLIENTE,
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de utilizadores.
 *
 * @type {import("mongoose").Model}
 */
export const User = model("User", userSchema);
