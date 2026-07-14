/**
 * Modelo de analise facial cosmética da MF1.
 *
 * Guarda achados estruturados, fontes e limitacoes. A analise e cosmética e
 * nao representa diagnostico medico.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model, models } = mongoose;

const faceAnalysisSchema = new Schema(
    {
        schemaVersion: {
            type: Number,
            required: true,
            default: 2,
            min: 1,
        },
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
        consultationSessionId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationSession",
            default: null,
            index: true,
        },
        inputFingerprint: {
            type: String,
            default: null,
            maxlength: 64,
            select: false,
        },
        providerName: {
            type: String,
            required: true,
        },
        providerVersion: {
            type: String,
            required: true,
        },
        mode: {
            type: String,
            enum: ["openai", "legacy_demo", "legacy_external"],
            required: true,
            index: true,
        },
        isDemo: {
            type: Boolean,
            required: true,
            index: true,
        },
        findings: contextualEncryptedField({
            collection: "faceanalyses",
            field: "findings",
            required: false,
        }),
        photoQuality: contextualEncryptedField({
            collection: "faceanalyses",
            field: "photoQuality",
            required: true,
        }),
        sources: contextualEncryptedField({
            collection: "faceanalyses",
            field: "sources",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "faceanalyses",
            field: "limitations",
            required: true,
        }),
        safetyFlags: contextualEncryptedField({
            collection: "faceanalyses",
            field: "safetyFlags",
            defaultValue: () => [],
        }),
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
        provenance: {
            requestedModel: { type: String, required: true, trim: true },
            effectiveModel: { type: String, required: true, trim: true },
            requestId: { type: String, default: null, trim: true, maxlength: 160 },
            promptVersion: { type: String, required: true, trim: true },
            schemaVersion: { type: String, required: true, trim: true },
        },
        status: {
            type: String,
            enum: ["completed", "failed", "inconclusive", "legacy_archived"],
            default: "completed",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

faceAnalysisSchema.index(
    { userId: 1, inputFingerprint: 1 },
    {
        unique: true,
        partialFilterExpression: {
            schemaVersion: 2,
            inputFingerprint: { $type: "string" },
        },
        name: "uniq_v2_face_analysis_input",
    },
);

/**
 * Modelo Mongoose de analises faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceAnalysis =
    models.FaceAnalysis ?? model("FaceAnalysis", faceAnalysisSchema);
