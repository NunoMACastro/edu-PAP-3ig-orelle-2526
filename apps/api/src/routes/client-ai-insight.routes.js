/**
 * Rotas dos insights públicos do consultor visíveis ao cliente.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { listMyClientAiInsightsController } from "../controllers/client-ai-insight.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express para o endpoint RF46.
 *
 * @type {import("express").Router}
 */
export const clientAiInsightRoutes = Router();

clientAiInsightRoutes.get(
    "/me/ai-consultation-insights",
    requireAuth,
    listMyClientAiInsightsController,
);
