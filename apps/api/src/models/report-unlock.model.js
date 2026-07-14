/**
 * Modelo de desbloqueio academico de relatorios IA.
 *
 * O desbloqueio nao representa uma transacao monetaria real. Guarda apenas o
 * estado do pagamento simulado e a base de calculo do voucher pedagogico.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const REPORT_UNLOCK_STATUS = Object.freeze({
    LOCKED: "locked",
    UNLOCKED: "unlocked",
});

const simulatedPaymentSchema = new Schema(
    {
        status: {
            type: String,
            enum: ["not_started", "simulated_paid", "not_required"],
            default: "not_started",
            required: true,
        },
        amountCents: {
            type: Number,
            min: 0,
            default: 0,
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        reference: {
            type: String,
            default: null,
            trim: true,
        },
        idempotencyKeyHash: {
            type: String,
            default: null,
            select: false,
        },
    },
    { _id: false },
);

const reportUnlockSchema = new Schema(
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
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            required: true,
            unique: true,
            index: true,
        },
        schemaVersion: { type: Number, min: 1, default: 2 },
        reportVersion: { type: Number, min: 1, default: 1 },
        contentHash: {
            type: String,
            default: null,
            minlength: 64,
            maxlength: 64,
        },
        recommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            default: [],
        },
        recommendedTotalCents: {
            type: Number,
            required: true,
            min: 0,
        },
        depositCents: {
            type: Number,
            required: true,
            min: 0,
        },
        availableRecommendationCount: {
            type: Number,
            min: 0,
            default: 0,
        },
        recommendationSnapshots: {
            type: [
                new Schema(
                    {
                        recommendationId: {
                            type: Schema.Types.ObjectId,
                            required: true,
                        },
                        productId: {
                            type: Schema.Types.ObjectId,
                            required: true,
                        },
                        variantId: { type: String, default: null },
                        unitPriceCents: { type: Number, min: 0, required: true },
                        stockAtFreeze: { type: Number, min: 0, required: true },
                        availableAtFreeze: { type: Boolean, required: true },
                    },
                    { _id: false },
                ),
            ],
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(REPORT_UNLOCK_STATUS),
            default: REPORT_UNLOCK_STATUS.LOCKED,
            index: true,
        },
        simulatedPayment: {
            type: simulatedPaymentSchema,
            default: () => ({ status: "not_started" }),
        },
        unlockedAt: {
            type: Date,
            default: null,
        },
        frozenAt: { type: Date, default: null },
        zeroFeeReason: { type: String, default: null, maxlength: 120 },
    },
    { timestamps: true },
);

reportUnlockSchema.index({ userId: 1, reportId: 1 }, { unique: true });

/**
 * Modelo Mongoose do gate academico de relatorios.
 *
 * @type {import("mongoose").Model}
 */
export const ReportUnlock = model("ReportUnlock", reportUnlockSchema);
