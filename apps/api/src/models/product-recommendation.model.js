import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recommendationFeedbackSchema = new Schema(
    {
        value: {
            type: String,
            enum: ["util", "nao_relevante", null],
            default: null,
        },
        submittedAt: {
            type: Date,
            default: null,
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
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Pelo menos um motivo é obrigatório",
            },
        },
        explanation: {
            type: String,
            required: true,
            minlength: 20,
            maxlength: 600,
        },
        sourceSignals: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["active", "accepted", "dismissed"],
            default: "active",
            index: true,
        },
        feedback: {
            type: recommendationFeedbackSchema,
            default: () => ({}),
        },
    },
    { timestamps: true },
);

productRecommendationSchema.index(
    { userId: 1, analysisId: 1, productId: 1 },
    { unique: true },
);

export const ProductRecommendation = model(
    "ProductRecommendation",
    productRecommendationSchema,
);