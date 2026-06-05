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
            enum: ["active", "deleted"],
            default: "active",
        },
    },
    { timestamps: true },
);

facePhotoSchema.index({ userId: 1, kind: 1, createdAt: -1 });

export const FacePhoto = model("FacePhoto", facePhotoSchema);