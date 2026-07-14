/**
 * Rotas de checkout e historico de encomendas.
 */
import { Router } from "express";
import {
    checkoutController,
    listMyOrdersController,
    simulateOrderPaymentController,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de encomendas.
 *
 * @type {import("express").Router}
 */
export const orderRoutes = Router();

orderRoutes.post("/orders/checkout", requireAuth, checkoutController);
orderRoutes.post(
    "/orders/:orderId/payments/simulate",
    requireAuth,
    simulateOrderPaymentController,
);
orderRoutes.get("/me/orders", requireAuth, listMyOrdersController);
