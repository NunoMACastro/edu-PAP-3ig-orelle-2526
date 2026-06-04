import { Router } from "express";
import { listCatalogProductsController } from "../controllers/catalog.controller.js";

export const catalogRoutes = Router();

catalogRoutes.get("/products", listCatalogProductsController);