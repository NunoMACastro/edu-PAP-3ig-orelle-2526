import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { ensureActiveFaceConsent } from "../middlewares/face-photo-upload.middleware.js";
import { createMakeupSimulationController } from "../controllers/makeup-simulation.controller.js";

export const makeupSimulationRoutes = Router();

makeupSimulationRoutes.post(
    "/makeup-simulations",
    requireAuth,
    ensureActiveFaceConsent,
    createMakeupSimulationController,
);