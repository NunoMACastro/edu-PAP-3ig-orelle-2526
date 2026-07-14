/**
 * Validador de avaliacoes publicadas por clientes.
 */
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida rating e comentario de uma review.
 *
 * @function validateReviewInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{rating: number, comment: string}} Review normalizada.
 * @throws {AppError} Quando rating ou comentario sao invalidos.
 */
export function validateReviewInput(body) {
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "")
        .trim()
        .replace(/\s+/g, " ");
    const errors = {};

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.rating = "A avaliação deve ser um inteiro entre 1 e 5";
    }

    if (comment.length < 3 || comment.length > 600) {
        errors.comment = "O comentário deve ter entre 3 e 600 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Avaliação inválida", errors);
    }

    return { rating, comment };
}
