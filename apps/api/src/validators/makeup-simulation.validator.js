/**
 * Validador de simulacao de maquilhagem.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateMakeupSimulationInput(body) {
    const productId = String(body?.productId ?? "");

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "ID de produto inválido");
    }

    return { productId };
}
