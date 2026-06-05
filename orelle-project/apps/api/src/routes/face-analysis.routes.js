import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createFaceAnalysisController } from "../controllers/face-analysis.controller.js";

export const faceAnalysisRoutes = Router();

faceAnalysisRoutes.post(
    "/face-analyses",
    requireAuth,
    createFaceAnalysisController,
);