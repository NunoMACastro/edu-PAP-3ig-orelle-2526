/**
 * Rotas de visualizacao antes/depois.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { createBeforeAfterVisualizationController } from "../controllers/before-after-visualization.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const beforeAfterVisualizationRoutes = Router();

beforeAfterVisualizationRoutes.post(
    "/before-after-visualizations",
    requireAuth,
    createBeforeAfterVisualizationController,
);
