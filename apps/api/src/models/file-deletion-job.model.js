/**
 * Outbox genérico para eliminação física de ficheiros privados.
 *
 * O path permanece excluído das queries normais. A chave de deduplicação
 * permite que qualquer transação de domínio volte a enfileirar a mesma
 * eliminação sem criar trabalho duplicado.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const FILE_DELETION_JOB_STATUSES = Object.freeze({
    PENDING: "pending",
    PROCESSING: "processing",
    FAILED: "failed",
    COMPLETED: "completed",
});

export const FILE_DELETION_JOB_RETENTION_SECONDS = 7 * 24 * 60 * 60;

const fileDeletionJobSchema = new Schema(
    {
        deduplicationKey: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        sourceType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
            index: true,
        },
        sourceId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            index: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        storageKey: {
            type: String,
            required: true,
            maxlength: 4096,
            select: false,
        },
        status: {
            type: String,
            enum: Object.values(FILE_DELETION_JOB_STATUSES),
            default: FILE_DELETION_JOB_STATUSES.PENDING,
            index: true,
        },
        attempts: {
            type: Number,
            min: 0,
            default: 0,
        },
        availableAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        lease: {
            token: {
                type: String,
                default: null,
                select: false,
            },
            expiresAt: {
                type: Date,
                default: null,
            },
        },
        lastError: {
            type: String,
            trim: true,
            maxlength: 240,
            default: "",
        },
        lastAttemptAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        terminalAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

fileDeletionJobSchema.index({ sourceType: 1, sourceId: 1, status: 1 });
fileDeletionJobSchema.index({ status: 1, "lease.expiresAt": 1 });
fileDeletionJobSchema.index(
    { terminalAt: 1 },
    {
        expireAfterSeconds: FILE_DELETION_JOB_RETENTION_SECONDS,
        name: "ttl_completed_file_deletion_jobs_7d",
    },
);

/**
 * Modelo do outbox de eliminação física.
 *
 * @type {import("mongoose").Model}
 */
export const FileDeletionJob = model(
    "FileDeletionJob",
    fileDeletionJobSchema,
);
