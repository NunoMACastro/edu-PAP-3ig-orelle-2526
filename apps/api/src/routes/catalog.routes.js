/**
 * Rotas publicas de catalogo da MF1.
 *
 * Prefixo montado em `app.js`: `/api/catalog`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { listCatalogProductsController } from "../controllers/catalog.controller.js";
import { getProductDetailsController } from "../controllers/product-details.controller.js";
import { listRelatedProductsController } from "../controllers/related-products.controller.js";
import {
    createProductReviewController,
    listProductReviewsController,
} from "../controllers/review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express do catalogo publico.
 *
 * @type {import("express").Router}
 */
export const catalogRoutes = Router();

catalogRoutes.get("/products", listCatalogProductsController);
catalogRoutes.get("/products/:productId", getProductDetailsController);
catalogRoutes.get(
    "/products/:productId/related",
    listRelatedProductsController,
);
catalogRoutes.get(
    "/products/:productId/reviews",
    listProductReviewsController,
);
catalogRoutes.post(
    "/products/:productId/reviews",
    requireAuth,
    requireRole(ROLES.CLIENTE),
    createProductReviewController,
);
