/**
 * Modelo de visualizacao antes/depois da MF2.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const beforeAfterVisualizationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        simulationId: { type: Schema.Types.ObjectId, ref: "MakeupSimulation", required: true },
        archivedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

beforeAfterVisualizationSchema.index({ userId: 1, simulationId: 1 }, { unique: true });

export const BeforeAfterVisualization = model(
    "BeforeAfterVisualization",
    beforeAfterVisualizationSchema,
);
