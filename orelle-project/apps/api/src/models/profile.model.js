import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];
export const GENDERS = [
    "feminino",
    "masculino",
    "nao_binario",
    "prefiro_nao_dizer",
];

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
            default: ''
        },
        profilePhotoMode: {
            type: String,
            enum: ['stub_url', 'secure_upload'],
            default: 'stub_url'
        },
        profilePhotoUpdatedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true },
);

export const Profile = model("Profile", profileSchema);