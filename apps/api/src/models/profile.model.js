/**
 * Modelo de perfil personalizado da Orélle.
 *
 * O BK-MF0-03 cria os dados de perfil exigidos pelo RF03. O BK-MF0-04 acrescenta
 * campos de fotografia em modo controlado, sem upload biometrico real.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Tipos de pele permitidos nos perfis e produtos.
 *
 * @readonly
 * @type {readonly string[]}
 */
export const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];

/**
 * Generos permitidos no perfil.
 *
 * @readonly
 * @type {readonly string[]}
 */
export const GENDERS = [
    "feminino",
    "masculino",
    "nao_binario",
    "prefiro_nao_dizer",
];

/**
 * Schema MongoDB do perfil.
 *
 * O `userId` e unico para garantir que cada utilizador tem no maximo um perfil
 * nesta fase. A fotografia fica apenas como URL controlado porque o BK-MF0-04
 * bloqueia upload real enquanto nao existir consentimento e storage seguro.
 */
const profileSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        nome: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        idade: {
            type: Number,
            required: true,
            min: 13,
            max: 120,
        },
        tipoDePele: {
            type: String,
            required: true,
            enum: SKIN_TYPES,
        },
        genero: {
            type: String,
            required: true,
            enum: GENDERS,
        },
        objetivos: {
            type: [String],
            default: [],
        },
        profilePhotoUrl: {
            type: String,
            default: "",
        },
        profilePhotoMode: {
            type: String,
            enum: ["stub_url", "secure_upload"],
            default: "stub_url",
        },
        profilePhotoUpdatedAt: {
            type: Date,
            default: null,
        },
        allergies: {
            type: [String],
            default: [],
        },
        avoidIngredients: {
            type: [String],
            default: [],
        },
        lightMedicalRestrictions: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de perfis.
 *
 * @type {import("mongoose").Model}
 */
export const Profile = model("Profile", profileSchema);
