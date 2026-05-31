import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { updateUserRoleController } from "../controllers/admin-users.controller.js";

export const adminUsersRoutes = Router();

adminUsersRoutes.patch(
    "/users/:id/role",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateUserRoleController,
);