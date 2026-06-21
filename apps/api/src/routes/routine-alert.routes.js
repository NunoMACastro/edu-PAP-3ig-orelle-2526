/**
 * Rotas de alertas personalizados de rotina.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    getMyRoutineAlertPreferenceController,
    runRoutineAlertsController,
    updateMyRoutineAlertPreferenceController,
} from "../controllers/routine-alert.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const routineAlertRoutes = Router();

routineAlertRoutes.get(
    "/me/routine-alerts",
    requireAuth,
    getMyRoutineAlertPreferenceController,
);

routineAlertRoutes.put(
    "/me/routine-alerts",
    requireAuth,
    updateMyRoutineAlertPreferenceController,
);

routineAlertRoutes.post(
    "/admin/routine-alerts/run",
    requireAuth,
    requireRole(ROLES.ADMIN),
    runRoutineAlertsController,
);

