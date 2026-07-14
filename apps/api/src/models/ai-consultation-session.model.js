/**
 * Sessão v2 da consulta cosmética conversacional.
 *
 * Objetivos, perguntas, respostas e factos derivados são cifrados com AAD. Os
 * campos pesquisáveis limitam-se a ownership, estado, versões e referências
 * necessárias aos jobs duráveis. Campos legacy permanecem opcionais para uma
 * migração append-only, mas não dirigem o novo runtime.
 */
import mongoose from "mongoose";
import { AI_CONSULTATION_GOALS_VERSION } from "../constants/ai-consultation-goals.js";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model, models } = mongoose;

export const AI_CONSULTATION_SCHEMA_VERSION = 2;
export const AI_CONSULTATION_SCRIPT_VERSION = AI_CONSULTATION_GOALS_VERSION;

export const AI_CONSULTATION_STATUS = Object.freeze({
    DRAFT: "draft",
    SUBMITTED: "submitted",
    ACTIVE: "active",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    LEGACY_ARCHIVED: "legacy_archived",
});

export const AI_CONSULTATION_FLOW_STATES = Object.freeze({
    COLLECTING_GOAL: "collecting_goal",
    COLLECTING_PHOTOS: "collecting_photos",
    ANALYZING: "analyzing",
    ASKING_QUESTIONS: "asking_questions",
    READY_FOR_REPORT: "ready_for_report",
    GENERATING_REPORT: "generating_report",
    DRAFT_READY: "draft_ready",
    REVIEW_PENDING: "review_pending",
    NEEDS_CLARIFICATION: "needs_clarification",
    FROZEN_LOCKED: "frozen_locked",
    UNLOCKED: "unlocked",
    FAILED_RETRYABLE: "failed_retryable",
    CANCELLED: "cancelled",
    LEGACY_ARCHIVED: "legacy_archived",
});

const aiConsultationSessionSchema = new Schema(
    {
        schemaVersion: {
            type: Number,
            required: true,
            default: AI_CONSULTATION_SCHEMA_VERSION,
            min: 1,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            default: null,
            index: true,
        },
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            default: null,
            index: true,
        },
        photoIds: {
            type: [Schema.Types.ObjectId],
            ref: "FacePhoto",
            default: () => [],
        },
        photoQualityAcknowledgement: {
            photoSetHash: {
                type: String,
                default: null,
                maxlength: 64,
            },
            acknowledgedAt: { type: Date, default: null },
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            default: null,
        },
        scriptVersion: {
            type: String,
            required: true,
            default: AI_CONSULTATION_SCRIPT_VERSION,
            trim: true,
        },
        goalSelection: contextualEncryptedField({
            collection: "aiconsultationsessions",
            field: "goalSelection",
            required: true,
        }),
        conversation: contextualEncryptedField({
            collection: "aiconsultationsessions",
            field: "conversation",
            defaultValue: () => ({ turns: [], currentQuestion: null }),
        }),
        facts: contextualEncryptedField({
            collection: "aiconsultationsessions",
            field: "facts",
            defaultValue: () => ({}),
        }),
        // Compatibilidade de leitura durante a migração dos drafts v1.
        answers: contextualEncryptedField({
            collection: "aiconsultationsessions",
            field: "answers",
            defaultValue: () => [],
        }),
        flowState: {
            type: String,
            enum: Object.values(AI_CONSULTATION_FLOW_STATES),
            required: true,
            default: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(AI_CONSULTATION_STATUS),
            required: true,
            default: AI_CONSULTATION_STATUS.ACTIVE,
            index: true,
        },
        isOpen: { type: Boolean, required: true, default: true, index: true },
        revision: { type: Number, required: true, min: 0, default: 0 },
        logicalOperations: { type: Number, required: true, min: 0, default: 0 },
        currentJobId: {
            type: Schema.Types.ObjectId,
            ref: "AiJob",
            default: null,
        },
        currentReviewId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationReview",
            default: null,
        },
        submittedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

aiConsultationSessionSchema.index({ userId: 1, updatedAt: -1 });
aiConsultationSessionSchema.index(
    { userId: 1, isOpen: 1 },
    {
        unique: true,
        partialFilterExpression: { isOpen: true },
        name: "one_open_ai_consultation_per_user",
    },
);

export const AiConsultationSession =
    models.AiConsultationSession ??
    model("AiConsultationSession", aiConsultationSessionSchema);
