import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o ID da encomenda recebido na route de recompra.
 * @param {unknown} params - Parâmetros Express.
 * @returns {{ orderId: string }} ID validado da encomenda.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateReorderParams(params) {
    const orderId = String(params?.orderId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError(400, "Encomenda inválida");
    }

    return { orderId };
}