/**
 * Rotas de revisão humana de sessões IA por consultores.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    decideAiConsultationReviewController,
    getAiConsultationReviewController,
    listAiConsultationReviewsController,
    getAiConsultationReviewPhotoController,
} from "../controllers/ai-consultation-review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const aiConsultationReviewRoutes = Router();

aiConsultationReviewRoutes.get(
    "/consultant/ai-consultation-reviews",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    listAiConsultationReviewsController,
);

aiConsultationReviewRoutes.get(
    "/consultant/ai-consultation-reviews/:reviewId",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    getAiConsultationReviewController,
);

aiConsultationReviewRoutes.post(
    "/consultant/ai-consultation-reviews/:reviewId/decision",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    decideAiConsultationReviewController,
);

aiConsultationReviewRoutes.get(
    "/consultant/ai-consultation-reviews/:reviewId/photos/:view",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    getAiConsultationReviewPhotoController,
);
