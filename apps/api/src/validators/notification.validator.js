/**
 * Validadores de notificacoes internas.
 */
import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_VALUES,
} from "../models/notification.model.js";

/**
 * Valida campanha admin de notificacoes internas.
 *
 * @function validateCampaignNotificationInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{type: string, title: string, message: string, targetRole: string}} Dados normalizados.
 */
export function validateCampaignNotificationInput(body) {
    const input = {
        type: String(body?.type ?? "").trim(),
        title: String(body?.title ?? "").trim(),
        message: String(body?.message ?? "").trim(),
        targetRole: String(body?.targetRole ?? ROLES.CLIENTE).trim(),
    };
    const errors = {};

    if (![NOTIFICATION_TYPES.PROMOTION, NOTIFICATION_TYPES.NEW_PRODUCT].includes(input.type)) {
        errors.type = "Campanha deve ser promotion ou new_product";
    }

    if (input.title.length < 3 || input.title.length > 120) {
        errors.title = "Titulo deve ter entre 3 e 120 caracteres";
    }

    if (input.message.length < 5 || input.message.length > 500) {
        errors.message = "Mensagem deve ter entre 5 e 500 caracteres";
    }

    if (!Object.values(ROLES).includes(input.targetRole)) {
        errors.targetRole = "Role alvo invalida";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de campanha invalidos", errors);
    }

    return input;
}

/**
 * Valida identificador de notificacao.
 *
 * @function validateNotificationIdParam
 * @param {Record<string, unknown>} params - Parametros da rota.
 * @returns {{notificationId: string}} ID normalizado.
 */
export function validateNotificationIdParam(params) {
    const notificationId = String(params?.notificationId ?? "");

    if (!mongoose.isValidObjectId(notificationId)) {
        throw new AppError(400, "ID de notificacao invalido");
    }

    return { notificationId };
}

/**
 * Valida estado logistico para notificacao transacional.
 *
 * @function validateOrderStatusNotificationInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{status: string}} Estado validado.
 */
export function validateOrderStatusNotificationInput(body) {
    const status = String(body?.status ?? "").trim();

    if (!["pendente", "enviado", "entregue"].includes(status)) {
        throw new AppError(400, "Estado de encomenda invalido");
    }

    return { status };
}

export { NOTIFICATION_TYPE_VALUES };
