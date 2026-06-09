import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    generateRecommendationsController,
    listMyRecommendationsController,
} from "../controllers/recommendation.controller.js";

export const recommendationRoutes = Router();

recommendationRoutes.get(
    "/recommendations",
    requireAuth,
    listMyRecommendationsController,
);

recommendationRoutes.post(
    "/recommendations/generate",
    requireAuth,
    generateRecommendationsController,
);