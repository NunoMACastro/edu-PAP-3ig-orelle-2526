/**
 * Audit log append-only para leituras e decisões de revisão humana IA.
 */
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const aiConsultationAuditLogSchema = new Schema(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            required() {
                return !this.actorErasedAt;
            },
            index: true,
        },
        actorErasedAt: {
            type: Date,
            default: null,
        },
        actorRole: {
            type: String,
            enum: ["consultor", "administrador"],
            required: true,
        },
        action: {
            type: String,
            enum: ["list", "detail", "decision"],
            required: true,
            index: true,
        },
        reviewId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationReview",
            default: null,
            index: true,
        },
        resultCount: {
            type: Number,
            min: 0,
            default: null,
        },
        requestId: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null,
        },
        occurredAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
    },
    { versionKey: false },
);

aiConsultationAuditLogSchema.index({ actorId: 1, occurredAt: -1 });
aiConsultationAuditLogSchema.index({ reviewId: 1, occurredAt: -1 });

/** @type {import("mongoose").Model} */
export const AiConsultationAuditLog =
    models.AiConsultationAuditLog ??
    model("AiConsultationAuditLog", aiConsultationAuditLogSchema);
