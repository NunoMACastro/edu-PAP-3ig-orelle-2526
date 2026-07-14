/**
 * Rotas de exportacao administrativa.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { exportAdminDatasetController } from "../controllers/admin-export.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const adminExportRoutes = Router();

adminExportRoutes.get(
    "/exports/:dataset",
    requireAuth,
    requireRole(ROLES.ADMIN),
    exportAdminDatasetController,
);
