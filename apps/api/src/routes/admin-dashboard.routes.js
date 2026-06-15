import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getAdminDashboardStatsController } from "../controllers/admin-dashboard.controller.js";

/**
 * Rotas administrativas protegidas por autenticação e role.
 */
export const adminDashboardRoutes = Router();

adminDashboardRoutes.get(
    "/admin/dashboard/stats",
    requireAuth,
    requireRole("administrador"),
    getAdminDashboardStatsController,
);