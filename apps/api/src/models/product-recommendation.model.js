/**
 * Modelo de recomendacoes personalizadas da MF2.
 *
 * Liga utilizador, analise facial, relatorio e produto recomendado sem expor
 * fotografias, consentimentos ou dados internos no DTO publico.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

export const RECOMMENDATION_STATUSES = Object.freeze([
    "active",
    "accepted",
    "dismissed",
    "adjusted",
]);

const feedbackSchema = new Schema(
    {
        value: {
            type: String,
            enum: ["util", "nao_relevante"],
            required: true,
        },
        submittedAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false },
);

const productRecommendationSchema = new Schema(
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
        },
        schemaVersion: { type: Number, min: 1, default: 2 },
        reportVersion: { type: Number, min: 1, default: 1 },
        analysisMode: {
            type: String,
            enum: ["openai", "legacy_demo", "legacy_external"],
            required: true,
        },
        analysisIsDemo: {
            type: Boolean,
            required: true,
        },
        analysisProviderVersion: {
            type: String,
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variantId: { type: String, default: null, trim: true, maxlength: 64 },
        productSnapshot: contextualEncryptedField({
            collection: "productrecommendations",
            field: "productSnapshot",
            defaultValue: null,
        }),
        selectionRank: { type: Number, min: 1, default: null },
        candidateAllowlistHash: {
            type: String,
            default: null,
            minlength: 64,
            maxlength: 64,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        reasonCodes: contextualEncryptedField({
            collection: "productrecommendations",
            field: "reasonCodes",
            required: true,
        }),
        explanation: contextualEncryptedField({
            collection: "productrecommendations",
            field: "explanation",
            required: true,
        }),
        sourceSignals: contextualEncryptedField({
            collection: "productrecommendations",
            field: "sourceSignals",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "productrecommendations",
            field: "limitations",
            required: true,
        }),
        machineResult: contextualEncryptedField({
            collection: "productrecommendations",
            field: "machineResult",
            required: true,
        }),
        humanOverride: contextualEncryptedField({
            collection: "productrecommendations",
            field: "humanOverride",
            defaultValue: null,
        }),
        status: {
            type: String,
            enum: RECOMMENDATION_STATUSES,
            default: "active",
            index: true,
        },
        feedback: {
            type: feedbackSchema,
            default: null,
        },
        consultantNote: contextualEncryptedField({
            collection: "productrecommendations",
            field: "consultantNote",
            defaultValue: null,
        }),
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

productRecommendationSchema.index(
    { userId: 1, analysisId: 1, productId: 1 },
    {
        unique: true,
        partialFilterExpression: { schemaVersion: 1 },
        name: "uniq_legacy_recommendation_product",
    },
);
productRecommendationSchema.index(
    { userId: 1, reportId: 1, reportVersion: 1, productId: 1, variantId: 1 },
    {
        unique: true,
        partialFilterExpression: { schemaVersion: { $gte: 2 } },
        name: "uniq_report_recommendation_variant",
    },
);
productRecommendationSchema.index({ reportId: 1, selectionRank: 1 });

/**
 * Modelo Mongoose de recomendacoes de produtos.
 *
 * @type {import("mongoose").Model}
 */
export const ProductRecommendation = model(
    "ProductRecommendation",
    productRecommendationSchema,
);
