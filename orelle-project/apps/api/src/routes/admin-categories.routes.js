import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    assignProductCategoriesController,
    createCategoryController,
} from "../controllers/admin-categories.controller.js";

export const adminCategoriesRoutes = Router();

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