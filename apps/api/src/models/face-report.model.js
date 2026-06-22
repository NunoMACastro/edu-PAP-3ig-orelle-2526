/**
 * Modelo de relatorio facial personalizado da MF1.
 */
import mongoose from "mongoose";

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
            type: String,
            required: true,
        },
        routineSuggestions: {
            type: [routineStepSchema],
            required: true,
        },
        sources: {
            type: [String],
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
        // apps/api/src/models/face-report.model.js
privacyStatus: {
    type: String,
    enum: ["active", "deleted", "anonymized"],
    default: "active",
    index: true,
},
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de relatorios faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceReport = model("FaceReport", faceReportSchema);
