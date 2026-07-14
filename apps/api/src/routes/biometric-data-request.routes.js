/**
 * Rotas canónicas dos pedidos de privacidade facial e aliases históricos.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    createMyBiometricDataRequestController,
    decideBiometricDataRequestController,
    listBiometricDataRequestsController,
    listMyBiometricDataRequestsController,
    retryBiometricDataRequestController,
} from "../controllers/biometric-data-request.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/** @type {import("express").Router} */
export const biometricDataRequestRoutes = Router();

const requireClient = [requireAuth, requireRole(ROLES.CLIENTE)];
// Pedidos de eliminação/anonimização são operações administrativas
// destrutivas. O consultor cosmético não recebe autoridade RGPD por inerência.
const requirePrivacyAdmin = [requireAuth, requireRole(ROLES.ADMIN)];

// Contrato canónico do titular.
biometricDataRequestRoutes.post(
    "/me/privacy-requests",
    ...requireClient,
    createMyBiometricDataRequestController,
);
biometricDataRequestRoutes.get(
    "/me/privacy-requests",
    ...requireClient,
    listMyBiometricDataRequestsController,
);

// Contrato canónico de revisão. A variante sem parâmetro mantém o ID no body
// para corresponder ao contrato documental; a variante REST explícita é a
// forma preferida por novos clientes.
biometricDataRequestRoutes.get(
    "/admin/privacy-requests",
    ...requirePrivacyAdmin,
    listBiometricDataRequestsController,
);
biometricDataRequestRoutes.patch(
    "/admin/privacy-requests",
    ...requirePrivacyAdmin,
    decideBiometricDataRequestController,
);
biometricDataRequestRoutes.patch(
    "/admin/privacy-requests/:requestId",
    ...requirePrivacyAdmin,
    decideBiometricDataRequestController,
);
biometricDataRequestRoutes.post(
    "/admin/privacy-requests/:requestId/retry",
    ...requirePrivacyAdmin,
    retryBiometricDataRequestController,
);

// Aliases legados mantidos durante a migração dos consumidores atuais.
biometricDataRequestRoutes.post(
    "/me/biometric-data-requests",
    ...requireClient,
    createMyBiometricDataRequestController,
);
biometricDataRequestRoutes.get(
    "/me/biometric-data-requests",
    ...requireClient,
    listMyBiometricDataRequestsController,
);
biometricDataRequestRoutes.get(
    "/admin/biometric-data-requests",
    ...requirePrivacyAdmin,
    listBiometricDataRequestsController,
);
biometricDataRequestRoutes.patch(
    "/admin/biometric-data-requests/:requestId/decision",
    ...requirePrivacyAdmin,
    decideBiometricDataRequestController,
);
