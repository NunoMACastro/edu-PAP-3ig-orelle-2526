import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createSkinComparisonController } from "../controllers/skin-comparison.controller.js";

/**
 * Rotas autenticadas para comparações faciais do próprio cliente.
 */
export const skinComparisonRoutes = Router();

skinComparisonRoutes.post("/me/skin-comparisons", requireAuth, createSkinComparisonController);