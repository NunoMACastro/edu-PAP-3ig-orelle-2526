import { Router } from "express";
import { listCatalogProductsController } from "../controllers/catalog.controller.js";
import { getProductDetailsController } from "../controllers/product-details.controller.js";

export const catalogRoutes = Router();

catalogRoutes.get("/products", listCatalogProductsController);
catalogRoutes.get("/products/:productId", getProductDetailsController);