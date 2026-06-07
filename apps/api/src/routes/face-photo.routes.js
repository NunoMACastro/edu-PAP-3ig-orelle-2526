/**
 * Rotas de consentimento e upload facial.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    acceptFaceConsentController,
    uploadFacePhotosController,
} from "../controllers/face-photo.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    ensureActiveFaceConsent,
    uploadFacePhotos,
} from "../middlewares/face-photo-upload.middleware.js";

/**
 * Router Express de fotografias faciais.
 *
 * @type {import("express").Router}
 */
export const facePhotoRoutes = Router();

facePhotoRoutes.post(
    "/face-consent",
    requireAuth,
    acceptFaceConsentController,
);

facePhotoRoutes.post(
    "/face-photos",
    requireAuth,
    ensureActiveFaceConsent,
    uploadFacePhotos,
    uploadFacePhotosController,
);
