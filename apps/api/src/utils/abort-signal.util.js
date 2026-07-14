/**
 * Utilitários comuns para fronteiras cooperativas de cancelamento.
 *
 * O runtime usa `AbortSignal` desde o pedido HTTP até ao filesystem e à base
 * de dados. Este módulo converte razões arbitrárias do Node num erro HTTP
 * seguro e evita que cada service atribua semânticas diferentes ao mesmo
 * cancelamento.
 */
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte o estado abortado num erro seguro, preservando um `AppError`
 * deliberadamente criado pelo timeout transversal.
 *
 * @param {AbortSignal|undefined} signal - Sinal cooperativo.
 * @param {string} [message="Operação cancelada."] - Mensagem pública de fallback.
 * @returns {AppError} Erro HTTP estável.
 */
export function getAbortSignalError(
    signal,
    message = "Operação cancelada.",
) {
    if (signal?.reason instanceof AppError) return signal.reason;
    return new AppError(503, message);
}

/**
 * Impede que uma operação comece ou atravesse uma barreira de persistência
 * depois de o pedido ou budget ter sido cancelado.
 *
 * @param {AbortSignal|undefined} signal - Sinal cooperativo.
 * @param {string} [message] - Mensagem pública de fallback.
 * @returns {void}
 * @throws {AppError} Quando o sinal já foi abortado.
 */
export function assertAbortSignalActive(signal, message) {
    if (signal?.aborted) {
        throw getAbortSignalError(signal, message);
    }
}
