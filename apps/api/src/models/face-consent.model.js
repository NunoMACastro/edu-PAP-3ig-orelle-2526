/**
 * Modelo de consentimento facial minimo da MF1.
 *
 * O consentimento e indispensavel antes de receber ou processar fotografias
 * faciais. Fluxos completos de revogacao/apagamento ficam para macrofases
 * posteriores, mas `revokedAt` prepara esse caminho sem inventar UI admin.
 */
import mongoose from "mongoose";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";

const { Schema, model, models } = mongoose;

const externalProviderConsentSchema = new Schema(
    {
        provider: {
            type: String,
            enum: ["openai"],
            required: true,
        },
        noticeVersion: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 64,
        },
        acceptedAt: {
            type: Date,
            required: true,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: false },
);

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
            default: "face-analysis-v2",
            maxlength: 64,
            match: /^face-analysis-v[1-9]\d{0,5}$/,
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
        externalProviderConsent: {
            type: externalProviderConsentSchema,
            default: null,
        },
        purposes: {
            openAiAnalysis: { type: Boolean, required: true, default: true },
            generativeEdit: { type: Boolean, required: true, default: false },
            consultantPhotoAccess: { type: Boolean, required: true, default: false },
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de consentimentos faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceConsent =
    models.FaceConsent ?? model("FaceConsent", faceConsentSchema);
