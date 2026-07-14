/**
 * Modelo de metadados de fotografias faciais da MF1.
 *
 * O ficheiro fica em storage privado. A API guarda e devolve apenas metadados
 * seguros; `storageKey` tem `select: false` para reduzir risco de fuga.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const encryptionMetadataSchema = new Schema(
    {
        algorithm: {
            type: String,
            required: true,
        },
        keyVersion: {
            type: Number,
            required: true,
            min: 2,
        },
        aadHash: {
            type: String,
            required: true,
        },
        iv: {
            type: String,
            required: true,
            select: false,
        },
        authTag: {
            type: String,
            required: true,
            select: false,
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
            select: false,
        },
        encryption: {
            type: encryptionMetadataSchema,
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
        quality: {
            profileVersion: { type: String, required: true, trim: true },
            status: {
                type: String,
                enum: ["pass", "warning", "fail"],
                required: true,
            },
            failures: { type: [String], default: () => [] },
            warnings: { type: [String], default: () => [] },
            metrics: {
                lumaMean: { type: Number, min: 0, max: 255, required: true },
                darkClippedRatio: { type: Number, min: 0, max: 1, required: true },
                lightClippedRatio: { type: Number, min: 0, max: 1, required: true },
                blurVariance: { type: Number, min: 0, required: true },
            },
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
// Uma fotografia ativa por tipo torna a quota de duas fotografias por titular
// uma invariavel de base de dados, incluindo sob uploads concorrentes.
facePhotoSchema.index(
    { userId: 1, kind: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "active" },
        name: "uniq_active_face_photo_per_kind",
    },
);

/**
 * Modelo Mongoose de fotografias faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FacePhoto = model("FacePhoto", facePhotoSchema);
