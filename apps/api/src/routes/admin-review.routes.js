// apps/api/src/routes/admin-review.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    listAdminReviewsController,
    moderateReviewController,
} from "../controllers/admin-review.controller.js";

/**
 * Router Express para moderação administrativa de reviews.
 *
 * @type {import("express").Router}
 */
export const adminReviewRoutes = Router();

adminReviewRoutes.get("/reviews", requireAuth, requireRole(ROLES.ADMIN), listAdminReviewsController);
adminReviewRoutes.patch("/reviews/:reviewId", requireAuth, requireRole(ROLES.ADMIN), moderateReviewController);