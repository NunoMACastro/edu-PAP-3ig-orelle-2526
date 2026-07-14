/** Rotas genéricas da pré-visualização cosmética; prefixo `/api`. */
import { Router } from "express";
import {
    createCosmeticVisualizationController,
    getCosmeticVisualizationController,
    getCosmeticVisualizationImageController,
    putCosmeticVisualizationFeedbackController,
    revokeCosmeticVisualizationConsentController,
} from "../controllers/cosmetic-visualization.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { ensureActiveFaceConsent } from "../middlewares/face-photo-upload.middleware.js";
import { useRateLimitPolicy } from "../middlewares/rate-limit.middleware.js";

export const cosmeticVisualizationRoutes = Router();

cosmeticVisualizationRoutes.post(
    "/face-reports/:reportId/cosmetic-visualizations",
    requireAuth,
    useRateLimitPolicy("ai"),
    ensureActiveFaceConsent,
    createCosmeticVisualizationController,
);
cosmeticVisualizationRoutes.get(
    "/cosmetic-visualizations/:visualizationId",
    requireAuth,
    getCosmeticVisualizationController,
);
cosmeticVisualizationRoutes.get(
    "/cosmetic-visualizations/:visualizationId/image",
    requireAuth,
    getCosmeticVisualizationImageController,
);
cosmeticVisualizationRoutes.delete(
    "/cosmetic-visualizations/:visualizationId/consent",
    requireAuth,
    revokeCosmeticVisualizationConsentController,
);
cosmeticVisualizationRoutes.put(
    "/cosmetic-visualizations/:visualizationId/feedback",
    requireAuth,
    putCosmeticVisualizationFeedbackController,
);

