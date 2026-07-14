/**
 * Rotas de autenticacao.
 *
 * Prefixo montado em `app.js`: `/api/auth`.
 */
import { Router } from "express";
import {
    csrfController,
    loginController,
    logoutAllController,
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
authRoutes.get("/csrf", requireAuth, csrfController);
authRoutes.post("/logout", requireAuth, logoutController);
authRoutes.post("/logout-all", requireAuth, logoutAllController);
authRoutes.get("/me", requireAuth, meController);
