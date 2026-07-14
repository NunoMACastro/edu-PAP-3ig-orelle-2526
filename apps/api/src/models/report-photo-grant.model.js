/**
 * Consentimento temporário para um consultor abrir fotografias de um relatório.
 * A revisão textual continua possível sem este grant.
 */
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const REPORT_PHOTO_GRANT_STATUSES = Object.freeze({
    ACTIVE: "active",
    REVOKED: "revoked",
    EXPIRED: "expired",
});

const reportPhotoGrantSchema = new Schema(
    {
        clientUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            required: true,
            index: true,
        },
        reviewId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationReview",
            required: true,
            unique: true,
            index: true,
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            required: true,
        },
        noticeVersion: {
            type: String,
            required: true,
            trim: true,
            maxlength: 64,
        },
        status: {
            type: String,
            enum: Object.values(REPORT_PHOTO_GRANT_STATUSES),
            default: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
            index: true,
        },
        grantedAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date, required: true, index: true },
        revokedAt: { type: Date, default: null },
        revocationReason: { type: String, default: null, maxlength: 120 },
    },
    { timestamps: true },
);

reportPhotoGrantSchema.index({ clientUserId: 1, reportId: 1, status: 1 });
reportPhotoGrantSchema.index({ status: 1, expiresAt: 1 });

export const ReportPhotoGrant =
    models.ReportPhotoGrant ??
    model("ReportPhotoGrant", reportPhotoGrantSchema);
