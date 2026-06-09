import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMySkinEvolutionController } from "../controllers/skin-evolution.controller.js";

export const skinEvolutionRoutes = Router();

skinEvolutionRoutes.get(
    "/me/skin-evolution",
    requireAuth,
    getMySkinEvolutionController,
);