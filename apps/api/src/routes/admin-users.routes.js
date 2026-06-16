// real_dev/api/src/routes/admin-users.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    deleteUserAccountController,
    listAdminUsersController,
    updateUserStatusController,
    updateUserRoleController,
} from "../controllers/admin-users.controller.js";

/**
 * Router Express para gestão administrativa de utilizadores (MF0 + MF4).
 * Prefixo montado em app.js: /api/admin
 *
 * @type {import("express").Router}
 */
export const adminUsersRoutes = Router();

// 1. Listar utilizadores
adminUsersRoutes.get("/users", requireAuth, requireRole(ROLES.ADMIN), listAdminUsersController);

// 2. Atualizar o Estado da Conta (Ativo/Suspenso) - MF4
adminUsersRoutes.patch("/users/:id/status", requireAuth, requireRole(ROLES.ADMIN), updateUserStatusController);

// 3. Atualizar a Role (Permissão) - MF0
adminUsersRoutes.patch("/users/:id/role", requireAuth, requireRole(ROLES.ADMIN), updateUserRoleController);

// 4. Eliminação Lógica (Soft Delete) - MF4
adminUsersRoutes.delete("/users/:id", requireAuth, requireRole(ROLES.ADMIN), deleteUserAccountController);