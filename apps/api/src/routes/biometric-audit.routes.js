/**
 * Rotas administrativas de auditoria biometrica RF44.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    listBiometricAuditAlertsController,
    listBiometricAuditLogsController,
} from "../controllers/biometric-audit.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para consulta de logs e alertas biometricos.
 *
 * @type {import("express").Router}
 */
export const biometricAuditRoutes = Router();

biometricAuditRoutes.get(
    "/biometric-audit/logs",
    requireAuth,
    // Apenas administradores consultam auditoria global de dados sensiveis.
    requireRole(ROLES.ADMIN),
    listBiometricAuditLogsController,
);

biometricAuditRoutes.get(
    "/biometric-audit/alerts",
    requireAuth,
    // Consultores podem gerar eventos noutros fluxos, mas nao veem logs globais.
    requireRole(ROLES.ADMIN),
    listBiometricAuditAlertsController,
);
