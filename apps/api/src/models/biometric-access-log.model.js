/**
 * Modelo de auditoria minimizada para acessos a dados biometricos.
 *
 * O log guarda apenas metadados necessarios para RF44. Fotografias, relatorios
 * completos, storage keys, cookies e tokens continuam fora deste modelo.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const BIOMETRIC_AUDIT_ACTIONS = Object.freeze({
    LIST_REQUESTS: "list_requests",
    DECIDE_REQUEST: "decide_request",
    VIEW_AUDIT: "view_audit",
    VIEW_RESOURCE: "view_resource",
});

export const BIOMETRIC_AUDIT_RESULTS = Object.freeze({
    ALLOWED: "allowed",
    DENIED: "denied",
});

export const BIOMETRIC_AUDIT_RESOURCE_TYPES = Object.freeze({
    REQUEST: "request",
    PHOTO: "photo",
    REPORT: "report",
    AUDIT: "audit",
});

const biometricAccessLogSchema = new Schema(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        actorRole: {
            type: String,
            required: true,
        },
        subjectUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        action: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_ACTIONS),
            required: true,
        },
        resourceType: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_RESOURCE_TYPES),
            required: true,
        },
        resourceId: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        result: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_RESULTS),
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        alertRaised: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

biometricAccessLogSchema.index({ createdAt: -1 });
biometricAccessLogSchema.index({ actorId: 1, createdAt: -1 });
biometricAccessLogSchema.index({ alertRaised: 1, createdAt: -1 });

/**
 * Modelo Mongoose dos eventos de auditoria biometrica.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricAccessLog = model(
    "BiometricAccessLog",
    biometricAccessLogSchema,
);
