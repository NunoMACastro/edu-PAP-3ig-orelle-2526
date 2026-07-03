/**
 * Controllers de preferencias.
 *
 * Estes endpoints pertencem ao utilizador autenticado e nao aceitam `userId` no
 * payload.
 */
import {
    getMyPreferences,
    updateMyPreferences,
} from "../services/preferences.service.js";
import { validatePreferencesInput } from "../validators/preferences.validator.js";

/**
 * Consulta preferencias do utilizador autenticado.
 *
 * @async
 * @function getMyPreferencesController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com preferencias.
 */
export async function getMyPreferencesController(req, res, next) {
    try {
        const preferences = await getMyPreferences(req.user.id);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza preferencias do utilizador autenticado.
 *
 * @async
 * @function updateMyPreferencesController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com preferencias.
 */
export async function updateMyPreferencesController(req, res, next) {
    try {
        const input = validatePreferencesInput(req.body);
        const preferences = await updateMyPreferences(req.user.id, input);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}
