/**
 * Modelo de vouchers academicos convertidos a partir do desbloqueio do report.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const VOUCHER_STATUS = Object.freeze({
    ACTIVE: "active",
    USED: "used",
});

const voucherSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        amountCents: {
            type: Number,
            required: true,
            min: 0,
        },
        remainingCents: {
            type: Number,
            required: true,
            min: 0,
        },
        sourceReportUnlockId: {
            type: Schema.Types.ObjectId,
            ref: "ReportUnlock",
            required: true,
            unique: true,
            index: true,
        },
        appliedOrderIds: {
            type: [Schema.Types.ObjectId],
            ref: "Order",
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(VOUCHER_STATUS),
            default: VOUCHER_STATUS.ACTIVE,
            index: true,
        },
    },
    { timestamps: true },
);

voucherSchema.index({ userId: 1, status: 1, createdAt: 1 });

/**
 * Modelo Mongoose de vouchers academicos.
 *
 * @type {import("mongoose").Model}
 */
export const Voucher = model("Voucher", voucherSchema);
