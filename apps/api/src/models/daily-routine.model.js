/**
 * Modelo de rotina diaria da MF2.
 *
 * DERIVADO: enquanto compras reais nao existem antes da MF3, a origem da rotina
 * e `recommendations`. O enum ja prepara `purchases` para integracao futura.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSnapshotSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        brandName: { type: String, required: true },
        imageUrl: { type: String, required: true },
        priceCents: { type: Number, required: true },
    },
    { _id: false },
);

const routineStepSchema = new Schema(
    {
        period: {
            type: String,
            enum: ["manha", "noite"],
            required: true,
        },
        title: { type: String, required: true },
        instructions: { type: String, required: true },
        recommendationId: {
            type: Schema.Types.ObjectId,
            ref: "ProductRecommendation",
            required: true,
        },
        productSnapshot: {
            type: productSnapshotSchema,
            required: true,
        },
    },
    { _id: false },
);

const dailyRoutineSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        source: {
            type: String,
            enum: ["recommendations", "purchases"],
            required: true,
            default: "recommendations",
        },
        steps: {
            type: [routineStepSchema],
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
    },
    { timestamps: true },
);

export const DailyRoutine = model("DailyRoutine", dailyRoutineSchema);
