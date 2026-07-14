/**
 * Service de notificacoes internas da MF4.
 */
import mongoose from "mongoose";
import {
    NOTIFICATION_TYPES,
    ORDER_STATUS,
    PAYMENT_STATUS,
} from "../constants/domain.constants.js";
import { ROLES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { Notification } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Resolve a unica transicao logistica permitida pelo contrato simulado.
 *
 * @param {object} order - Encomenda persistida ou equivalente de teste.
 * @returns {string|null} Proximo estado permitido, ou null quando terminal/bloqueada.
 */
export function getNextOrderStatus(order) {
    if (order.payment?.status !== PAYMENT_STATUS.SIMULATED_PAID) return null;

    return {
        [ORDER_STATUS.PENDENTE]: ORDER_STATUS.ENVIADO,
        [ORDER_STATUS.ENVIADO]: ORDER_STATUS.ENTREGUE,
    }[order.status] ?? null;
}

/**
 * Converte uma encomenda no resumo minimizado usado pela administracao.
 *
 * IDs de utilizador/produto, hashes de idempotencia e referencias internas nao
 * fazem parte do DTO. O ID da encomenda e conservado apenas como identificador
 * opaco da acao e nunca precisa de ser introduzido manualmente na interface.
 *
 * @param {object} order - Documento Mongoose, com `userId` opcionalmente populado.
 * @returns {object} Resumo administrativo seguro e acionavel.
 */
export function toAdminOrderDto(order) {
    const items = Array.isArray(order.items) ? order.items : [];

    return {
        id: order._id.toString(),
        customerEmail:
            order.userId && typeof order.userId === "object"
                ? order.userId.email ?? null
                : null,
        status: order.status,
        nextStatus: getNextOrderStatus(order),
        payment: {
            mode: order.payment?.mode ?? null,
            status: order.payment?.status ?? null,
        },
        totalCents: order.totalCents,
        itemCount: items.reduce(
            (total, item) => total + Number(item.quantity ?? 0),
            0,
        ),
        items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

/**
 * Lista as encomendas recentes para operacao administrativa local.
 *
 * @returns {Promise<object[]>} Ate 100 resumos, do mais recente para o mais antigo.
 */
export async function listAdminOrders() {
    const orders = await Order.find({})
        .select("userId items totalCents status payment createdAt updatedAt")
        .populate("userId", "email")
        .sort({ createdAt: -1 })
        .limit(100);

    return orders.map(toAdminOrderDto);
}

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
 * @throws {AppError} Quando a notificacao nao pertence ao utilizador.
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
 * @param {{session?: import("mongoose").ClientSession}} [options] - Sessão transacional opcional.
 * @returns {Promise<object>} Notificacao criada.
 */
export async function createOrderStatusNotification(order, { session } = {}) {
    const notification = new Notification({
        userId: order.userId,
        type: NOTIFICATION_TYPES.ORDER_STATUS,
        title: "Estado da encomenda atualizado",
        message: `A tua encomenda passou para o estado ${order.status}.`,
        metadata: {
            orderId: order._id.toString(),
            status: order.status,
        },
    });

    await notification.save({ session });
    return notification;
}

/**
 * Atualiza estado logistico e emite notificacao transacional.
 *
 * @async
 * @function updateOrderStatusAndNotify
 * @param {string} orderId - Encomenda alvo.
 * @param {string} status - Novo estado logistico.
 * @returns {Promise<{order: object, notification: object}>} Resultado minimizado.
 * @throws {AppError} Quando a encomenda alvo nao existe.
 */
export async function updateOrderStatusAndNotify(orderId, status) {
    const session = await mongoose.startSession();
    let response = null;

    try {
        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new AppError(404, "Encomenda não encontrada");
            }

            if (order.payment.status !== PAYMENT_STATUS.SIMULATED_PAID) {
                throw new AppError(
                    409,
                    "A logística só pode avançar após pagamento simulado concluído",
                );
            }

            const expectedNextStatus = getNextOrderStatus(order);

            if (status !== expectedNextStatus) {
                throw new AppError(
                    409,
                    "Transição logística inválida para o estado atual",
                );
            }

            order.status = status;
            await order.save({ session });
            const notification = await createOrderStatusNotification(order, {
                session,
            });

            response = {
                order: {
                    id: order._id.toString(),
                    status: order.status,
                    updatedAt: order.updatedAt,
                },
                notification: toNotificationDto(notification),
            };
        });

        return response;
    } finally {
        await session.endSession();
    }
}
