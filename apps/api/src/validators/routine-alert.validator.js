/**
 * Validadores de alertas personalizados de rotina.
 */
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte o campo opcional `now` num Date seguro para a execução admin.
 *
 * @function parseOptionalRunDate
 * @param {unknown} value - Valor recebido em `body.now`.
 * @returns {Date} Data validada ou o momento atual.
 * @throws {AppError} Quando `now` não é uma string ISO válida.
 */
function parseOptionalRunDate(value) {
    if (value === undefined) {
        return new Date();
    }

    if (typeof value !== "string") {
        throw new AppError(400, "Execucao de alertas invalida", {
            now: "Campo now deve ser uma data ISO",
        });
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new AppError(400, "Execucao de alertas invalida", {
            now: "Campo now deve ser uma data ISO valida",
        });
    }

    return parsedDate;
}

/**
 * Valida preferencia pessoal de alerta.
 *
 * @function validateRoutineAlertPreferenceInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{enabled: boolean, eveningTime: string}} Preferencia validada.
 */
export function validateRoutineAlertPreferenceInput(body) {
    const enabled = Boolean(body?.enabled);
    const eveningTime = String(body?.eveningTime ?? "21:00").trim();
    const errors = {};

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(eveningTime)) {
        errors.eveningTime = "Hora deve estar no formato HH:mm";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Preferencia de alerta invalida", errors);
    }

    return { enabled, eveningTime };
}

/**
 * Valida input opcional da execução administrativa de alertas.
 *
 * @function validateRoutineAlertRunInput
 * @param {Record<string, unknown>} [body={}] - Corpo do pedido admin.
 * @returns {{now: Date}} Momento usado para avaliar alertas devidos.
 */
export function validateRoutineAlertRunInput(body = {}) {
    return {
        now: parseOptionalRunDate(body?.now),
    };
}
