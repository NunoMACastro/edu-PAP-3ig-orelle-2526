import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { downloadAdminExportController } from "../controllers/admin-export.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para exportações administrativas.
 *
 * @type {import("express").Router}
 */
export const adminExportRoutes = Router();

adminExportRoutes.get(
    "/exports/:dataset",
    requireAuth,
    requireRole(ROLES.ADMIN),
    downloadAdminExportController,
);