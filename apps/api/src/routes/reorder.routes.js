/**
 * Rotas de recompra.
 */
import { Router } from "express";
import { reorderController } from "../controllers/reorder.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de recompra.
 *
 * @type {import("express").Router}
 */
export const reorderRoutes = Router();

reorderRoutes.post("/me/orders/:orderId/reorder", requireAuth, reorderController);
