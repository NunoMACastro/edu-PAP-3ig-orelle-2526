/**
 * Testes unitários do replay transacional do pagamento simulado.
 *
 * Os modelos são isolados para provar decisões de domínio sem abrir portas nem
 * depender de uma MongoDB externa. A concorrência real fica reservada ao teste
 * de replica set, porque mocks não conseguem provar isolamento transacional.
 */
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cart } from "../src/models/cart.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import {
    createFailedSimulationPayment,
    createSuccessfulSimulationPayment,
} from "../src/providers/payment.provider.js";
import { simulateOrderPayment } from "../src/services/order.service.js";

vi.mock("../src/models/cart.model.js", () => ({
    Cart: {
        deleteOne: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
        updateOne: vi.fn(),
    },
}));

vi.mock("../src/models/voucher.model.js", () => ({
    VOUCHER_STATUS: {
        ACTIVE: "active",
        USED: "used",
    },
    Voucher: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

const userId = "66c000000000000000000210";
const orderId = "66c000000000000000000211";
const cartId = "66c000000000000000000212";
const productId = "66c000000000000000000213";

/**
 * Cria um identificador mínimo compatível com os DTOs do serviço.
 *
 * @param {string} value - Identificador textual.
 * @returns {{toString: () => string}} ObjectId simulado.
 */
function objectId(value) {
    return { toString: () => value };
}

/**
 * Cria uma query mock que termina em `session()`.
 *
 * @param {unknown} result - Resultado da query.
 * @returns {object} Query encadeável.
 */
function querySession(result) {
    return {
        session: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria uma query mock que suporta `select().session()`.
 *
 * @param {unknown} result - Resultado da query.
 * @returns {object} Query encadeável.
 */
function querySelectSession(result) {
    return {
        select: vi.fn().mockReturnThis(),
        session: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria uma sessão síncrona do ponto de vista do teste.
 *
 * @returns {object} Sessão transacional mock.
 */
function makeSession() {
    return {
        endSession: vi.fn().mockResolvedValue(undefined),
        withTransaction: vi.fn(async (callback) => callback()),
    };
}

/**
 * Cria uma encomenda pendente e mutável.
 *
 * @param {object} [overrides={}] - Campos a substituir.
 * @returns {object} Documento mock de encomenda.
 */
function makeOrder(overrides = {}) {
    return {
        _id: objectId(orderId),
        userId: objectId(userId),
        items: [
            {
                productId: objectId(productId),
                name: "Produto académico",
                unitPriceCents: 1299,
                quantity: 1,
                lineTotalCents: 1299,
            },
        ],
        subtotalCents: 1299,
        discountCents: 0,
        totalCents: 1299,
        voucher: {
            voucherId: null,
            code: null,
            amountCents: 0,
        },
        status: "pendente",
        payment: {
            mode: "simulated",
            status: "awaiting_simulation",
            simulationReference: null,
            simulatedAt: null,
            idempotencyKeyHash: null,
            message: "Pagamento por simular.",
        },
        paymentAttempts: [],
        stockReserved: false,
        createdAt: new Date("2026-07-09T20:00:00.000Z"),
        updatedAt: new Date("2026-07-09T20:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/**
 * Prepara todas as leituras e escritas necessárias a uma tentativa nova.
 *
 * @param {object} order - Encomenda devolvida pela query.
 * @returns {void}
 */
function prepareNewAttempt(order) {
    const cart = {
        _id: objectId(cartId),
        userId: objectId(userId),
        items: [{ productId: objectId(productId), quantity: 1 }],
    };
    const product = {
        _id: objectId(productId),
        name: "Produto académico",
        priceCents: 1299,
        stock: 5,
    };

    Order.findOne.mockReturnValueOnce(querySelectSession(order));
    Cart.findOne.mockReturnValueOnce(querySession(cart));
    Product.find.mockReturnValueOnce(querySession([product]));
    Voucher.findOne.mockReturnValueOnce({
        sort: vi.fn().mockReturnValue(querySession(null)),
    });
}

/**
 * Prepara apenas a leitura da encomenda, suficiente para um replay.
 *
 * @param {object} order - Encomenda com tentativa persistida.
 * @returns {void}
 */
function prepareReplay(order) {
    Order.findOne.mockReturnValueOnce(querySelectSession(order));
}

describe("idempotência do pagamento simulado", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(mongoose, "startSession").mockImplementation(async () =>
            makeSession(),
        );
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
        Cart.deleteOne.mockResolvedValue({ deletedCount: 1 });
        Voucher.findOneAndUpdate.mockResolvedValue(null);
    });

    it("repete exatamente uma falha persistida sem voltar a chamar o provider", async () => {
        const order = makeOrder();
        const paymentResultFactory = vi.fn((currentOrder) =>
            createFailedSimulationPayment(currentOrder, {
                now: new Date("2026-07-09T20:01:00.000Z"),
                randomId: () => "failed-attempt-one",
            }),
        );

        prepareNewAttempt(order);
        const firstResponse = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-one",
            { paymentResultFactory },
        );

        prepareReplay(order);
        const replayResponse = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-one",
            { paymentResultFactory },
        );

        expect(replayResponse).toEqual(firstResponse);
        expect(replayResponse.payment.status).toBe("simulated_failed");
        expect(paymentResultFactory).toHaveBeenCalledTimes(1);
        expect(order.paymentAttempts).toHaveLength(1);
        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("permite nova chave após falha e preserva o replay da falha antiga", async () => {
        const order = makeOrder();
        const failedFactory = vi.fn((currentOrder) =>
            createFailedSimulationPayment(currentOrder, {
                now: new Date("2026-07-09T20:02:00.000Z"),
                randomId: () => "failed-attempt-two",
            }),
        );
        const successFactory = vi.fn((currentOrder) =>
            createSuccessfulSimulationPayment(currentOrder, {
                now: new Date("2026-07-09T20:03:00.000Z"),
                randomId: () => "successful-attempt-three",
            }),
        );

        prepareNewAttempt(order);
        const failedResponse = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-two",
            { paymentResultFactory: failedFactory },
        );

        prepareNewAttempt(order);
        const paidResponse = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-three",
            { paymentResultFactory: successFactory },
        );

        prepareReplay(order);
        const oldFailureReplay = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-two",
            { paymentResultFactory: successFactory },
        );

        expect(paidResponse.payment.status).toBe("simulated_paid");
        expect(oldFailureReplay).toEqual(failedResponse);
        expect(order.paymentAttempts).toHaveLength(2);
        expect(failedFactory).toHaveBeenCalledTimes(1);
        expect(successFactory).toHaveBeenCalledTimes(1);
        expect(Product.updateOne).toHaveBeenCalledTimes(1);
        expect(Cart.deleteOne).toHaveBeenCalledTimes(1);
    });

    it("recusa uma chave diferente depois de pago sem reaplicar efeitos", async () => {
        const order = makeOrder();
        const successFactory = vi.fn((currentOrder) =>
            createSuccessfulSimulationPayment(currentOrder, {
                now: new Date("2026-07-09T20:04:00.000Z"),
                randomId: () => "successful-attempt-four",
            }),
        );

        prepareNewAttempt(order);
        await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-four",
            { paymentResultFactory: successFactory },
        );

        prepareReplay(order);
        await expect(
            simulateOrderPayment(
                userId,
                orderId,
                "payment-attempt-five",
                { paymentResultFactory: successFactory },
            ),
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(successFactory).toHaveBeenCalledTimes(1);
        expect(Product.updateOne).toHaveBeenCalledTimes(1);
        expect(Cart.deleteOne).toHaveBeenCalledTimes(1);
        expect(order.paymentAttempts).toHaveLength(1);
    });

    it("reproduz a última chave legada mesmo sem histórico de tentativas", async () => {
        const legacyResponseDate = new Date("2026-07-09T20:05:00.000Z");
        const keyHash = await import("node:crypto").then(({ createHash }) =>
            createHash("sha256")
                .update("payment-attempt-legacy")
                .digest("hex"),
        );
        const order = makeOrder({
            payment: {
                mode: "simulated",
                status: "simulated_failed",
                simulationReference: `sim-${orderId}-legacy-attempt`,
                simulatedAt: legacyResponseDate,
                idempotencyKeyHash: keyHash,
                message: "Simulação não concluída.",
            },
        });
        const paymentResultFactory = vi.fn();

        prepareReplay(order);
        const response = await simulateOrderPayment(
            userId,
            orderId,
            "payment-attempt-legacy",
            { paymentResultFactory },
        );

        expect(response.payment.status).toBe("simulated_failed");
        expect(response.payment.simulatedAt).toEqual(legacyResponseDate);
        expect(paymentResultFactory).not.toHaveBeenCalled();
    });
});
