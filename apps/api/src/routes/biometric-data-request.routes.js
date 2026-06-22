// apps/api/src/routes/biometric-data-request.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    createMyBiometricDataRequestController,
    decideBiometricDataRequestController,
    listBiometricDataRequestsController,
} from "../controllers/biometric-data-request.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Rotas dos pedidos de eliminação/anonymização de dados faciais.
 *
 * @type {import("express").Router}
 */
export const biometricDataRequestRoutes = Router();

biometricDataRequestRoutes.post(
    "/me/biometric-data-requests",
    requireAuth,
    createMyBiometricDataRequestController,
);

biometricDataRequestRoutes.get(
    "/admin/biometric-data-requests",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    listBiometricDataRequestsController,
);

biometricDataRequestRoutes.patch(
    "/admin/biometric-data-requests/:requestId/decision",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    decideBiometricDataRequestController,
);