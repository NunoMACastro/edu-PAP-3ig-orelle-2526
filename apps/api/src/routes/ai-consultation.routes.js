/** Rotas canónicas da consulta cosmética OpenAI v2. */
import { Router } from "express";
import {
    answerAiConsultationQuestionController,
    beginAiConsultationAnalysisController,
    cancelAiConsultationSessionController,
    createAiConsultationSessionController,
    editAiConsultationAnswerController,
    getAiConsultationCapabilitiesController,
    getAiConsultationSessionController,
    getCurrentAiConsultationSessionController,
    listAiConsultationGoalsController,
    listAiConsultationSessionsController,
    retryAiConsultationOperationController,
    submitAiConsultationSessionController,
} from "../controllers/ai-consultation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { useRateLimitPolicy } from "../middlewares/rate-limit.middleware.js";

export const aiConsultationRoutes = Router();

aiConsultationRoutes.get(
    "/ai-consultation/capabilities",
    getAiConsultationCapabilitiesController,
);
aiConsultationRoutes.get(
    "/ai-consultation/goals",
    listAiConsultationGoalsController,
);
aiConsultationRoutes.post(
    "/ai-consultation/sessions",
    requireAuth,
    useRateLimitPolicy("ai"),
    createAiConsultationSessionController,
);
aiConsultationRoutes.get(
    "/ai-consultation/sessions",
    requireAuth,
    listAiConsultationSessionsController,
);
aiConsultationRoutes.get(
    "/ai-consultation/sessions/current",
    requireAuth,
    getCurrentAiConsultationSessionController,
);
aiConsultationRoutes.get(
    "/ai-consultation/sessions/:sessionId",
    requireAuth,
    getAiConsultationSessionController,
);
aiConsultationRoutes.patch(
    "/ai-consultation/sessions/:sessionId/answers/:slotCode",
    requireAuth,
    useRateLimitPolicy("ai"),
    editAiConsultationAnswerController,
);
aiConsultationRoutes.post(
    "/ai-consultation/sessions/:sessionId/analysis",
    requireAuth,
    useRateLimitPolicy("ai"),
    beginAiConsultationAnalysisController,
);
aiConsultationRoutes.post(
    "/ai-consultation/sessions/:sessionId/answers",
    requireAuth,
    useRateLimitPolicy("ai"),
    answerAiConsultationQuestionController,
);
aiConsultationRoutes.post(
    "/ai-consultation/sessions/:sessionId/submit",
    requireAuth,
    useRateLimitPolicy("ai"),
    submitAiConsultationSessionController,
);
aiConsultationRoutes.post(
    "/ai-consultation/sessions/:sessionId/retry",
    requireAuth,
    useRateLimitPolicy("ai"),
    retryAiConsultationOperationController,
);
aiConsultationRoutes.delete(
    "/ai-consultation/sessions/:sessionId",
    requireAuth,
    cancelAiConsultationSessionController,
);
