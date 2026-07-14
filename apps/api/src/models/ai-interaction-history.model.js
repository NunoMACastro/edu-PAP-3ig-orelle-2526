/**
 * Modelo de historico seguro da interacao cliente-IA.
 *
 * O historico guarda apenas eventos minimizados. Os campos pessoais ficam
 * cifrados em repouso e os IDs internos nunca devem sair no DTO publico.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model, models } = mongoose;

export const AI_HISTORY_EVENT_TYPES = Object.freeze([
    "consultation_submitted",
    "answer_summary_ready",
    "recommendation_context_ready",
]);

export const AI_HISTORY_SOURCES = Object.freeze([
    "guided_consultation",
    "recommendation_engine",
]);

const aiInteractionHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationSession",
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            enum: AI_HISTORY_EVENT_TYPES,
            required: true,
            index: true,
        },
        purpose: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            maxlength: 120,
        },
        safeSummary: contextualEncryptedField({
            collection: "aiinteractionhistories",
            field: "safeSummary",
            required: true,
        }),
        safeSignals: contextualEncryptedField({
            collection: "aiinteractionhistories",
            field: "safeSignals",
            required: true,
        }),
        source: {
            type: String,
            enum: AI_HISTORY_SOURCES,
            required: true,
            default: "guided_consultation",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

// Suporta a timeline do proprio cliente sem pesquisar historico de outros utilizadores.
aiInteractionHistorySchema.index({ userId: 1, createdAt: -1 });
aiInteractionHistorySchema.index(
    { userId: 1, sessionId: 1, eventType: 1 },
    { unique: true },
);

/**
 * Modelo Mongoose de historico minimizado cliente-IA.
 *
 * @type {import("mongoose").Model}
 */
export const AiInteractionHistory =
    models.AiInteractionHistory ??
    model("AiInteractionHistory", aiInteractionHistorySchema);
