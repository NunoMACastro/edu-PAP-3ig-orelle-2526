/**
 * Modelo de relatorio facial personalizado da MF1.
 */
import mongoose from "mongoose";
import { decryptJson, encryptJson } from "../services/encryption.service.js";

const { Schema, model } = mongoose;

const routineStepSchema = new Schema(
    {
        period: {
            type: String,
            enum: ["manha", "noite"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const faceReportSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
            index: true,
        },
        cosmeticSummary: {
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        routineSuggestions: {
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        sources: {
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        limitations: {
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        privacyStatus: {
            type: String,
            enum: ["active", "deleted", "anonymized"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

/**
 * Modelo Mongoose de relatorios faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceReport = model("FaceReport", faceReportSchema);
