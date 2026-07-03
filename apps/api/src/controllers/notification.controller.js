/**
 * Controllers de notificacoes internas.
 */
import {
    createCampaignNotification,
    listMyNotifications,
    markMyNotificationAsRead,
    updateOrderStatusAndNotify,
} from "../services/notification.service.js";
import {
    validateCampaignNotificationInput,
    validateNotificationIdParam,
    validateOrderStatusNotificationInput,
} from "../validators/notification.validator.js";

export async function listMyNotificationsController(req, res, next) {
    try {
        const notifications = await listMyNotifications(req.user.id);
        return res.status(200).json({ notifications });
    } catch (err) {
        return next(err);
    }
}

export async function markMyNotificationAsReadController(req, res, next) {
    try {
        const { notificationId } = validateNotificationIdParam(req.params);
        const notification = await markMyNotificationAsRead(req.user.id, notificationId);
        return res.status(200).json({ notification });
    } catch (err) {
        return next(err);
    }
}

export async function createCampaignNotificationController(req, res, next) {
    try {
        const input = validateCampaignNotificationInput(req.body);
        const result = await createCampaignNotification(input);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function updateOrderStatusAndNotifyController(req, res, next) {
    try {
        const { status } = validateOrderStatusNotificationInput(req.body);
        const result = await updateOrderStatusAndNotify(req.params.orderId, status);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
