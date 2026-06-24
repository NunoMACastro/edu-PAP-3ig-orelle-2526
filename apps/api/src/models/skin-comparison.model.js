/**
 * Modelo de comparacao temporal de pele da MF3.
 *
 * O BK-MF3-01 compara duas analises faciais do proprio utilizador com pelo
 * menos 30 dias de intervalo. O documento guarda apenas metricas derivadas e
 * referencias internas, nunca fotografias, paths ou storage keys.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const metricDeltaSchema = new Schema(
    {
        metric: { type: String, required: true },
        baselineValue: { type: String, required: true },
        followUpValue: { type: String, required: true },
        changeLabel: { type: String, required: true },
    },
    { _id: false },
);

const skinComparisonSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        baselineAnalysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
        },
        followUpAnalysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
        },
        daysBetween: {
            type: Number,
            required: true,
            min: 30,
        },
        metricDeltas: {
            type: [metricDeltaSchema],
            required: true,
        },
        summary: {
            type: String,
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
    },
    { timestamps: true },
);

skinComparisonSchema.index(
    { userId: 1, baselineAnalysisId: 1, followUpAnalysisId: 1 },
    { unique: true },
);

/**
 * Modelo Mongoose de comparacoes temporais de pele.
 *
 * @type {import("mongoose").Model}
 */
export const SkinComparison = model("SkinComparison", skinComparisonSchema);
