/**
 * Rotas administrativas de produtos.
 *
 * Prefixo montado em `app.js`: `/api/admin`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { createProductController } from "../controllers/admin-products.controller.js";

/**
 * Router Express de produtos administrados.
 *
 * @type {import("express").Router}
 */
export const adminProductsRoutes = Router();

adminProductsRoutes.post(
    "/products",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createProductController,
);
