/**
 * Rotas da comparacao temporal de pele.
 */
import { Router } from "express";
import { createSkinComparisonController } from "../controllers/skin-comparison.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de comparacoes temporais.
 *
 * @type {import("express").Router}
 */
export const skinComparisonRoutes = Router();

skinComparisonRoutes.post(
    "/me/skin-comparisons",
    requireAuth,
    createSkinComparisonController,
);
