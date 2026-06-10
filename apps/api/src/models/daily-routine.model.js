import mongoose from "mongoose";

const { Schema, model } = mongoose;

const routineProductSnapshotSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        brandName: { type: String, required: true },
        imageUrl: { type: String, required: true },
        priceCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

const routineStepSchema = new Schema(
    {
        period: { type: String, enum: ["manha", "noite"], required: true },
        order: { type: Number, required: true, min: 1 },
        title: { type: String, required: true },
        instructions: { type: String, required: true },
        reason: { type: String, required: true },
        product: { type: routineProductSnapshotSchema, required: true },
    },
    { _id: false },
);

const dailyRoutineSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        source: {
            type: String,
            enum: ["recommendations", "purchases"],
            required: true,
            default: "recommendations",
        },
        sourceRecommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            default: [],
        },
        sourcePurchaseIds: {
            type: [Schema.Types.ObjectId],
            default: [],
        },
        steps: {
            type: [routineStepSchema],
            required: true,
        },
    },
    { timestamps: true },
);

dailyRoutineSchema.index({ userId: 1, source: 1 }, { unique: true });

export const DailyRoutine = model("DailyRoutine", dailyRoutineSchema);