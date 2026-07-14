/**
 * Modelo de simulacao de maquilhagem da MF2.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

const outputEncryptionSchema = new Schema(
    {
        algorithm: { type: String, required: true },
        keyVersion: { type: Number, required: true, min: 2 },
        aadHash: { type: String, required: true },
        iv: { type: String, required: true, select: false },
        authTag: { type: String, required: true, select: false },
    },
    { _id: false },
);

export const MAKEUP_SIMULATION_STATUSES = Object.freeze({
    QUEUED: "queued",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED_RETRYABLE: "failed_retryable",
    FAILED_TERMINAL: "failed_terminal",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
});

const makeupSimulationSchema = new Schema(
    {
        schemaVersion: { type: Number, min: 2, default: 3 },
        visualizationKind: {
            type: String,
            enum: ["legacy_makeup", "cosmetic"],
            default: "cosmetic",
            index: true,
        },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            default: null,
            index: true,
        },
        facePhotoId: { type: Schema.Types.ObjectId, ref: "FacePhoto", required: true },
        consentId: { type: Schema.Types.ObjectId, ref: "FaceConsent", required: true },
        generativeConsent: {
            noticeVersion: { type: String, required: true, maxlength: 64 },
            acceptedAt: { type: Date, required: true },
            revokedAt: { type: Date, default: null },
        },
        recommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(MAKEUP_SIMULATION_STATUSES),
            default: MAKEUP_SIMULATION_STATUSES.QUEUED,
            index: true,
        },
        jobId: { type: Schema.Types.ObjectId, ref: "AiJob", default: null },
        activeGenerationKey: {
            type: String,
            default: null,
            maxlength: 160,
            select: false,
        },
        intensity: {
            type: String,
            enum: ["subtle", "balanced", "marked"],
            default: "balanced",
        },
        effectCodes: { type: [String], default: [] },
        omittedEffects: {
            ...contextualEncryptedField({
                collection: "makeupsimulations",
                field: "omittedEffects",
                defaultValue: [],
            }),
            select: false,
        },
        simulationSpec: {
            ...contextualEncryptedField({
                collection: "makeupsimulations",
                field: "simulationSpec",
                defaultValue: null,
            }),
            select: false,
        },
        recommendationSnapshot: {
            ...contextualEncryptedField({
                collection: "makeupsimulations",
                field: "recommendationSnapshot",
                defaultValue: null,
            }),
            select: false,
        },
        feedback: {
            ...contextualEncryptedField({
                collection: "makeupsimulations",
                field: "feedback",
                defaultValue: null,
            }),
            select: false,
        },
        requestedModel: { type: String, default: null, maxlength: 120 },
        effectiveModel: { type: String, default: null, maxlength: 120 },
        providerRequestId: { type: String, default: null, maxlength: 160 },
        promptVersion: { type: String, default: null, maxlength: 80 },
        responseSchemaVersion: { type: String, default: null, maxlength: 80 },
        requestedWidth: { type: Number, min: 1, default: null },
        requestedHeight: { type: Number, min: 1, default: null },
        outputWidth: { type: Number, min: 1, default: null },
        outputHeight: { type: Number, min: 1, default: null },
        outputQuality: { type: String, default: null, maxlength: 16 },
        outputFormat: { type: String, default: null, maxlength: 16 },
        outputStorageKey: { type: String, default: null, select: false },
        outputEncryption: {
            type: outputEncryptionSchema,
            default: null,
            select: false,
        },
        outputMimeType: { type: String, default: null },
        outputSizeBytes: { type: Number, min: 1, default: null },
        completedAt: { type: Date, default: null },
        failedAt: { type: Date, default: null },
        safeErrorCode: { type: String, default: null, maxlength: 80 },
        expiresAt: { type: Date, default: null, index: true },
    },
    { timestamps: true },
);

makeupSimulationSchema.index({ userId: 1, reportId: 1, createdAt: -1 });
makeupSimulationSchema.index({ status: 1, expiresAt: 1 });
// A chave só existe enquanto a operação pode ser reutilizada. Expiração,
// revogação e falha terminal removem-na para permitir uma nova edição.
makeupSimulationSchema.index(
    { activeGenerationKey: 1 },
    {
        unique: true,
        partialFilterExpression: { activeGenerationKey: { $type: "string" } },
        name: "uniq_active_makeup_generation",
    },
);

export const MakeupSimulation = model("MakeupSimulation", makeupSimulationSchema);
