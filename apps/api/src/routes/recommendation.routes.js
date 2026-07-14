/**
 * Rotas de recomendacoes da MF2.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    listRecommendationsController,
    submitRecommendationFeedbackController,
} from "../controllers/recommendation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const recommendationRoutes = Router();

recommendationRoutes.get(
    "/recommendations",
    requireAuth,
    listRecommendationsController,
);

recommendationRoutes.post(
    "/recommendations/:recommendationId/feedback",
    requireAuth,
    submitRecommendationFeedbackController,
);
