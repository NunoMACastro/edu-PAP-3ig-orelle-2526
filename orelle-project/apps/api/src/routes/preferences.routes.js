import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    getMyPreferencesController,
    updateMyPreferencesController,
} from "../controllers/preferences.controller.js";

export const preferencesRoutes = Router();

preferencesRoutes.get("/me", requireAuth, getMyPreferencesController);
preferencesRoutes.put("/me", requireAuth, updateMyPreferencesController);