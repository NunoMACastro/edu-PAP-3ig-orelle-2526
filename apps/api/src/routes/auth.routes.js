/**
 * Rotas de autenticacao.
 *
 * Prefixo montado em `app.js`: `/api/auth`.
 */
import { Router } from "express";
import {
    loginController,
    logoutController,
    meController,
    registerController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express dos endpoints de autenticacao.
 *
 * @type {import("express").Router}
 */
export const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/logout", logoutController);
authRoutes.get("/me", requireAuth, meController);
