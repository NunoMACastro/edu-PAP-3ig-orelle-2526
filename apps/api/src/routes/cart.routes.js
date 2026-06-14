import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    addCartItemController,
    getMyCartController,
    removeCartItemController,
    updateCartItemController,
} from "../controllers/cart.controller.js";

/**
 * Rotas autenticadas de gestão do carrinho pessoal.
 */
export const cartRoutes = Router();

cartRoutes.get("/cart", requireAuth, getMyCartController);
cartRoutes.post("/cart/items", requireAuth, addCartItemController);
cartRoutes.patch("/cart/items/:productId", requireAuth, updateCartItemController);
cartRoutes.delete("/cart/items/:productId", requireAuth, removeCartItemController);