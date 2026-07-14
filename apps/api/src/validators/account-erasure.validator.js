/**
 * Validação da confirmação reforçada para eliminar a própria conta.
 *
 * A operação é irreversível: exige a password atual e a confirmação literal
 * `ELIMINAR`. O limite de 72 bytes é medido em UTF-8 antes de qualquer chamada
 * ao bcrypt, evitando a truncagem silenciosa do algoritmo.
 */
import { AppError } from "../middlewares/error.middleware.js";
import {
    getPasswordByteLength,
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_BYTES,
} from "./auth.validator.js";

/** Texto exato que o titular tem de escrever para confirmar a operação. */
export const ACCOUNT_ERASURE_CONFIRMATION = "ELIMINAR";

/**
 * Valida o corpo de `DELETE /api/me/account` sem normalizar a confirmação.
 *
 * @function validateAccountErasureInput
 * @param {unknown} body - Corpo JSON recebido pela API.
 * @returns {{password: string, confirmation: "ELIMINAR"}} Payload validado.
 * @throws {AppError} Quando falta password, o tamanho é inseguro ou a
 * confirmação não coincide literalmente.
 */
export function validateAccountErasureInput(body) {
    const input =
        body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const password = typeof input.password === "string" ? input.password : "";
    const confirmation = input.confirmation;
    const errors = {};
    const passwordBytes = getPasswordByteLength(password);

    if (
        passwordBytes < PASSWORD_MIN_BYTES ||
        passwordBytes > PASSWORD_MAX_BYTES
    ) {
        errors.password = "A password deve ter entre 8 e 72 bytes UTF-8";
    }

    if (confirmation !== ACCOUNT_ERASURE_CONFIRMATION) {
        errors.confirmation = "Escreve ELIMINAR exatamente como apresentado";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Confirmação de eliminação inválida", errors);
    }

    return { password, confirmation: ACCOUNT_ERASURE_CONFIRMATION };
}
