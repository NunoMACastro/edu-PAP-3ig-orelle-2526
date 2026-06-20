/**
 * Rotas de analise facial da MF1.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { createFaceAnalysisController } from "../controllers/face-analysis.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de analises faciais.
 *
 * @type {import("express").Router}
 */
export const faceAnalysisRoutes = Router();

faceAnalysisRoutes.post(
    "/face-analyses",
    requireAuth,
    createFaceAnalysisController,
);
