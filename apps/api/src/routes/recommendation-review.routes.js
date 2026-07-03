/**
 * Rotas de revisao manual de recomendacoes.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { createRecommendationReviewController } from "../controllers/recommendation-review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const recommendationReviewRoutes = Router();

recommendationReviewRoutes.post(
    "/consultant/recommendations/:recommendationId/reviews",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    createRecommendationReviewController,
);
