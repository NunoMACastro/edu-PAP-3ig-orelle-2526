/**
 * Rotas de notificacoes internas.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    createCampaignNotificationController,
    listMyNotificationsController,
    markMyNotificationAsReadController,
    updateOrderStatusAndNotifyController,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const notificationRoutes = Router();

notificationRoutes.get(
    "/me/notifications",
    requireAuth,
    listMyNotificationsController,
);

notificationRoutes.patch(
    "/me/notifications/:notificationId/read",
    requireAuth,
    markMyNotificationAsReadController,
);

notificationRoutes.post(
    "/admin/notifications/campaigns",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createCampaignNotificationController,
);

notificationRoutes.patch(
    "/admin/orders/:orderId/status",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateOrderStatusAndNotifyController,
);
