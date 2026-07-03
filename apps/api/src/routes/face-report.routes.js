/**
 * Rotas de relatorio facial personalizado.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { generateLatestFaceReportController } from "../controllers/face-report.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de relatorios faciais.
 *
 * @type {import("express").Router}
 */
export const faceReportRoutes = Router();

faceReportRoutes.post(
    "/face-reports/latest",
    requireAuth,
    generateLatestFaceReportController,
);
