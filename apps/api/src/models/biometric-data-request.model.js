/**
 * Modelo de pedidos de privacidade sobre dados biométricos.
 *
 * O pedido guarda apenas metadados de decisão. Fotografias, storage keys,
 * paths internos e relatórios completos continuam nos modelos de origem.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const BIOMETRIC_REQUEST_ACTIONS = Object.freeze({
    DELETE: "delete",
    ANONYMIZE: "anonymize",
});

export const BIOMETRIC_REQUEST_RESOURCES = Object.freeze({
    PHOTOS: "photos",
    REPORTS: "reports",
});

export const BIOMETRIC_REQUEST_STATUSES = Object.freeze({
    PENDING: "pending",
    PROCESSING: "processing",
    FAILED: "failed",
    REJECTED: "rejected",
    COMPLETED: "completed",
});

const biometricDataRequestSchema = new Schema(
    {
        requesterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: Object.values(BIOMETRIC_REQUEST_ACTIONS),
            required: true,
        },
        resources: {
            type: [String],
            enum: Object.values(BIOMETRIC_REQUEST_RESOURCES),
            required: true,
            validate: {
                validator(resources) {
                    // Um pedido sem recurso não tem alvo seguro para aplicar RNF13.
                    return Array.isArray(resources) && resources.length > 0;
                },
                message: "Indica pelo menos um tipo de recurso.",
            },
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        status: {
            type: String,
            enum: Object.values(BIOMETRIC_REQUEST_STATUSES),
            default: BIOMETRIC_REQUEST_STATUSES.PENDING,
            index: true,
        },
        reviewerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        decisionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        decisionError: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

// Estes índices suportam o painel de revisão sem procurar por conteúdo biométrico.
biometricDataRequestSchema.index({ status: 1, createdAt: -1 });
biometricDataRequestSchema.index({ requesterId: 1, status: 1 });

/**
 * Modelo Mongoose dos pedidos de eliminação/anonymização de dados biométricos.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricDataRequest = model(
    "BiometricDataRequest",
    biometricDataRequestSchema,
);