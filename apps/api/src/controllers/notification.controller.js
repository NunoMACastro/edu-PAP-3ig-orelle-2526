/**
 * Controllers de notificacoes internas.
 */
import {
    createCampaignNotification,
    listAdminOrders,
    listMyNotifications,
    markMyNotificationAsRead,
    updateOrderStatusAndNotify,
} from "../services/notification.service.js";
import {
    validateCampaignNotificationInput,
    validateNotificationIdParam,
    validateOrderIdParam,
    validateOrderStatusNotificationInput,
} from "../validators/notification.validator.js";

/**
 * Lista encomendas recentes com o proximo passo logistico permitido.
 *
 * @param {import("express").Request} req - Pedido administrativo autenticado.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 minimizada.
 */
export async function listAdminOrdersController(req, res, next) {
    try {
        const orders = await listAdminOrders();
        return res.status(200).json({ orders });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista as notificações do utilizador autenticado.
 *
 * @param {import("express").Request} req - Pedido com `req.user.id` definido pela sessão.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com notificações próprias.
 */
export async function listMyNotificationsController(req, res, next) {
    try {
        // O userId vem da sessão para impedir leitura de notificações de outro cliente.
        const notifications = await listMyNotifications(req.user.id);
        return res.status(200).json({ notifications });
    } catch (err) {
        return next(err);
    }
}

/**
 * Marca uma notificação própria como lida.
 *
 * @param {import("express").Request} req - Pedido com params e sessão autenticada.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a notificação atualizada.
 */
export async function markMyNotificationAsReadController(req, res, next) {
    try {
        const { notificationId } = validateNotificationIdParam(req.params);
        const notification = await markMyNotificationAsRead(req.user.id, notificationId);
        return res.status(200).json({ notification });
    } catch (err) {
        return next(err);
    }
}

/**
 * Cria uma campanha interna para a role alvo escolhida por admin.
 *
 * @param {import("express").Request} req - Pedido admin com body validado no backend.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com resumo da campanha.
 */
export async function createCampaignNotificationController(req, res, next) {
    try {
        // A validação backend impede campanhas com tipo ou role fora do contrato.
        const input = validateCampaignNotificationInput(req.body);
        const result = await createCampaignNotification(input);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza o estado logístico de uma encomenda e notifica o cliente.
 *
 * @param {import("express").Request} req - Pedido admin com `orderId` e novo estado.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com resultado da atualização.
 */
export async function updateOrderStatusAndNotifyController(req, res, next) {
    try {
        const { orderId } = validateOrderIdParam(req.params);
        const { status } = validateOrderStatusNotificationInput(req.body);
        const result = await updateOrderStatusAndNotify(orderId, status);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
