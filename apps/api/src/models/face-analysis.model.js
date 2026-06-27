/**
 * Modelo de analise facial cosmética da MF1.
 *
 * Guarda achados estruturados, fontes e limitacoes. A analise e cosmética e
 * nao representa diagnostico medico.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const findingSchema = new Schema(
    {
        label: {
            type: String,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        explanation: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const faceAnalysisSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        photoIds: {
            type: [Schema.Types.ObjectId],
            ref: "FacePhoto",
            required: true,
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            required: true,
        },
        providerName: {
            type: String,
            required: true,
        },
        findings: {
            skinType: findingSchema,
            acne: findingSchema,
            manchas: findingSchema,
            rugas: findingSchema,
            oleosidade: findingSchema,
        },
        sources: {
            type: [String],
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
        performance: {
            durationMs: {
                type: Number,
                min: 0,
                default: null,
            },
            budgetMs: {
                type: Number,
                min: 1,
                default: 10000,
            },
        },
        status: {
            type: String,
            enum: ["completed", "failed"],
            default: "completed",
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de analises faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceAnalysis = model("FaceAnalysis", faceAnalysisSchema);
