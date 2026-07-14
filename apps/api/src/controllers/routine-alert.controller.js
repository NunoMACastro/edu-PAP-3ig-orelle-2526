/**
 * Controllers de alertas personalizados de rotina.
 */
import {
    createDueRoutineAlerts,
    getMyRoutineAlertPreference,
    updateMyRoutineAlertPreference,
} from "../services/routine-alert.service.js";
import {
    validateRoutineAlertPreferenceInput,
    validateRoutineAlertRunInput,
} from "../validators/routine-alert.validator.js";

/**
 * Devolve a preferência de alerta de rotina do utilizador autenticado.
 *
 * @param {import("express").Request} req - Pedido com `req.user.id` da sessão.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com preferência própria.
 */
export async function getMyRoutineAlertPreferenceController(req, res, next) {
    try {
        const preference = await getMyRoutineAlertPreference(req.user.id);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza a preferência de alerta de rotina do próprio utilizador.
 *
 * @param {import("express").Request} req - Pedido autenticado com body validado.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com preferência atualizada.
 */
export async function updateMyRoutineAlertPreferenceController(req, res, next) {
    try {
        // O userId vem da sessão; o frontend não escolhe ownership da preferência.
        const input = validateRoutineAlertPreferenceInput(req.body);
        const preference = await updateMyRoutineAlertPreference(req.user.id, input);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

/**
 * Executa a criação controlada dos alertas de rotina que estão devidos.
 *
 * @param {import("express").Request} req - Pedido administrativo ou de smoke com data opcional.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com contagem criada.
 */
export async function runRoutineAlertsController(req, res, next) {
    try {
        const input = validateRoutineAlertRunInput(req.body);
        const result = await createDueRoutineAlerts(input.now);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
