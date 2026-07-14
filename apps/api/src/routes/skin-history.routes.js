/**
 * Rotas de historico pessoal de pele.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { getMySkinHistoryController } from "../controllers/skin-history.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de historico pessoal.
 *
 * @type {import("express").Router}
 */
export const skinHistoryRoutes = Router();

skinHistoryRoutes.get(
    "/me/skin-history",
    requireAuth,
    getMySkinHistoryController,
);
