/**
 * Modelo de recomendacoes personalizadas da MF2.
 *
 * Liga utilizador, analise facial, relatorio e produto recomendado sem expor
 * fotografias, consentimentos ou dados internos no DTO publico.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const RECOMMENDATION_STATUSES = Object.freeze([
    "active",
    "accepted",
    "dismissed",
    "adjusted",
]);

/**
 * Confirma que existe pelo menos um motivo técnico para a recomendação.
 *
 * @function hasAtLeastOneReasonCode
 * @param {unknown} items - Valor recebido pelo validador Mongoose.
 * @returns {boolean} True quando o valor é um array não vazio.
 */
function hasAtLeastOneReasonCode(items) {
    return Array.isArray(items) && items.length > 0;
}

/**
 * Confirma que a recomendação guarda pelo menos um sinal de origem.
 *
 * @function hasAtLeastOneSourceSignal
 * @param {unknown} items - Valor recebido pelo validador Mongoose.
 * @returns {boolean} True quando o valor é um array não vazio.
 */
function hasAtLeastOneSourceSignal(items) {
    return Array.isArray(items) && items.length > 0;
}

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
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        reasonCodes: {
            type: [String],
            required: true,
            validate: {
                validator: hasAtLeastOneReasonCode,
                message: "Recomendacao deve ter pelo menos um motivo",
            },
        },
        explanation: {
            type: String,
            required: true,
            trim: true,
            minlength: 12,
        },
        sourceSignals: {
            type: [String],
            required: true,
            validate: {
                validator: hasAtLeastOneSourceSignal,
                message: "Recomendacao deve ter pelo menos um sinal de origem",
            },
        },
        limitations: {
            type: [String],
            required: true,
        },
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
        consultantNote: {
            type: String,
            default: null,
            trim: true,
        },
    },
    { timestamps: true },
);

productRecommendationSchema.index(
    { userId: 1, analysisId: 1, productId: 1 },
    { unique: true },
);

/**
 * Modelo Mongoose de recomendacoes de produtos.
 *
 * @type {import("mongoose").Model}
 */
export const ProductRecommendation = model(
    "ProductRecommendation",
    productRecommendationSchema,
);
