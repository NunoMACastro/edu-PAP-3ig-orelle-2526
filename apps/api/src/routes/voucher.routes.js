/**
 * Rotas de vouchers academicos.
 */
import { Router } from "express";
import { listMyVouchersController } from "../controllers/voucher.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const voucherRoutes = Router();

voucherRoutes.get("/me/vouchers", requireAuth, listMyVouchersController);
