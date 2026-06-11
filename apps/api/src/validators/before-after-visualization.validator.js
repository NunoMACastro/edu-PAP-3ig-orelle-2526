import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateBeforeAfterVisualizationInput(body) {
    const simulationId = String(body?.simulationId ?? "");

    if (!mongoose.isValidObjectId(simulationId)) {
        throw new AppError(400, "ID de simulação inválido");
    }

    return { simulationId };
}