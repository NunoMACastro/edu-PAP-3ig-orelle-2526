/**
 * Controllers de rotina diária da MF2.
 */
import {
    generateDailyRoutineForUser,
    getDailyRoutineForUser,
} from "../services/daily-routine.service.js";

/**
 * Gera uma rotina diária para o cliente autenticado com base nas recomendações ativas.
 *
 * @async
 * @function generateDailyRoutineController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com a rotina gerada.
 */
export async function generateDailyRoutineController(req, res, next) {
    try {
        const routine = await generateDailyRoutineForUser(req.user.id);
        return res.status(201).json({ routine });
    } catch (err) {
        return next(err);
    }
}

/**
 * Devolve a rotina diária atualmente guardada para o cliente autenticado.
 *
 * @async
 * @function getDailyRoutineController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a rotina ou null.
 */
export async function getDailyRoutineController(req, res, next) {
    try {
        const routine = await getDailyRoutineForUser(req.user.id);
        return res.status(200).json({ routine });
    } catch (err) {
        return next(err);
    }
}
