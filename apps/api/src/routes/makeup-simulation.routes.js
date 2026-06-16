/**
 * Rotas de simulacao de maquilhagem.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { createMakeupSimulationController } from "../controllers/makeup-simulation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { ensureActiveFaceConsent } from "../middlewares/face-photo-upload.middleware.js";

export const makeupSimulationRoutes = Router();

makeupSimulationRoutes.post(
    "/makeup-simulations",
    requireAuth,
    ensureActiveFaceConsent,
    createMakeupSimulationController,
);
