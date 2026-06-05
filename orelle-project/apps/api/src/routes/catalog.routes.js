import { Router } from "express";
import { listCatalogProductsController } from "../controllers/catalog.controller.js";
import { getProductDetailsController } from "../controllers/product-details.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import {
    createProductReviewController,
    listProductReviewsController,
} from "../controllers/review.controller.js";
import { listRelatedProductsController } from "../controllers/related-products.controller.js";


export const catalogRoutes = Router();

catalogRoutes.get("/products", listCatalogProductsController);
catalogRoutes.get("/products/:productId", getProductDetailsController);
catalogRoutes.get(
    "/products/:productId/reviews",
    listProductReviewsController,
);
catalogRoutes.get(
    "/products/:productId/related",
    listRelatedProductsController,
);
catalogRoutes.post(
    "/products/:productId/reviews",
    requireAuth,
    requireRole(ROLES.CLIENTE),
    createProductReviewController,
);