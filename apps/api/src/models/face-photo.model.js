/**
 * Modelo de metadados de fotografias faciais da MF1.
 *
 * O ficheiro fica em storage privado. A API guarda e devolve apenas metadados
 * seguros; `storageKey` tem `select: false` para reduzir risco de fuga.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

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
