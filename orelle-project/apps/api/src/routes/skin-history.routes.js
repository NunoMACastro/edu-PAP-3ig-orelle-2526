import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMySkinHistoryController } from "../controllers/skin-history.controller.js";

export const skinHistoryRoutes = Router();

skinHistoryRoutes.get(
    "/me/skin-history",
    requireAuth,
    getMySkinHistoryController,
);