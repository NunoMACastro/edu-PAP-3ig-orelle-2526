/**
 * Modelo de revisao manual de recomendacoes por consultores/admins.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recommendationReviewSchema = new Schema(
    {
        recommendationId: {
            type: Schema.Types.ObjectId,
            ref: "ProductRecommendation",
            required: true,
            index: true,
        },
        clientUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        consultantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["approved", "adjusted", "rejected"],
            required: true,
        },
        note: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 600,
        },
        adjustedExplanation: {
            type: String,
            default: null,
            trim: true,
            maxlength: 600,
        },
    },
    { timestamps: true },
);

export const RecommendationReview = model(
    "RecommendationReview",
    recommendationReviewSchema,
);
