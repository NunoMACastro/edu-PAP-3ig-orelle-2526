import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { generateLatestFaceReportController } from "../controllers/face-report.controller.js";

export const faceReportRoutes = Router();

faceReportRoutes.post(
    "/face-reports/latest",
    requireAuth,
    generateLatestFaceReportController,
);