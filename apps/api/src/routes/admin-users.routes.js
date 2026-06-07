/**
 * Rotas administrativas de utilizadores.
 *
 * Prefixo montado em `app.js`: `/api/admin`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { updateUserRoleController } from "../controllers/admin-users.controller.js";

/**
 * Router Express para gestao administrativa de roles.
 *
 * @type {import("express").Router}
 */
export const adminUsersRoutes = Router();

adminUsersRoutes.patch(
    "/users/:id/role",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateUserRoleController,
);
