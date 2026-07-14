/**
 * Rotas de consentimento e upload facial.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    acceptFaceConsentController,
    getFaceConsentController,
    revokeFaceConsentController,
    uploadFacePhotosController,
} from "../controllers/face-photo.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    ensureActiveFaceConsent,
    uploadFacePhotos,
} from "../middlewares/face-photo-upload.middleware.js";
import { useRateLimitPolicy } from "../middlewares/rate-limit.middleware.js";

/**
 * Router Express de fotografias faciais.
 *
 * @type {import("express").Router}
 */
export const facePhotoRoutes = Router();

facePhotoRoutes.get(
    "/face-consent",
    requireAuth,
    getFaceConsentController,
);

facePhotoRoutes.post(
    "/face-consent",
    requireAuth,
    acceptFaceConsentController,
);

facePhotoRoutes.delete(
    "/face-consent",
    requireAuth,
    revokeFaceConsentController,
);

facePhotoRoutes.post(
    "/face-photos",
    requireAuth,
    useRateLimitPolicy("upload"),
    ensureActiveFaceConsent,
    uploadFacePhotos,
    uploadFacePhotosController,
);
