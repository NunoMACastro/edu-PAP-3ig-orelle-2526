import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    ensureActiveFaceConsent,
    uploadFacePhotos,
} from "../middlewares/face-photo-upload.middleware.js";
import {
    acceptFaceConsentController,
    uploadFacePhotosController,
} from "../controllers/face-photo.controller.js";

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