// apps/api/src/routes/face-photo.routes.js
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
export const facePhotoRoutes = Router(); // 1º Criamos o router


/**
 * Rota para aceitar o consentimento de análise facial.
 */
facePhotoRoutes.post(
    "/face-consent",
    requireAuth,
    acceptFaceConsentController,
);

/**
 * Rota para fazer upload das fotografias faciais.
 */
facePhotoRoutes.post(
    "/face-photos",
    requireAuth,
    ensureActiveFaceConsent,
    uploadFacePhotos,
    uploadFacePhotosController,
);