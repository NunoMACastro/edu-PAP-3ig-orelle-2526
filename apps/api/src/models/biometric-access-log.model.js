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

/**
 * Registo minimizado de acesso a dados biométricos.
 *
 * Guarda metadados suficientes para auditoria sem duplicar dados sensíveis.
 */
const biometricAccessLogSchema = new Schema(
    {
        // O ator vem da sessão autenticada; nunca deve ser escolhido pelo frontend.
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
        // O par resourceType/resourceId identifica o alvo sem copiar imagem, relatório ou path interno.
        action: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_ACTIONS),
            required: true,
        },
        resourceType: {
            type: String,
            enum: ["request", "photo", "report", "audit"],
            required: true,
        },
        resourceId: {
            type: String,
            default: "",
        },
        result: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_RESULTS),
            required: true,
        },
        reason: {
            type: String,
            maxlength: 200,
            default: "",
        },
        // O alerta fica indexado para o painel administrativo conseguir listar sinais de risco rapidamente.
        alertRaised: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

biometricAccessLogSchema.index({ createdAt: -1 });

/**
 * Modelo Mongoose dos eventos de auditoria biométrica.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricAccessLog = model(
    "BiometricAccessLog",
    biometricAccessLogSchema,
);