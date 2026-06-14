import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Representa a diferença entre uma métrica da análise inicial e da análise final.
 * Guarda apenas valores derivados, sem duplicar fotografias ou paths internos.
 */
const metricDeltaSchema = new Schema(
    {
        metric: { type: String, required: true },
        baselineValue: { type: Schema.Types.Mixed, required: true },
        followUpValue: { type: Schema.Types.Mixed, required: true },
        changeLabel: { type: String, required: true },
    },
    { _id: false },
);

/**
 * Guarda uma comparação entre duas análises faciais do mesmo cliente.
 * O schema mantém referências e resultados resumidos para reduzir exposição biométrica.
 */
const skinComparisonSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        baselineAnalysisId: { type: Schema.Types.ObjectId, ref: "FaceAnalysis", required: true },
        followUpAnalysisId: { type: Schema.Types.ObjectId, ref: "FaceAnalysis", required: true },
        daysBetween: { type: Number, required: true, min: 30 },
        metricDeltas: { type: [metricDeltaSchema], required: true },
        summary: { type: String, required: true },
        limitations: { type: [String], required: true },
    },
    { timestamps: true },
);

skinComparisonSchema.index({ userId: 1, baselineAnalysisId: 1, followUpAnalysisId: 1 }, { unique: true });

/**
 * Modelo MongoDB responsável pelas comparações faciais persistidas.
 */
export const SkinComparison = model("SkinComparison", skinComparisonSchema);