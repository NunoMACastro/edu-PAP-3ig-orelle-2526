/**
 * Job durável para operações OpenAI longas.
 *
 * O documento contém apenas referências, estado operacional e resultado
 * sanitizado. Fotografias, prompts, respostas e relatórios não são copiados
 * para esta coleção.
 */
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const AI_JOB_TYPES = Object.freeze({
    ANALYZE_PHOTOS: "analyze_photos",
    SELECT_NEXT_QUESTION: "select_next_question",
    GENERATE_REPORT: "generate_report",
    GENERATE_MAKEUP_PREVIEW: "generate_makeup_preview",
});

export const AI_JOB_STATUSES = Object.freeze({
    QUEUED: "queued",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED_RETRYABLE: "failed_retryable",
    FAILED_TERMINAL: "failed_terminal",
    CANCELLED: "cancelled",
});

const aiJobSchema = new Schema(
    {
        type: {
            type: String,
            enum: Object.values(AI_JOB_TYPES),
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        consultationSessionId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationSession",
            default: null,
            index: true,
        },
        resourceType: {
            type: String,
            trim: true,
            maxlength: 80,
            default: null,
        },
        resourceId: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null,
        },
        deduplicationKey: {
            type: String,
            required: true,
            unique: true,
            select: false,
            maxlength: 160,
        },
        status: {
            type: String,
            enum: Object.values(AI_JOB_STATUSES),
            default: AI_JOB_STATUSES.QUEUED,
            index: true,
        },
        attempts: { type: Number, min: 0, default: 0 },
        maxAttempts: { type: Number, min: 1, max: 10, default: 4 },
        manualRetryCount: { type: Number, min: 0, max: 2, default: 0 },
        leaseRecoveryCount: { type: Number, min: 0, max: 3, default: 0 },
        availableAt: { type: Date, required: true, default: Date.now, index: true },
        lease: {
            token: { type: String, default: null, select: false },
            workerId: { type: String, default: null, select: false, maxlength: 120 },
            expiresAt: { type: Date, default: null, index: true },
        },
        result: {
            resourceType: { type: String, trim: true, maxlength: 80, default: null },
            resourceId: { type: String, trim: true, maxlength: 120, default: null },
            flowState: { type: String, trim: true, maxlength: 80, default: null },
        },
        lastError: {
            code: { type: String, trim: true, maxlength: 80, default: null },
            retryable: { type: Boolean, default: false },
            at: { type: Date, default: null },
        },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        terminalAt: { type: Date, default: null },
    },
    { timestamps: true },
);

aiJobSchema.index({ status: 1, availableAt: 1, "lease.expiresAt": 1, type: 1 });
aiJobSchema.index({ userId: 1, consultationSessionId: 1, createdAt: -1 });
// Campos null não entram no TTL; qualquer estado terminal recebe `terminalAt`.
aiJobSchema.index(
    { terminalAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60, name: "ttl_terminal_ai_jobs_30d" },
);

export const AiJob = models.AiJob ?? model("AiJob", aiJobSchema);
