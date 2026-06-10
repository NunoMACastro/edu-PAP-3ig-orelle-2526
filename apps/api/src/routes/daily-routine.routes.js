import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    generateDailyRoutineController,
    getMyDailyRoutineController,
} from "../controllers/daily-routine.controller.js";

export const dailyRoutineRoutes = Router();

dailyRoutineRoutes.get("/me/daily-routine", requireAuth, getMyDailyRoutineController);
dailyRoutineRoutes.post(
    "/me/daily-routine/generate",
    requireAuth,
    generateDailyRoutineController,
);