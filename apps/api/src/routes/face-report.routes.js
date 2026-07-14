/**
 * Rotas de relatorio facial personalizado.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    getFaceReportController,
    finalizeFaceReportController,
    requestFaceReportReviewController,
    cancelFaceReportReviewController,
    revokeFaceReportPhotoAccessController,
    unlockFaceReportController,
} from "../controllers/face-report.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de relatorios faciais.
 *
 * @type {import("express").Router}
 */
export const faceReportRoutes = Router();

faceReportRoutes.post(
    "/face-reports/:reportId/review-request",
    requireAuth,
    requestFaceReportReviewController,
);

faceReportRoutes.delete(
    "/face-reports/:reportId/review-request",
    requireAuth,
    cancelFaceReportReviewController,
);

faceReportRoutes.delete(
    "/face-reports/:reportId/review-photo-access",
    requireAuth,
    revokeFaceReportPhotoAccessController,
);

faceReportRoutes.get(
    "/face-reports/:reportId",
    requireAuth,
    getFaceReportController,
);

faceReportRoutes.post(
    "/face-reports/:reportId/finalize",
    requireAuth,
    finalizeFaceReportController,
);

faceReportRoutes.post(
    "/face-reports/:reportId/unlock/simulate-payment",
    requireAuth,
    unlockFaceReportController,
);
