/**
 * Modelo de pedidos de privacidade sobre dados biometricos.
 *
 * O pedido guarda apenas metadados de decisao. Fotografias, storage keys,
 * paths internos e relatorios completos continuam nos modelos de origem.
 */
import mongoose from "mongoose";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
} from "../constants/domain.constants.js";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

const biometricDataRequestSchema = new Schema(
    {
        scope: {
            type: String,
            enum: ["biometric"],
            default: "biometric",
            required: true,
        },
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
                    return Array.isArray(resources) && resources.length > 0;
                },
                message: "Indica pelo menos um tipo de recurso.",
            },
        },
        reason: contextualEncryptedField({
            collection: "biometricdatarequests",
            field: "reason",
            ownerField: "requesterId",
        }),
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
        decisionReason: contextualEncryptedField({
            collection: "biometricdatarequests",
            field: "decisionReason",
            ownerField: "requesterId",
        }),
        decisionError: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        attempts: {
            type: Number,
            min: 0,
            default: 0,
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
        lastAttemptAt: {
            type: Date,
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        erasureVerifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

biometricDataRequestSchema.index({ status: 1, createdAt: -1 });
biometricDataRequestSchema.index({ requesterId: 1, status: 1 });
biometricDataRequestSchema.index({ status: 1, "lease.expiresAt": 1 });

/**
 * Modelo Mongoose dos pedidos de eliminacao/anonymizacao de dados biometricos.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricDataRequest = model(
    "BiometricDataRequest",
    biometricDataRequestSchema,
);
