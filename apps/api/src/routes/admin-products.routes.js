/**
 * Rotas administrativas de produtos.
 *
 * Prefixo montado em `app.js`: `/api/admin`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    createProductController,
    listAdminProductsController,
    updateProductAiMetadataController,
} from "../controllers/admin-products.controller.js";

/**
 * Router Express de produtos administrados.
 *
 * @type {import("express").Router}
 */
export const adminProductsRoutes = Router();

adminProductsRoutes.get(
    "/products",
    requireAuth,
    requireRole(ROLES.ADMIN),
    listAdminProductsController,
);

adminProductsRoutes.post(
    "/products",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createProductController,
);

adminProductsRoutes.patch(
    "/products/:productId/ai-metadata",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateProductAiMetadataController,
);
