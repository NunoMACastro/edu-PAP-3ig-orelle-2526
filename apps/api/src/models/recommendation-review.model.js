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
            minlength: 5,
            maxlength: 500,
        },
        adjustedExplanation: {
            type: String,
            default: null,
            maxlength: 600,
        },
        reviewedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true },
);

recommendationReviewSchema.index({ recommendationId: 1, consultantId: 1, createdAt: -1 });

export const RecommendationReview = model("RecommendationReview", recommendationReviewSchema);