/**
 * Service de notificacoes internas da MF4.
 */
import { ROLES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    Notification,
    NOTIFICATION_TYPES,
} from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Converte notificacao para DTO seguro.
 *
 * @function toNotificationDto
 * @param {object} notification - Documento Mongoose ou mock equivalente.
 * @returns {object} Notificacao do proprio utilizador.
 */
export function toNotificationDto(notification) {
    return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        readAt: notification.readAt ?? null,
        metadata: Object.fromEntries(notification.metadata ?? []),
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
    };
}

/**
 * Lista notificacoes do utilizador autenticado.
 *
 * @async
 * @function listMyNotifications
 * @param {string} userId - ID da sessao.
 * @returns {Promise<object[]>} Notificacoes proprias.
 */
export async function listMyNotifications(userId) {
    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

    return notifications.map(toNotificationDto);
}

/**
 * Marca notificacao propria como lida.
 *
 * @async
 * @function markMyNotificationAsRead
 * @param {string} userId - ID da sessao.
 * @param {string} notificationId - ID da notificacao.
 * @returns {Promise<object>} Notificacao atualizada.
 */
export async function markMyNotificationAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true, runValidators: true },
    );

    if (!notification) {
        throw new AppError(404, "Notificação não encontrada");
    }

    return toNotificationDto(notification);
}

/**
 * Cria campanha interna para utilizadores de uma role.
 *
 * @async
 * @function createCampaignNotification
 * @param {{type: string, title: string, message: string, targetRole: string}} input - Campanha validada.
 * @returns {Promise<{createdCount: number}>} Numero de notificacoes criadas.
 */
export async function createCampaignNotification(input) {
    const users = await User.find({
        role: input.targetRole ?? ROLES.CLIENTE,
        isActive: { $ne: false },
    })
        .select("_id")
        .limit(500);

    if (users.length === 0) {
        return { createdCount: 0 };
    }

    await Notification.insertMany(
        users.map((user) => ({
            userId: user._id,
            type: input.type,
            title: input.title,
            message: input.message,
            metadata: { source: "admin_campaign" },
        })),
    );

    return { createdCount: users.length };
}

/**
 * Cria notificacao minimizada de estado de encomenda.
 *
 * @async
 * @function createOrderStatusNotification
 * @param {object} order - Encomenda atualizada.
 * @returns {Promise<object>} Notificacao criada.
 */
export async function createOrderStatusNotification(order) {
    return Notification.create({
        userId: order.userId,
        type: NOTIFICATION_TYPES.ORDER_STATUS,
        title: "Estado da encomenda atualizado",
        message: `A tua encomenda passou para o estado ${order.status}.`,
        metadata: {
            orderId: order._id.toString(),
            status: order.status,
        },
    });
}

/**
 * Atualiza estado logistico e emite notificacao transacional.
 *
 * @async
 * @function updateOrderStatusAndNotify
 * @param {string} orderId - Encomenda alvo.
 * @param {string} status - Novo estado logistico.
 * @returns {Promise<{order: object, notification: object}>} Resultado minimizado.
 */
export async function updateOrderStatusAndNotify(orderId, status) {
    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true },
    );

    if (!order) {
        throw new AppError(404, "Encomenda não encontrada");
    }

    const notification = await createOrderStatusNotification(order);

    return {
        order: {
            id: order._id.toString(),
            status: order.status,
            updatedAt: order.updatedAt,
        },
        notification: toNotificationDto(notification),
    };
}
