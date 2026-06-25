import mongoose from "mongoose";
import { DATA_ENCRYPTION_ALGORITHM } from "../services/encryption.service.js";

const { Schema, model } = mongoose;

const encryptionMetadataSchema = new Schema(
    {
        algorithm: {
            type: String,
            enum: [DATA_ENCRYPTION_ALGORITHM],
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        authTag: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const facePhotoSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        kind: {
            type: String,
            enum: ["frontal", "perfil"],
            required: true,
        },
        storageKey: {
            type: String,
            required: true,
            // O path privado nunca entra em respostas públicas; só services internos
            // o selecionam explicitamente quando precisam de ler ou apagar o ficheiro.
            select: false,
        },
        encryption: {
            type: encryptionMetadataSchema,
            required: true,
            // IV e auth tag são necessários para decifrar, mas seriam dados
            // sensíveis demais para seguir no DTO enviado ao frontend.
            select: false,
        },
        originalName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        sizeBytes: {
            type: Number,
            required: true,
            min: 1,
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "deleted", "anonymized"],
            // O estado `anonymized` vem de BK-MF5-01 e prepara a eliminação
            // seletiva sem quebrar histórico, auditoria ou evidência legal.
            default: "active",
        },
    },
    { timestamps: true },
);

facePhotoSchema.index({ userId: 1, kind: 1, createdAt: -1 });

/**
 * Modelo Mongoose de fotografias faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FacePhoto = model("FacePhoto", facePhotoSchema);