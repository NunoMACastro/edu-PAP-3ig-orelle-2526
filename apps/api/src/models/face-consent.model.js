/**
 * Modelo de consentimento facial da Orélle.
 *
 * Guarda apenas a prova mínima de aceitação para análise facial cosmética.
 * Fotografias e relatórios continuam nos seus próprios modelos protegidos.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const faceConsentSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        acceptedAt: {
            type: Date,
            required: true,
        },
        version: {
            type: String,
            required: true,
            default: "face-analysis-v1",
        },
        purpose: {
            type: String,
            required: true,
            default: "analise_facial_cosmetica",
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de consentimentos faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceConsent = model("FaceConsent", faceConsentSchema);