/**
 * Modelo de relatorio facial personalizado da MF1.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

export const FACE_REPORT_LIFECYCLE = Object.freeze({
    DRAFT_READY: "draft_ready",
    REVIEW_PENDING: "review_pending",
    NEEDS_CLARIFICATION: "needs_clarification",
    FROZEN_LOCKED: "frozen_locked",
    UNLOCKED: "unlocked",
    ARCHIVED_LEGACY: "archived_legacy",
});

const reportObjectiveSchema = new Schema(
    {
        code: { type: String, required: true, trim: true, maxlength: 64 },
        priority: {
            type: String,
            enum: ["primary", "secondary"],
            required: true,
        },
    },
    { _id: false },
);

const routineStepSchema = new Schema(
    {
        period: {
            type: String,
            enum: ["manha", "noite", "ocasional"],
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
        consultationSessionId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationSession",
            default: null,
            index: true,
        },
        schemaVersion: { type: Number, min: 1, default: 2 },
        version: { type: Number, min: 1, default: 1 },
        lifecycleStatus: {
            type: String,
            enum: Object.values(FACE_REPORT_LIFECYCLE),
            default: FACE_REPORT_LIFECYCLE.DRAFT_READY,
            index: true,
        },
        objectives: { type: [reportObjectiveSchema], default: [] },
        analysisMode: {
            type: String,
            enum: ["openai", "legacy_demo", "legacy_external"],
            required: true,
        },
        analysisIsDemo: {
            type: Boolean,
            required: true,
        },
        analysisProviderVersion: {
            type: String,
            required: true,
        },
        cosmeticSummary: contextualEncryptedField({
            collection: "facereports",
            field: "cosmeticSummary",
            required: true,
        }),
        routineSuggestions: contextualEncryptedField({
            collection: "facereports",
            field: "routineSuggestions",
            required: true,
        }),
        sources: contextualEncryptedField({
            collection: "facereports",
            field: "sources",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "facereports",
            field: "limitations",
            required: true,
        }),
        photoQuality: contextualEncryptedField({
            collection: "facereports",
            field: "photoQuality",
            defaultValue: null,
        }),
        answerSummary: contextualEncryptedField({
            collection: "facereports",
            field: "answerSummary",
            defaultValue: null,
        }),
        machineResult: contextualEncryptedField({
            collection: "facereports",
            field: "machineResult",
            defaultValue: null,
        }),
        humanOverride: contextualEncryptedField({
            collection: "facereports",
            field: "humanOverride",
            defaultValue: null,
        }),
        simulationSpec: contextualEncryptedField({
            collection: "facereports",
            field: "simulationSpec",
            defaultValue: null,
        }),
        visualizationSpec: contextualEncryptedField({
            collection: "facereports",
            field: "visualizationSpec",
            defaultValue: null,
        }),
        candidateAllowlist: contextualEncryptedField({
            collection: "facereports",
            field: "candidateAllowlist",
            defaultValue: null,
        }),
        providerMetadata: {
            provider: { type: String, default: null, maxlength: 32 },
            requestedModel: { type: String, default: null, maxlength: 120 },
            effectiveModel: { type: String, default: null, maxlength: 120 },
            requestId: { type: String, default: null, maxlength: 160 },
            promptVersion: { type: String, default: null, maxlength: 80 },
            responseSchemaVersion: { type: String, default: null, maxlength: 80 },
            rankingPolicyVersion: { type: String, default: null, maxlength: 80 },
            attemptCount: { type: Number, min: 1, max: 3, default: null },
            generatedAt: { type: Date, default: null },
        },
        reportInputHash: {
            type: String,
            default: null,
            minlength: 64,
            maxlength: 64,
            select: false,
        },
        reportOutputHash: {
            type: String,
            default: null,
            minlength: 64,
            maxlength: 64,
            select: false,
        },
        finalRecommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            default: [],
        },
        reviewId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationReview",
            default: null,
        },
        contentHash: {
            type: String,
            default: null,
            minlength: 64,
            maxlength: 64,
            select: false,
        },
        frozenAt: { type: Date, default: null },
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

faceReportSchema.index(
    { userId: 1, analysisId: 1 },
    {
        unique: true,
        partialFilterExpression: { schemaVersion: 1 },
        name: "uniq_legacy_report_per_analysis",
    },
);
faceReportSchema.index(
    { userId: 1, consultationSessionId: 1, version: 1 },
    {
        unique: true,
        partialFilterExpression: {
            schemaVersion: { $gte: 2 },
            consultationSessionId: { $type: "objectId" },
        },
        name: "uniq_consultation_report_version",
    },
);
faceReportSchema.index({ userId: 1, createdAt: -1 });

/**
 * Modelo Mongoose de relatorios faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceReport = model("FaceReport", faceReportSchema);
