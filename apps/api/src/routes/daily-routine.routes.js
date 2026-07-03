/**
 * Rotas de rotina diaria da MF2.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    generateDailyRoutineController,
    getDailyRoutineController,
} from "../controllers/daily-routine.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const dailyRoutineRoutes = Router();

dailyRoutineRoutes.post(
    "/me/daily-routine/generate",
    requireAuth,
    generateDailyRoutineController,
);

dailyRoutineRoutes.get(
    "/me/daily-routine",
    requireAuth,
    getDailyRoutineController,
);
