/**
 * Rotas de evolucao temporal da pele.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { getMySkinEvolutionController } from "../controllers/skin-evolution.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const skinEvolutionRoutes = Router();

skinEvolutionRoutes.get(
    "/me/skin-evolution",
    requireAuth,
    getMySkinEvolutionController,
);
