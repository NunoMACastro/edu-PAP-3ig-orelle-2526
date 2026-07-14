/**
 * Modelo de revisão humana de sessões IA.
 *
 * Guarda apenas o necessário para a revisão por consultor: ligação à sessão,
 * recomendações associadas, estado, nota pública, nota interna e histórico
 * auditável de decisões.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model, models } = mongoose;

export const AI_CONSULTATION_REVIEW_STATUSES = Object.freeze([
    "pending",
    "approved",
    "adjusted",
    "needs_clarification",
    "cancelled",
]);

const reviewAuditEventSchema = new Schema(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            required() {
                return !this.actorErasedAt;
            },
        },
        actorErasedAt: {
            type: Date,
            default: null,
        },
        actorRole: {
            type: String,
            required: true,
            enum: ["consultor", "administrador"],
        },
        action: {
            type: String,
            required: true,
            enum: ["approved", "adjusted", "needs_clarification"],
        },
        occurredAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false },
);

const aiConsultationReviewSchema = new Schema(
    {
        schemaVersion: { type: Number, min: 1, default: 2 },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        consultationSessionId: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            default: null,
            index: true,
        },
        reportVersion: { type: Number, min: 1, default: 1 },
        recommendationIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "ProductRecommendation",
            },
        ],
        status: {
            type: String,
            enum: AI_CONSULTATION_REVIEW_STATUSES,
            default: "pending",
            index: true,
        },
        summary: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "summary",
            required: true,
        }),
        sourceLabels: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "sourceLabels",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "limitations",
            required: true,
        }),
        publicInsight: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "publicInsight",
            defaultValue: null,
        }),
        internalNote: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "internalNote",
            defaultValue: null,
        }),
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewerErasedAt: {
            type: Date,
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        requestedAt: { type: Date, default: Date.now },
        cancelledAt: { type: Date, default: null },
        clarificationRequestedAt: { type: Date, default: null },
        clarificationResolvedAt: { type: Date, default: null },
        photoGrantId: {
            type: Schema.Types.ObjectId,
            ref: "ReportPhotoGrant",
            default: null,
        },
        auditTrail: {
            type: [reviewAuditEventSchema],
            default: [],
        },
        machineResult: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "machineResult",
            required: true,
        }),
        humanOverride: contextualEncryptedField({
            collection: "aiconsultationreviews",
            field: "humanOverride",
            defaultValue: null,
        }),
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

// A fila de consultor lê primeiro pendentes e revisões recentes.
aiConsultationReviewSchema.index({ status: 1, updatedAt: -1 });
aiConsultationReviewSchema.index(
    { userId: 1, consultationSessionId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            schemaVersion: 1,
            consultationSessionId: { $type: "objectId" },
        },
        name: "uniq_legacy_consultation_review",
    },
);
aiConsultationReviewSchema.index(
    { userId: 1, reportId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            schemaVersion: { $gte: 2 },
            reportId: { $type: "objectId" },
        },
        name: "uniq_report_review",
    },
);

/**
 * Modelo Mongoose de revisão humana de sessões IA.
 *
 * @type {import("mongoose").Model}
 */
export const AiConsultationReview =
    models.AiConsultationReview ??
    model("AiConsultationReview", aiConsultationReviewSchema);
