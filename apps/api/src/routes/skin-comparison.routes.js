/**
 * Rotas da comparacao temporal de pele.
 */
import { Router } from "express";
import {
    createSkinComparisonController,
    getOwnedSkinAnalysisImageController,
    listSkinComparisonOptionsController,
} from "../controllers/skin-comparison.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de comparacoes temporais.
 *
 * @type {import("express").Router}
 */
export const skinComparisonRoutes = Router();

skinComparisonRoutes.get(
    "/me/skin-analyses/comparison-options",
    requireAuth,
    listSkinComparisonOptionsController,
);

skinComparisonRoutes.get(
    "/me/skin-analyses/:analysisId/image",
    requireAuth,
    getOwnedSkinAnalysisImageController,
);

skinComparisonRoutes.get(
    "/me/skin-analyses/:analysisId/image/:kind",
    requireAuth,
    getOwnedSkinAnalysisImageController,
);

skinComparisonRoutes.post(
    "/me/skin-comparisons",
    requireAuth,
    createSkinComparisonController,
);
