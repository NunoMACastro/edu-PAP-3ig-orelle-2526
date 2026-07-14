/**
 * Rotas do historico seguro da interacao cliente-IA.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { getMyAiInteractionHistoryController } from "../controllers/ai-interaction-history.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express do historico IA.
 *
 * @type {import("express").Router}
 */
export const aiInteractionHistoryRoutes = Router();

// A escrita do historico fica em services internos; o browser apenas consulta a propria timeline.
aiInteractionHistoryRoutes.get(
    "/me/ai-interactions",
    requireAuth,
    getMyAiInteractionHistoryController,
);
