/**
 * Modelo de visualizacao antes/depois da MF2.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const visualizationPanelSchema = new Schema(
    {
        label: { type: String, required: true },
        description: { type: String, required: true },
        accentColor: { type: String, required: true },
    },
    { _id: false },
);

const visualComparisonSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["safe_svg_before_after"],
            required: true,
        },
        beforeImageUrl: { type: String, required: true },
        afterImageUrl: { type: String, required: true },
        altText: { type: String, required: true },
    },
    { _id: false },
);

const beforeAfterVisualizationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        simulationId: { type: Schema.Types.ObjectId, ref: "MakeupSimulation", required: true },
        sourceRecommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            required: true,
        },
        beforePanel: { type: visualizationPanelSchema, required: true },
        afterPanel: { type: visualizationPanelSchema, required: true },
        summary: { type: String, required: true },
        visualComparison: { type: visualComparisonSchema, required: true },
        recommendedProductNames: { type: [String], required: true },
        limitations: { type: [String], required: true },
    },
    { timestamps: true },
);

beforeAfterVisualizationSchema.index({ userId: 1, simulationId: 1 }, { unique: true });

export const BeforeAfterVisualization = model(
    "BeforeAfterVisualization",
    beforeAfterVisualizationSchema,
);
