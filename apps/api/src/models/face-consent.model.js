/**
 * Modelo de consentimento facial minimo da MF1.
 *
 * O consentimento e indispensavel antes de receber ou processar fotografias
 * faciais. Fluxos completos de revogacao/apagamento ficam para macrofases
 * posteriores, mas `revokedAt` prepara esse caminho sem inventar UI admin.
 */
import mongoose from "mongoose";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";

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
            enum: [FACE_ANALYSIS_CONSENT_PURPOSE],
            required: true,
            default: FACE_ANALYSIS_CONSENT_PURPOSE,
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
