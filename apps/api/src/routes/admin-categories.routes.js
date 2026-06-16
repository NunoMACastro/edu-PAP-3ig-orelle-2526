/**
 * Rotas administrativas de categorias.
 *
 * Prefixo montado em `app.js`: `/api/admin`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    assignProductCategoriesController,
    createCategoryController,
    listCategoriesController,
} from "../controllers/admin-categories.controller.js";

/**
 * Router Express de categorias administradas.
 *
 * @type {import("express").Router}
 */
export const adminCategoriesRoutes = Router();

adminCategoriesRoutes.get(
    "/categories",
    requireAuth,
    requireRole(ROLES.ADMIN),
    listCategoriesController,
);

adminCategoriesRoutes.post(
    "/categories",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createCategoryController,
);

adminCategoriesRoutes.patch(
    "/products/:productId/categories",
    requireAuth,
    requireRole(ROLES.ADMIN),
    assignProductCategoriesController,
);
