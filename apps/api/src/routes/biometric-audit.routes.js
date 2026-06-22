import { Router } from "express";
import {
    listBiometricAuditAlertsController,
    listBiometricAuditLogsController,
} from "../controllers/biometric-audit.controller.js";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Rotas administrativas de auditoria biométrica.
 *
 * @type {import("express").Router}
 */
export const biometricAuditRoutes = Router();

biometricAuditRoutes.get(
    "/biometric-audit/logs",
    requireAuth,
    // Só administrador consulta todos os eventos para reduzir exposição interna.
    requireRole(ROLES.ADMIN),
    listBiometricAuditLogsController,
);

biometricAuditRoutes.get(
    "/biometric-audit/alerts",
    requireAuth,
    // Consultores podem gerar eventos, mas não precisam de ver auditoria global.
    requireRole(ROLES.ADMIN),
    listBiometricAuditAlertsController,
);