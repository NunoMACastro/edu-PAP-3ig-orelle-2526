import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createMyProfileController,
    getMyProfileController,
    updateMyProfileController,
    updateMyProfilePhotoController,
} from "../controllers/profile.controller.js";

export const profileRoutes = Router();

profileRoutes.get("/me", requireAuth, getMyProfileController);
profileRoutes.post("/me", requireAuth, createMyProfileController);
profileRoutes.put("/me", requireAuth, updateMyProfileController);
profileRoutes.patch("/me/photo", requireAuth, updateMyProfilePhotoController);