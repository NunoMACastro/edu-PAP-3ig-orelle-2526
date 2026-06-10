import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createBeforeAfterVisualizationController } from "../controllers/before-after-visualization.controller.js";

export const beforeAfterVisualizationRoutes = Router();

beforeAfterVisualizationRoutes.post(
    "/before-after-visualizations",
    requireAuth,
    createBeforeAfterVisualizationController,
);