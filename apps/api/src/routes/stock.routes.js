// server/src/routes/stock.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    listLowStockProductsController,
    updateProductStockController,
} from "../controllers/stock.controller.js";

/**
 * Rotas administrativas de alertas e ajuste manual de stock.
 */
export const stockRoutes = Router();

stockRoutes.get("/admin/stock/alerts", requireAuth, requireRole("administrador"), listLowStockProductsController);
stockRoutes.patch("/admin/products/:productId/stock", requireAuth, requireRole("administrador"), updateProductStockController);