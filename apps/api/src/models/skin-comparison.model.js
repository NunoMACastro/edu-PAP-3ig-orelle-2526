/**
 * Modelo de comparacao temporal de pele da MF3.
 *
 * O BK-MF3-01 compara duas analises faciais do proprio utilizador com pelo
 * menos 30 dias de intervalo. O documento guarda apenas metricas derivadas e
 * referencias internas, nunca fotografias, paths ou storage keys.
 */
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

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
        metricDeltas: contextualEncryptedField({
            collection: "skincomparisons",
            field: "metricDeltas",
            required: true,
        }),
        summary: contextualEncryptedField({
            collection: "skincomparisons",
            field: "summary",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "skincomparisons",
            field: "limitations",
            required: true,
        }),
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
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
