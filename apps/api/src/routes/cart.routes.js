/**
 * Rotas do carrinho autenticado.
 */
import { Router } from "express";
import {
    addItemToCartController,
    getMyCartController,
    removeCartItemController,
    updateCartItemQuantityController,
} from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de carrinho.
 *
 * @type {import("express").Router}
 */
export const cartRoutes = Router();

cartRoutes.get("/cart", requireAuth, getMyCartController);
cartRoutes.post("/cart/items", requireAuth, addItemToCartController);
cartRoutes.patch(
    "/cart/items/:productId",
    requireAuth,
    updateCartItemQuantityController,
);
cartRoutes.delete("/cart/items/:productId", requireAuth, removeCartItemController);
