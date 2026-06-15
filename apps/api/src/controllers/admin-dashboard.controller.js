import { getAdminDashboardStats } from "../services/admin-dashboard.service.js";

/**
 * Handler HTTP que devolve estatísticas agregadas para administradores.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function getAdminDashboardStatsController(req, res, next) {
    try {
        const stats = await getAdminDashboardStats();
        return res.status(200).json({ stats });
    } catch (err) {
        return next(err);
    }
}