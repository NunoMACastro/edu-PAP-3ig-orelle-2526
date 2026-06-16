/**
 * Modelo de utilizador da MF0.
 *
 * Criado no BK-MF0-01 para registo com email/password e estendido no
 * BK-MF0-05 para suportar as roles `cliente`, `consultor` e `administrador`.
 */
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../constants/roles.js";

const { Schema, model } = mongoose;

export const ACCOUNT_STATUSES = Object.freeze({
    ACTIVE: "active",
    SUSPENDED: "suspended",
    DELETED: "deleted",
});

export const ACCOUNT_STATUS_VALUES = Object.freeze(
    Object.values(ACCOUNT_STATUSES),
);

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
        isActive: {
            type: Boolean,
            default: true,
        },
        // `accountStatus` é a decisão administrativa principal.
        // `isActive` fica por compatibilidade com BKs anteriores, mas o novo
        // código deve olhar para `accountStatus` para distinguir suspensão de eliminação lógica.
        accountStatus: {
            type: String,
            enum: ACCOUNT_STATUS_VALUES,
            default: ACCOUNT_STATUSES.ACTIVE,
            index: true,
        },
        // Estas datas não autorizam nem bloqueiam por si só.
        // Elas servem como evidência para defesa, suporte e auditoria interna.
        suspendedAt: {
            type: Date,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

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
        isActive: {
            type: Boolean,
            default: true,
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
