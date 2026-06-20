/**
 * Rotas administrativas de stock.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    listLowStockProductsController,
    updateProductStockController,
} from "../controllers/stock.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express de stock admin.
 *
 * @type {import("express").Router}
 */
export const stockRoutes = Router();

stockRoutes.get(
    "/stock/alerts",
    requireAuth,
    requireRole(ROLES.ADMIN),
    listLowStockProductsController,
);

stockRoutes.patch(
    "/products/:productId/stock",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateProductStockController,
);
