import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkoutController } from "../controllers/order.controller.js";

/**
 * Rotas autenticadas para checkout de encomendas.
 */
export const orderRoutes = Router();

orderRoutes.post("/orders/checkout", requireAuth, checkoutController);