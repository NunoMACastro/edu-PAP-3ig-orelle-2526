/**
 * Rotas de simulacao de maquilhagem.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    createMakeupSimulationController,
    getMakeupSimulationController,
    getMakeupSimulationImageController,
    revokeMakeupSimulationConsentController,
} from "../controllers/makeup-simulation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { ensureActiveFaceConsent } from "../middlewares/face-photo-upload.middleware.js";
import { useRateLimitPolicy } from "../middlewares/rate-limit.middleware.js";

export const makeupSimulationRoutes = Router();

makeupSimulationRoutes.post(
    "/face-reports/:reportId/makeup-simulations",
    requireAuth,
    useRateLimitPolicy("ai"),
    ensureActiveFaceConsent,
    createMakeupSimulationController,
);

makeupSimulationRoutes.get(
    "/makeup-simulations/:simulationId",
    requireAuth,
    getMakeupSimulationController,
);

makeupSimulationRoutes.delete(
    "/makeup-simulations/:simulationId/consent",
    requireAuth,
    revokeMakeupSimulationConsentController,
);

makeupSimulationRoutes.get(
    "/makeup-simulations/:simulationId/image",
    requireAuth,
    getMakeupSimulationImageController,
);
