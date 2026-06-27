/**
 * Rotas administrativas de dashboard.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { getAdminDashboardStatsController } from "../controllers/admin-dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express de dashboard admin.
 *
 * @type {import("express").Router}
 */
export const adminDashboardRoutes = Router();

adminDashboardRoutes.get(
    "/dashboard/stats",
    requireAuth,
    requireRole(ROLES.ADMIN),
    getAdminDashboardStatsController,
);
