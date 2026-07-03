/**
 * Rotas de pedidos de eliminacao/anonymizacao de dados faciais.
 */
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
 * Router Express para RF41.
 *
 * @type {import("express").Router}
 */
export const biometricDataRequestRoutes = Router();

biometricDataRequestRoutes.post(
    "/me/biometric-data-requests",
    requireAuth,
    requireRole(ROLES.CLIENTE),
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
