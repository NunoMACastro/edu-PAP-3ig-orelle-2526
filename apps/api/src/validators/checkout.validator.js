import { AppError } from "../middlewares/error.middleware.js";

const PAYMENT_METHODS = new Set(["stripe", "paypal", "mbway"]);

/**
 * Valida o método de pagamento pedido no checkout.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ paymentMethod: "stripe" | "paypal" | "mbway" }} Método normalizado.
 * @throws {AppError} Quando o método não pertence ao conjunto permitido.
 */
export function validateCheckoutPayload(body) {
    const paymentMethod = String(body?.paymentMethod || "").trim().toLowerCase();

    if (!PAYMENT_METHODS.has(paymentMethod)) {
        throw new AppError(400, "Método de pagamento inválido");
    }

    return { paymentMethod };
}
