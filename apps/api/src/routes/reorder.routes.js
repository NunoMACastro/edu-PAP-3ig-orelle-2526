import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { reorderController } from "../controllers/reorder.controller.js";

/**
 * Rotas autenticadas para recompra de encomendas pessoais.
 */
export const reorderRoutes = Router();

reorderRoutes.post("/me/orders/:orderId/reorder", requireAuth, reorderController);