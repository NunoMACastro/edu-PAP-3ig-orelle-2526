/**
 * Controllers do dashboard administrativo.
 */
import { getAdminDashboardStats } from "../services/admin-dashboard.service.js";

/**
 * Devolve estatisticas agregadas para administradores.
 *
 * @async
 * @function getAdminDashboardStatsController
 * @param {import("express").Request} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function getAdminDashboardStatsController(req, res, next) {
    try {
        const stats = await getAdminDashboardStats();
        return res.status(200).json({ stats });
    } catch (err) {
        return next(err);
    }
}
