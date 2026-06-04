import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { createProductController } from "../controllers/admin-products.controller.js";

export const adminProductsRoutes = Router();

adminProductsRoutes.post(
    "/products",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createProductController,
);