/**
 * Integração real do checkout e pagamento simulado sobre um replica set efémero.
 *
 * Este ficheiro nunca lê `MONGODB_URI`: aceita exclusivamente a URI loopback
 * gerada por `MongoMemoryReplSet`. Assim, concorrência, transações e rollback
 * são provados sem tocar numa base de dados externa ou persistente.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { Cart } from "../src/models/cart.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { createFailedSimulationPayment } from "../src/providers/payment.provider.js";
import {
    checkoutMyCart,
    simulateOrderPayment,
} from "../src/services/order.service.js";

const DATABASE_NAME = "orelle_g2_replset_test";
const CONCURRENT_REQUESTS = 25;
const TRANSACTION_FAILURE_POINTS = [
    "after_failed_state",
    "after_voucher",
    "after_stock",
    "after_order",
    "after_cart",
];

/** @type {MongoMemoryReplSet|null} */
let replSet = null;

/**
 * Impede que uma alteração acidental ligue estes testes a uma base externa.
 *
 * @param {string} uri - URI criada pelo servidor MongoDB efémero.
 * @returns {void}
 */
function assertEphemeralLoopbackUri(uri) {
    const expectedPrefix = `mongodb://127.0.0.1:`;
    if (
        !uri.startsWith(expectedPrefix) ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error(
            "O teste G2 recusou uma URI que não é um replica set loopback efémero",
        );
    }
}

/**
 * Cria produto, voucher e carrinho independentes e materializa o checkout.
 *
 * @param {string} label - Sufixo único e legível do cenário.
 * @param {{stock?: number, quantity?: number, voucherCents?: number}} [options] - Valores comerciais.
 * @returns {Promise<object>} IDs e valores iniciais do cenário.
 */
async function createCheckoutFixture(
    label,
    { stock = 20, quantity = 2, voucherCents = 1000 } = {},
) {
    const userId = new mongoose.Types.ObjectId();
    const createdBy = new mongoose.Types.ObjectId();
    const product = await Product.create({
        name: `Produto G2 ${label}`,
        brandName: "Orélle Test",
        description: "Produto efémero para validar a transação simulada.",
        ingredientNames: ["ingrediente-teste"],
        skinTypes: ["normal"],
        imageUrl: `/test-assets/${label}.webp`,
        priceCents: 2000,
        stock,
        categoryIds: [],
        createdBy,
    });
    const voucher = await Voucher.create({
        userId,
        code: `G2-${label}-${userId.toString().slice(-8)}`,
        amountCents: voucherCents,
        remainingCents: voucherCents,
        sourceReportUnlockId: new mongoose.Types.ObjectId(),
        appliedOrderIds: [],
        status: "active",
    });
    await Cart.create({
        userId,
        items: [
            {
                productId: product._id,
                quantity,
                priceSnapshotCents: product.priceCents,
                productNameSnapshot: product.name,
            },
        ],
    });
    const checkout = await checkoutMyCart(userId.toString());

    return {
        userId: userId.toString(),
        orderId: checkout.id,
        productId: product._id,
        voucherId: voucher._id,
        initialStock: stock,
        quantity,
        initialVoucherCents: voucherCents,
    };
}

/**
 * Confirma que nenhuma escrita observável escapou de uma transação abortada.
 *
 * @param {object} fixture - Cenário criado por `createCheckoutFixture`.
 * @returns {Promise<void>}
 */
async function expectFixtureToBePristine(fixture) {
    const [product, voucher, cart, order] = await Promise.all([
        Product.findById(fixture.productId),
        Voucher.findById(fixture.voucherId),
        Cart.findOne({ userId: fixture.userId }),
        Order.findById(fixture.orderId).select(
            "+payment.idempotencyKeyHash +paymentAttempts",
        ),
    ]);

    expect(product.stock).toBe(fixture.initialStock);
    expect(voucher.remainingCents).toBe(fixture.initialVoucherCents);
    expect(voucher.status).toBe("active");
    expect(voucher.appliedOrderIds).toHaveLength(0);
    expect(cart).not.toBeNull();
    expect(cart.items).toHaveLength(1);
    expect(order.payment.status).toBe("awaiting_simulation");
    expect(order.payment.idempotencyKeyHash).toBeNull();
    expect(order.stockReserved).toBe(false);
    expect(order.paymentAttempts).toHaveLength(0);
}

/**
 * Confirma o estado terminal e único de uma simulação bem-sucedida.
 *
 * @param {object} fixture - Cenário comercial original.
 * @returns {Promise<object>} Encomenda carregada com tentativas internas.
 */
async function expectFixtureToBePaidOnce(fixture) {
    const [product, voucher, cart, order] = await Promise.all([
        Product.findById(fixture.productId),
        Voucher.findById(fixture.voucherId),
        Cart.findOne({ userId: fixture.userId }),
        Order.findById(fixture.orderId).select(
            "+payment.idempotencyKeyHash +paymentAttempts",
        ),
    ]);

    const expectedDiscount = Math.min(
        fixture.initialVoucherCents,
        2000 * fixture.quantity,
    );
    expect(product.stock).toBe(
        fixture.initialStock - fixture.quantity,
    );
    expect(voucher.remainingCents).toBe(
        fixture.initialVoucherCents - expectedDiscount,
    );
    expect(voucher.appliedOrderIds.map(String)).toEqual([
        fixture.orderId,
    ]);
    expect(cart).toBeNull();
    expect(order.payment.status).toBe("simulated_paid");
    expect(order.stockReserved).toBe(true);
    expect(order.paymentAttempts).toHaveLength(1);

    return order;
}

describe("G2 - pagamento simulado num MongoMemoryReplSet real", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            throw new Error(
                "O teste G2 exige que a conexão Mongoose global esteja desligada",
            );
        }

        replSet = await MongoMemoryReplSet.create({
            replSet: {
                count: 1,
                storageEngine: "wiredTiger",
            },
        });
        const uri = replSet.getUri(DATABASE_NAME);
        assertEphemeralLoopbackUri(uri);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10_000,
            maxPoolSize: 50,
        });
        await Promise.all([
            Cart.syncIndexes(),
            Order.syncIndexes(),
            Product.syncIndexes(),
            Voucher.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        vi.restoreAllMocks();
        if (mongoose.connection.readyState !== 1) return;
        await Promise.all(
            Object.values(mongoose.connection.collections).map((collection) =>
                collection.deleteMany({}),
            ),
        );
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (replSet) {
            await replSet.stop();
            replSet = null;
        }
    }, 60_000);

    it("consolida 25 pedidos concorrentes, consome efeitos uma vez e faz replay exato", async () => {
        const userId = new mongoose.Types.ObjectId();
        const createdBy = new mongoose.Types.ObjectId();
        const product = await Product.create({
            name: "Produto concorrência G2",
            brandName: "Orélle Test",
            description: "Produto efémero para concorrência transacional.",
            ingredientNames: ["ingrediente-teste"],
            skinTypes: ["normal"],
            imageUrl: "/test-assets/g2-concurrency.webp",
            priceCents: 2000,
            stock: 50,
            categoryIds: [],
            createdBy,
        });
        const voucher = await Voucher.create({
            userId,
            code: `G2-CONCURRENT-${userId.toString().slice(-8)}`,
            amountCents: 3000,
            remainingCents: 3000,
            sourceReportUnlockId: new mongoose.Types.ObjectId(),
            appliedOrderIds: [],
            status: "active",
        });
        await Cart.create({
            userId,
            items: [
                {
                    productId: product._id,
                    quantity: 2,
                    priceSnapshotCents: 2000,
                    productNameSnapshot: product.name,
                },
            ],
        });

        const checkouts = await Promise.all(
            Array.from({ length: CONCURRENT_REQUESTS }, () =>
                checkoutMyCart(userId.toString()),
            ),
        );
        const orderIds = new Set(checkouts.map((checkout) => checkout.id));
        expect(orderIds.size).toBe(1);
        expect(await Order.countDocuments({ userId })).toBe(1);

        const [orderId] = orderIds;
        const idempotencyKey = "g2-25-concurrent-simulation-requests";
        const responses = await Promise.all(
            Array.from({ length: CONCURRENT_REQUESTS }, () =>
                simulateOrderPayment(
                    userId.toString(),
                    orderId,
                    idempotencyKey,
                ),
            ),
        );
        const canonicalResponse = JSON.stringify(responses[0]);
        expect(
            responses.every(
                (response) => JSON.stringify(response) === canonicalResponse,
            ),
        ).toBe(true);

        const replay = await simulateOrderPayment(
            userId.toString(),
            orderId,
            idempotencyKey,
        );
        expect(JSON.stringify(replay)).toBe(canonicalResponse);

        const fixture = {
            userId: userId.toString(),
            orderId,
            productId: product._id,
            voucherId: voucher._id,
            initialStock: 50,
            quantity: 2,
            initialVoucherCents: 3000,
        };
        const storedOrder = await expectFixtureToBePaidOnce(fixture);
        expect(storedOrder.paymentAttempts[0].responseSnapshot).toEqual(
            responses[0],
        );
    }, 60_000);

    it("um checkout atrasado nunca reverte um pagamento já confirmado", async () => {
        const fixture = await createCheckoutFixture("checkout-payment-race");
        const enteredCas = Promise.withResolvers();
        const releaseCas = Promise.withResolvers();
        const originalFindOneAndUpdate = Order.findOneAndUpdate.bind(Order);
        vi.spyOn(Order, "findOneAndUpdate").mockImplementationOnce(
            async (...arguments_) => {
                enteredCas.resolve();
                await releaseCas.promise;
                return originalFindOneAndUpdate(...arguments_);
            },
        );

        const lateCheckoutPromise = checkoutMyCart(fixture.userId);
        await enteredCas.promise;

        const idempotencyKey = "g2-interleaved-checkout-payment-race";
        const payment = await simulateOrderPayment(
            fixture.userId,
            fixture.orderId,
            idempotencyKey,
        );
        expect(payment.payment.status).toBe("simulated_paid");

        releaseCas.resolve();
        const lateCheckout = await lateCheckoutPromise;
        expect(lateCheckout.id).toBe(fixture.orderId);
        expect(lateCheckout.payment.status).toBe("simulated_paid");
        expect(lateCheckout.stockReserved).toBe(true);

        const storedOrder = await expectFixtureToBePaidOnce(fixture);
        expect(storedOrder.payment.status).not.toBe("awaiting_simulation");

        const replay = await simulateOrderPayment(
            fixture.userId,
            fixture.orderId,
            idempotencyKey,
        );
        expect(replay).toEqual(payment);
        await expectFixtureToBePaidOnce(fixture);
    });

    it.each(TRANSACTION_FAILURE_POINTS)(
        "faz rollback integral em %s e permite retry com a mesma chave",
        async (failurePoint) => {
            const fixture = await createCheckoutFixture(failurePoint);
            const idempotencyKey = `g2-rollback-${failurePoint}`;
            const failureInjector = async (currentPoint) => {
                if (currentPoint === failurePoint) {
                    throw new Error(`falha injetada em ${failurePoint}`);
                }
            };
            const options = { failureInjector };

            if (failurePoint === "after_failed_state") {
                options.paymentResultFactory = (order) =>
                    createFailedSimulationPayment(order, {
                        now: new Date("2026-07-10T00:00:00.000Z"),
                        randomId: () => "rollback-failed-state",
                    });
            }

            await expect(
                simulateOrderPayment(
                    fixture.userId,
                    fixture.orderId,
                    idempotencyKey,
                    options,
                ),
            ).rejects.toThrow(`falha injetada em ${failurePoint}`);

            await expectFixtureToBePristine(fixture);

            const retry = await simulateOrderPayment(
                fixture.userId,
                fixture.orderId,
                idempotencyKey,
            );
            expect(retry.payment.status).toBe("simulated_paid");
            await expectFixtureToBePaidOnce(fixture);
        },
        30_000,
    );

    it("um AbortSignal durante a transação impede qualquer commit tardio", async () => {
        const fixture = await createCheckoutFixture("request-abort");
        const controller = new AbortController();

        await expect(
            simulateOrderPayment(
                fixture.userId,
                fixture.orderId,
                "g2-request-abort-before-commit",
                {
                    signal: controller.signal,
                    failureInjector: async (point) => {
                        if (point !== "after_cart") return;
                        controller.abort(
                            new Error("Pedido HTTP expirou durante a transação"),
                        );
                    },
                },
            ),
        ).rejects.toThrow("Pedido HTTP expirou durante a transação");

        await expectFixtureToBePristine(fixture);
        const retry = await simulateOrderPayment(
            fixture.userId,
            fixture.orderId,
            "g2-request-abort-before-commit",
        );
        expect(retry.payment.status).toBe("simulated_paid");
    });
});
