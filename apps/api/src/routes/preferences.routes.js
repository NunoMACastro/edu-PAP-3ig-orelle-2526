/**
 * Rotas de preferencias.
 *
 * Prefixo montado em `app.js`: `/api/preferences`.
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    getMyPreferencesController,
    updateMyPreferencesController,
} from "../controllers/preferences.controller.js";

/**
 * Router Express dos endpoints de preferencias do utilizador.
 *
 * @type {import("express").Router}
 */
export const preferencesRoutes = Router();

preferencesRoutes.get("/me", requireAuth, getMyPreferencesController);
preferencesRoutes.put("/me", requireAuth, updateMyPreferencesController);
