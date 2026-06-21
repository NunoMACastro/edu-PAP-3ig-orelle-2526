import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateCampaignNotificationInput } from "../src/validators/notification.validator.js";
import {
    createOrderStatusNotification,
    markMyNotificationAsRead,
} from "../src/services/notification.service.js";
import {
    Notification,
    NOTIFICATION_TYPES,
} from "../src/models/notification.model.js";
import { Order, ORDER_STATUS } from "../src/models/order.model.js";

// Mockamos apenas as operações usadas pelo service para manter o teste focado.
vi.mock("../src/models/notification.model.js", () => ({
    NOTIFICATION_TYPES: Object.freeze({
        PROMOTION: "promotion",
        NEW_PRODUCT: "new_product",
        ORDER_STATUS: "order_status",
    }),
    Notification: {
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

// A Order é necessária para provar que o destinatário vem da encomenda real.
vi.mock("../src/models/order.model.js", () => ({
    ORDER_STATUS: Object.freeze({
        PENDENTE: "pendente",
        PAGO: "pago",
        ENVIADO: "enviado",
        ENTREGUE: "entregue",
        CANCELADO: "cancelado",
    }),
    Order: { findById: vi.fn() },
}));

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: Object.freeze({ ACTIVE: "active" }),
    User: { find: vi.fn() },
}));

function objectId(value) {
    // Simula o comportamento mínimo de um ObjectId Mongoose usado pelos DTOs.
    return { toString: () => value };
}

function makeNotification(overrides = {}) {
    // Factory de teste: cria notificações completas e deixa cada teste alterar só o relevante.
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        userId: objectId(overrides.userId ?? "64b7f1a0f4e6f5c6d7e8f902"),
        type: overrides.type ?? NOTIFICATION_TYPES.PROMOTION,
        title: overrides.title ?? "Promoção",
        message: overrides.message ?? "Nova campanha disponível",
        resourceType: overrides.resourceType ?? "product",
        resourceId: overrides.resourceId ?? objectId("64b7f1a0f4e6f5c6d7e8f903"),
        readAt: overrides.readAt ?? null,
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

describe("BK-MF4-04 notifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita estado de encomenda vindo do body de campanha", () => {
        // order_status não é campanha; deve nascer da alteração de uma Order.
        expect(() =>
            validateCampaignNotificationInput({
                type: "order_status",
                title: "Estado",
                message: "Mensagem inválida para campanha",
            }),
        ).toThrow("Tipo de campanha invalido");
    });

    it("marca como lida apenas a notificação do próprio utilizador", async () => {
        const userId = "64b7f1a0f4e6f5c6d7e8f902";
        const notificationId = "64b7f1a0f4e6f5c6d7e8f901";
        // O mock representa a notificação encontrada para aquele par notificationId + userId.
        Notification.findOneAndUpdate.mockResolvedValueOnce(
            makeNotification({
                id: notificationId,
                userId,
                readAt: new Date("2026-06-15T11:00:00.000Z"),
            }),
        );

        const notification = await markMyNotificationAsRead(userId, notificationId);

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            // Este filtro é o centro da regra: não basta conhecer o ID da notificação.
            { _id: notificationId, userId },
            expect.objectContaining({ readAt: expect.any(Date) }),
            expect.objectContaining({ new: true, runValidators: true }),
        );
        expect(notification).toMatchObject({
            id: notificationId,
            resourceType: "product",
        });
        // O DTO público não deve transportar dados que não pertencem à inbox.
        expect(notification).not.toHaveProperty("payment");
        expect(notification).not.toHaveProperty("passwordHash");
    });

    it("notifica o dono real quando o estado da encomenda muda", async () => {
        const order = {
            _id: objectId("64b7f1a0f4e6f5c6d7e8f904"),
            userId: objectId("64b7f1a0f4e6f5c6d7e8f902"),
            status: ORDER_STATUS.ENVIADO,
        };
        // O service seleciona userId/status da encomenda; o destinatário vem daqui.
        Order.findById.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(order),
        });
        Notification.create.mockResolvedValueOnce(
            makeNotification({
                type: NOTIFICATION_TYPES.ORDER_STATUS,
                title: "Estado da encomenda atualizado",
                message: "A tua encomenda está com estado: enviado.",
                resourceType: "order",
                resourceId: order._id,
                userId: order.userId.toString(),
            }),
        );

        const notification = await createOrderStatusNotification(order._id.toString());

        expect(Notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                // Garante que a notificação é enviada ao dono real da Order.
                userId: order.userId,
                type: NOTIFICATION_TYPES.ORDER_STATUS,
                resourceType: "order",
                resourceId: order._id,
            }),
        );
        expect(notification).toMatchObject({
            type: NOTIFICATION_TYPES.ORDER_STATUS,
            resourceType: "order",
        });
    });
});