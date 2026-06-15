// server/src/routes/order-history.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listMyOrdersController } from "../controllers/order-history.controller.js";

/**
 * Rotas autenticadas para histórico pessoal de compras.
 */
export const orderHistoryRoutes = Router();

orderHistoryRoutes.get("/me/orders", requireAuth, listMyOrdersController);