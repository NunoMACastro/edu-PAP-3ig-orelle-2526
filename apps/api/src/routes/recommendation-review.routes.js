import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { reviewRecommendationController } from "../controllers/recommendation-review.controller.js";

export const recommendationReviewRoutes = Router();

recommendationReviewRoutes.post(
    "/consultant/recommendations/:recommendationId/reviews",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    reviewRecommendationController,
);