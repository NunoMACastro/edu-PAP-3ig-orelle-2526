/**
 * Validadores de notificacoes internas.
 */
import mongoose from "mongoose";
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_VALUES,
    ORDER_STATUS,
} from "../constants/domain.constants.js";
import { ROLES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida campanha admin de notificacoes internas.
 *
 * @function validateCampaignNotificationInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{type: string, title: string, message: string, targetRole: string}} Dados normalizados.
 * @throws {AppError} Quando algum campo da campanha nao cumpre as regras aceites.
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
 * @throws {AppError} Quando o identificador nao e um ObjectId valido.
 */
export function validateNotificationIdParam(params) {
    const notificationId = String(params?.notificationId ?? "");

    if (!mongoose.isValidObjectId(notificationId)) {
        throw new AppError(400, "ID de notificacao invalido");
    }

    return { notificationId };
}

/**
 * Valida o identificador opaco de uma encomenda antes de consultar a BD.
 *
 * @param {Record<string, unknown>} params - Parametros da rota administrativa.
 * @returns {{orderId: string}} Identificador normalizado.
 * @throws {AppError} Quando o valor nao e um ObjectId MongoDB valido.
 */
export function validateOrderIdParam(params) {
    const orderId = String(params?.orderId ?? "");

    if (!mongoose.isValidObjectId(orderId)) {
        throw new AppError(400, "ID de encomenda invalido");
    }

    return { orderId };
}

/**
 * Valida estado logistico para notificacao transacional.
 *
 * @function validateOrderStatusNotificationInput
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @returns {{status: string}} Estado validado.
 * @throws {AppError} Quando o estado logistico nao pertence aos valores aceites.
 */
export function validateOrderStatusNotificationInput(body) {
    const status = String(body?.status ?? "").trim();

    if (![ORDER_STATUS.ENVIADO, ORDER_STATUS.ENTREGUE].includes(status)) {
        throw new AppError(400, "Estado de encomenda invalido");
    }

    return { status };
}

export { NOTIFICATION_TYPE_VALUES };
