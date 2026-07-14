/**
 * Integração real da administração logística num replica set efémero loopback.
 *
 * Prova que a listagem é minimizada e que uma encomenda paga apenas por
 * simulação percorre `pendente -> enviado -> entregue` com uma notificação
 * transacional por passo. Nenhuma URI persistente ou externa é consultada.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    ORDER_STATUS,
    PAYMENT_MODE,
    PAYMENT_STATUS,
} from "../src/constants/domain.constants.js";
import { ROLES } from "../src/constants/roles.js";
import { Notification } from "../src/models/notification.model.js";
import { Order } from "../src/models/order.model.js";
import { User } from "../src/models/user.model.js";
import {
    listAdminOrders,
    updateOrderStatusAndNotify,
} from "../src/services/notification.service.js";

const DATABASE_NAME = "orelle_admin_orders_test";
let replicaSet;

/**
 * Cria uma encomenda real com o contrato de pagamento simulado.
 *
 * @param {string} paymentStatus - Estado de pagamento a persistir.
 * @returns {Promise<import("mongoose").Document>} Encomenda de teste.
 */
async function createOrder(paymentStatus) {
    const user = await User.create({
        email: `cliente-${new mongoose.Types.ObjectId()}@orelle.test`,
        passwordHash: "hash-apenas-para-fixture",
        role: ROLES.CLIENTE,
    });

    return Order.create({
        userId: user._id,
        checkoutKey: `checkout-${new mongoose.Types.ObjectId()}`,
        items: [
            {
                productId: new mongoose.Types.ObjectId(),
                name: "Sérum de teste",
                unitPriceCents: 2590,
                quantity: 2,
                lineTotalCents: 5180,
            },
        ],
        subtotalCents: 5180,
        discountCents: 0,
        totalCents: 5180,
        status: ORDER_STATUS.PENDENTE,
        stockReserved: paymentStatus === PAYMENT_STATUS.SIMULATED_PAID,
        payment: {
            mode: PAYMENT_MODE.SIMULATED,
            status: paymentStatus,
            simulationReference:
                paymentStatus === PAYMENT_STATUS.SIMULATED_PAID
                    ? `SIM-${new mongoose.Types.ObjectId()}`
                    : null,
            simulatedAt:
                paymentStatus === PAYMENT_STATUS.SIMULATED_PAID
                    ? new Date()
                    : null,
            message: "Demonstração académica — nenhuma cobrança foi efetuada.",
        },
    });
}

describe("G5 - administração de encomendas", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);

        if (
            !uri.startsWith("mongodb://127.0.0.1:") ||
            !uri.includes(`/${DATABASE_NAME}?`) ||
            !uri.includes("replicaSet=") ||
            uri.includes("@")
        ) {
            throw new Error("O teste G5 recusou uma URI não efémera/loopback");
        }

        await mongoose.connect(uri);
    }, 120_000);

    afterEach(async () => {
        await Promise.all([
            Notification.deleteMany({}),
            Order.deleteMany({}),
            User.deleteMany({}),
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("lista resumos sem IDs de utilizador/produto e calcula o próximo passo", async () => {
        await createOrder(PAYMENT_STATUS.SIMULATED_PAID);
        await createOrder(PAYMENT_STATUS.AWAITING_SIMULATION);

        const orders = await listAdminOrders();

        expect(orders).toHaveLength(2);
        const paid = orders.find(
            (order) => order.payment.status === PAYMENT_STATUS.SIMULATED_PAID,
        );
        const awaiting = orders.find(
            (order) =>
                order.payment.status === PAYMENT_STATUS.AWAITING_SIMULATION,
        );

        expect(paid).toMatchObject({
            customerEmail: expect.stringMatching(/@orelle\.test$/),
            status: ORDER_STATUS.PENDENTE,
            nextStatus: ORDER_STATUS.ENVIADO,
            itemCount: 2,
            totalCents: 5180,
        });
        expect(awaiting.nextStatus).toBeNull();
        expect(JSON.stringify(orders)).not.toContain("userId");
        expect(JSON.stringify(orders)).not.toContain("productId");
        expect(JSON.stringify(orders)).not.toContain("idempotencyKeyHash");
    });

    it("avança sequencialmente e rejeita regressões ou pagamento por simular", async () => {
        const paidOrder = await createOrder(PAYMENT_STATUS.SIMULATED_PAID);
        const awaitingOrder = await createOrder(
            PAYMENT_STATUS.AWAITING_SIMULATION,
        );

        const sent = await updateOrderStatusAndNotify(
            paidOrder._id.toString(),
            ORDER_STATUS.ENVIADO,
        );
        expect(sent.order.status).toBe(ORDER_STATUS.ENVIADO);

        const delivered = await updateOrderStatusAndNotify(
            paidOrder._id.toString(),
            ORDER_STATUS.ENTREGUE,
        );
        expect(delivered.order.status).toBe(ORDER_STATUS.ENTREGUE);
        expect(await Notification.countDocuments({ userId: paidOrder.userId })).toBe(2);

        await expect(
            updateOrderStatusAndNotify(
                paidOrder._id.toString(),
                ORDER_STATUS.ENVIADO,
            ),
        ).rejects.toMatchObject({ statusCode: 409 });
        await expect(
            updateOrderStatusAndNotify(
                awaitingOrder._id.toString(),
                ORDER_STATUS.ENVIADO,
            ),
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(
            await Notification.countDocuments({ userId: awaitingOrder.userId }),
        ).toBe(0);
    });
});
