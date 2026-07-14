/**
 * Modelo de revisao manual de recomendacoes por consultores/admins.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

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
            default: null,
            required() {
                return !this.consultantErasedAt;
            },
            index: true,
        },
        consultantErasedAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["approved", "adjusted", "rejected"],
            required: true,
        },
        note: contextualEncryptedField({
            collection: "recommendationreviews",
            field: "note",
            ownerField: "clientUserId",
            required: true,
        }),
        adjustedExplanation: contextualEncryptedField({
            collection: "recommendationreviews",
            field: "adjustedExplanation",
            ownerField: "clientUserId",
            defaultValue: null,
        }),
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

export const RecommendationReview = model(
    "RecommendationReview",
    recommendationReviewSchema,
);
