import { Router } from "express";
import { registerController } from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", registerController);