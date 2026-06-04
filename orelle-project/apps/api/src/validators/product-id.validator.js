import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateProductIdParam(params) {
    const productId = String(params.productId ?? "").trim();

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return productId;
}