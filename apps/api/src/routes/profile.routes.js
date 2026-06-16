/**
 * Rotas de perfil.
 *
 * Prefixo montado em `app.js`: `/api/profile`.
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createMyProfileController,
    getMyProfileController,
    updateMyProfileController,
    updateMyProfilePhotoController,
} from "../controllers/profile.controller.js";

/**
 * Router Express dos endpoints de perfil do utilizador autenticado.
 *
 * @type {import("express").Router}
 */
export const profileRoutes = Router();

profileRoutes.get("/me", requireAuth, getMyProfileController);
profileRoutes.post("/me", requireAuth, createMyProfileController);
profileRoutes.put("/me", requireAuth, updateMyProfileController);
profileRoutes.patch("/me/photo", requireAuth, updateMyProfilePhotoController);
