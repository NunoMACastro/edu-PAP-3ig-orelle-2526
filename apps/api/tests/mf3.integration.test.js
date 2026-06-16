/**
 * Testes de integracao HTTP da MF3.
 *
 * Cobrem comparacao temporal, carrinho, checkout, historico, recompra,
 * dashboard admin e stock com mocks dos modelos Mongoose. O foco e validar os
 * contratos de seguranca: sessao, role, ownership por backend, stock e preco
 * calculados no servidor.
 */
import mongoose from "mongoose";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { ROLES } from "../src/constants/roles.js";
import { Cart } from "../src/models/cart.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { applyOrderStockUpdate } from "../src/services/stock.service.js";

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/skin-comparison.model.js", () => ({
    SkinComparison: {
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/cart.model.js", () => ({
    Cart: {
        create: vi.fn(),
        deleteOne: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        Order: {
            aggregate: vi.fn(),
            create: vi.fn(),
            find: vi.fn(),
            findById: vi.fn(),
            findOne: vi.fn(),
        },
    };
});

vi.mock("../src/models/user.model.js", () => ({
    User: {
        countDocuments: vi.fn(),
    },
}));

const userId = "66c000000000000000000110";
const adminId = "66c000000000000000000111";
const baselineAnalysisId = "66c000000000000000000120";
const followUpAnalysisId = "66c000000000000000000121";
const productId = "66c000000000000000000130";
const secondProductId = "66c000000000000000000131";
const orderId = "66c000000000000000000140";

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Gera um token de sessão para os cenários HTTP da MF3.
 *
 * @function makeToken
 * @param {string} [role=ROLES.CLIENTE] - Role colocada no token.
 * @param {string} [id=userId] - ID do utilizador autenticado.
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken(role = ROLES.CLIENTE, id = userId) {
    return createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });
}

/**
 * Cria uma análise facial mock para comparação temporal.
 *
 * @function makeAnalysis
 * @param {string} id - ID da análise.
 * @param {string} createdAt - Data ISO da análise.
 * @param {object} [overrides={}] - Campos a sobrepor na análise base.
 * @returns {object} Análise facial mock.
 */
function makeAnalysis(id, createdAt, overrides = {}) {
    return {
        _id: objectId(id),
        createdAt: new Date(createdAt),
        findings: {
            skinType: { label: "mista" },
            acne: { label: "moderado" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
        ...overrides,
    };
}

/**
 * Cria um produto mock com stock e preço definidos pelo backend.
 *
 * @function makeProduct
 * @param {object} [overrides={}] - Campos a sobrepor no produto base.
 * @returns {object} Produto mock.
 */
function makeProduct(overrides = {}) {
    return {
        _id: objectId(productId),
        name: "Gel controlo oleosidade",
        priceCents: 1299,
        stock: 8,
        ...overrides,
    };
}

/**
 * Cria um carrinho mock com método `save`.
 *
 * @function makeCartDoc
 * @param {object[]} [items=[]] - Itens iniciais do carrinho.
 * @returns {object} Carrinho mock.
 */
function makeCartDoc(items = []) {
    return {
        _id: objectId("66c000000000000000000150"),
        userId: objectId(userId),
        items,
        save: vi.fn().mockResolvedValue(undefined),
    };
}

/**
 * Cria um item de carrinho mock.
 *
 * @function makeCartItem
 * @param {object} [overrides={}] - Campos a sobrepor no item base.
 * @returns {object} Item de carrinho mock.
 */
function makeCartItem(overrides = {}) {
    return {
        productId: objectId(productId),
        quantity: 2,
        priceSnapshotCents: 1299,
        productNameSnapshot: "Gel controlo oleosidade",
        ...overrides,
    };
}

/**
 * Cria uma encomenda mock com pagamento pendente.
 *
 * @function makeOrder
 * @param {object} [overrides={}] - Campos a sobrepor na encomenda base.
 * @returns {object} Encomenda mock.
 */
function makeOrder(overrides = {}) {
    return {
        _id: objectId(orderId),
        userId: objectId(userId),
        items: [
            {
                productId: objectId(productId),
                name: "Gel controlo oleosidade",
                unitPriceCents: 1299,
                quantity: 2,
                lineTotalCents: 2598,
            },
        ],
        totalCents: 2598,
        status: "pendente",
        payment: {
            gateway: "stripe",
            status: "requires_payment",
            providerReference: null,
            checkoutUrl: null,
            message: "Pagamento ainda nao confirmado.",
        },
        stockReserved: false,
        createdAt: new Date("2026-06-10T10:00:00.000Z"),
        updatedAt: new Date("2026-06-10T10:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/**
 * Cria uma encomenda mock com pagamento marcado como pago.
 *
 * @function makePaidOrder
 * @param {object} [overrides={}] - Campos a sobrepor na encomenda paga.
 * @returns {object} Encomenda mock paga.
 */
function makePaidOrder(overrides = {}) {
    return makeOrder({
        payment: {
            gateway: "stripe",
            status: "paid",
            providerReference: "cs_test_123",
            checkoutUrl: null,
            message: "Pagamento confirmado.",
        },
        ...overrides,
    });
}

/**
 * Simula uma query Mongoose terminada em `sort()`.
 *
 * @function querySort
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function querySort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `select().sort()`.
 *
 * @function querySelectSort
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function querySelectSort(result) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula uma query Mongoose terminada em `select()`.
 *
 * @function querySelect
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function querySelect(result) {
    return {
        select: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula uma query Mongoose terminada em `session()`.
 *
 * @function querySession
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock com sessão.
 */
function querySession(result) {
    return {
        session: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `select().session()`.
 *
 * @function querySelectSession
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock com sessão.
 */
function querySelectSession(result) {
    return {
        select: vi.fn().mockReturnThis(),
        session: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria uma sessão de transação mock compatível com `withTransaction`.
 *
 * @function makeTransactionSession
 * @returns {object} Sessão mock usada nos testes de checkout.
 */
function makeTransactionSession() {
    return {
        endSession: vi.fn().mockResolvedValue(undefined),
        withTransaction: vi.fn(async (callback) => callback()),
    };
}

describe("MF3 - comparacao, comercio e stock", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        env.stripeSecretKey = undefined;
        Cart.deleteOne.mockResolvedValue({ deletedCount: 1 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("cria comparacao temporal sem devolver fotografias ou paths internos", async () => {
        FaceAnalysis.findOne
            .mockResolvedValueOnce(
                makeAnalysis(baselineAnalysisId, "2026-05-01T10:00:00.000Z"),
            )
            .mockResolvedValueOnce(
                makeAnalysis(followUpAnalysisId, "2026-06-05T10:00:00.000Z", {
                    findings: {
                        skinType: { label: "mista" },
                        acne: { label: "baixo" },
                        manchas: { label: "baixo" },
                        rugas: { label: "baixo" },
                        oleosidade: { label: "baixa" },
                    },
                }),
            );
        SkinComparison.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId("66c000000000000000000160"),
            baselineAnalysisId: objectId(baselineAnalysisId),
            followUpAnalysisId: objectId(followUpAnalysisId),
            daysBetween: 35,
            metricDeltas: [
                {
                    metric: "Acne",
                    baselineValue: "moderado",
                    followUpValue: "baixo",
                    changeLabel: "alterou de moderado para baixo",
                },
            ],
            summary: "1 metricas cosmeticas tiveram alteracao observavel no periodo.",
            limitations: ["Comparacao cosmetica."],
            createdAt: new Date("2026-06-06T10:00:00.000Z"),
            updatedAt: new Date("2026-06-06T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/me/skin-comparisons")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ baselineAnalysisId, followUpAnalysisId });

        expect(response.status).toBe(201);
        expect(response.body.comparison.daysBetween).toBe(35);
        expect(response.body.comparison.storageKey).toBeUndefined();
        expect(response.body.comparison.photoIds).toBeUndefined();
        expect(FaceAnalysis.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ userId, status: "completed" }),
        );
    });

    it("bloqueia comparacao com intervalo inferior a 30 dias", async () => {
        FaceAnalysis.findOne
            .mockResolvedValueOnce(
                makeAnalysis(baselineAnalysisId, "2026-06-01T10:00:00.000Z"),
            )
            .mockResolvedValueOnce(
                makeAnalysis(followUpAnalysisId, "2026-06-10T10:00:00.000Z"),
            );

        const response = await request(createApp())
            .post("/api/me/skin-comparisons")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ baselineAnalysisId, followUpAnalysisId });

        expect(response.status).toBe(400);
        expect(SkinComparison.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("adiciona produto ao carrinho usando preco e ownership do backend", async () => {
        const cart = makeCartDoc([]);
        Cart.findOne.mockResolvedValueOnce(null);
        Cart.create.mockResolvedValueOnce(cart);
        Product.findById.mockResolvedValueOnce(makeProduct());

        const response = await request(createApp())
            .post("/api/cart/items")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                productId,
                quantity: 2,
                priceCents: 1,
                userId: "fake",
            });

        expect(response.status).toBe(200);
        expect(response.body.cart.totalCents).toBe(2598);
        expect(cart.save).toHaveBeenCalled();
        expect(Cart.create).toHaveBeenCalledWith({ userId, items: [] });
    });

    it("rejeita adicionar ao carrinho quando stock nao chega", async () => {
        Cart.findOne.mockResolvedValueOnce(makeCartDoc([]));
        Product.findById.mockResolvedValueOnce(makeProduct({ stock: 1 }));

        const response = await request(createApp())
            .post("/api/cart/items")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId, quantity: 2 });

        expect(response.status).toBe(409);
    });

    it("cria encomenda stub a partir do carrinho e nao confia no total do frontend", async () => {
        const cart = makeCartDoc([makeCartItem({ priceSnapshotCents: 1 })]);
        const order = makeOrder({
            payment: {
                gateway: "mbway",
                status: "pending_manual_confirmation",
                providerReference: null,
                checkoutUrl: null,
                message: "Pagamento ainda nao confirmado.",
            },
        });
        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Order.create.mockResolvedValueOnce(order);

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ gateway: "mbway", totalCents: 1 });

        expect(response.status).toBe(201);
        expect(response.body.order.totalCents).toBe(2598);
        expect(response.body.order.payment.status).toBe(
            "pending_manual_confirmation",
        );
        expect(Order.create).toHaveBeenCalledWith(
            expect.objectContaining({ totalCents: 2598, userId }),
        );
    });

    it("falha Stripe sem configuracao antes de criar encomenda ou limpar carrinho", async () => {
        Cart.findOne.mockResolvedValueOnce(makeCartDoc([makeCartItem()]));

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ gateway: "stripe" });

        expect(response.status).toBe(503);
        expect(response.body.error.message).toBe("Stripe nao esta configurado");
        expect(Order.create).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("lista historico do proprio utilizador sem devolver userId", async () => {
        Order.find.mockReturnValueOnce(querySort([makeOrder()]));

        const response = await request(createApp())
            .get("/api/me/orders")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.orders[0].userId).toBeUndefined();
        expect(Order.find).toHaveBeenCalledWith({ userId });
    });

    it("recompra uma encomenda anterior para o carrinho sem criar checkout", async () => {
        const cart = makeCartDoc([]);
        Order.findOne.mockResolvedValueOnce(makeOrder());
        Product.findById
            .mockResolvedValueOnce(makeProduct())
            .mockResolvedValueOnce(makeProduct());
        Cart.findOne.mockResolvedValueOnce(null);
        Cart.create.mockResolvedValueOnce(cart);

        const response = await request(createApp())
            .post(`/api/me/orders/${orderId}/reorder`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.cart.totalCents).toBe(2598);
        expect(Order.create).not.toHaveBeenCalled();
    });

    it("bloqueia dashboard admin a clientes", async () => {
        const response = await request(createApp())
            .get("/api/admin/dashboard/stats")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE)}`]);

        expect(response.status).toBe(403);
        expect(Order.aggregate).not.toHaveBeenCalled();
    });

    it("devolve dashboard agregado para administrador", async () => {
        Order.aggregate
            .mockResolvedValueOnce([{ orderCount: 2, totalSalesCents: 5000 }])
            .mockResolvedValueOnce([
                {
                    _id: objectId(productId),
                    name: "Gel controlo oleosidade",
                    unitsSold: 3,
                    revenueCents: 3897,
                },
            ]);
        User.countDocuments.mockResolvedValueOnce(4);

        const response = await request(createApp())
            .get("/api/admin/dashboard/stats")
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.ADMIN, adminId)}`,
            ]);

        expect(response.status).toBe(200);
        expect(response.body.stats.activeUsers).toBe(4);
        expect(response.body.stats.topProducts[0].name).toBe(
            "Gel controlo oleosidade",
        );
    });

    it("lista alertas de baixo stock apenas para administrador", async () => {
        Product.find.mockReturnValueOnce(
            querySelectSort([makeProduct({ stock: 3 })]),
        );

        const response = await request(createApp())
            .get("/api/admin/stock/alerts")
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.ADMIN, adminId)}`,
            ]);

        expect(response.status).toBe(200);
        expect(response.body.products[0].stock).toBe(3);
        expect(Product.find).toHaveBeenCalledWith({ stock: { $lt: 5 } });
    });

    it("rejeita stock negativo no ajuste manual", async () => {
        const response = await request(createApp())
            .patch(`/api/admin/products/${productId}/stock`)
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.ADMIN, adminId)}`,
            ])
            .send({ stock: -1 });

        expect(response.status).toBe(400);
        expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("atualiza stock manual com role administrador", async () => {
        Product.findByIdAndUpdate.mockReturnValueOnce(
            querySelect(makeProduct({ stock: 12 })),
        );

        const response = await request(createApp())
            .patch(`/api/admin/products/${productId}/stock`)
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.ADMIN, adminId)}`,
            ])
            .send({ stock: 12 });

        expect(response.status).toBe(200);
        expect(response.body.product.stock).toBe(12);
    });

    it("bloqueia atualizacao automatica de stock sem pagamento paid", async () => {
        const session = makeTransactionSession();
        vi.spyOn(mongoose, "startSession").mockResolvedValueOnce(session);
        Order.findById.mockReturnValueOnce(querySession(makeOrder()));

        await expect(applyOrderStockUpdate(orderId)).rejects.toMatchObject({
            statusCode: 409,
        });

        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });

    it("aplica atualizacao automatica de stock numa transacao", async () => {
        const session = makeTransactionSession();
        const order = makePaidOrder({
            items: [
                {
                    productId: objectId(productId),
                    name: "Gel controlo oleosidade",
                    unitPriceCents: 1299,
                    quantity: 1,
                    lineTotalCents: 1299,
                },
                {
                    productId: objectId(productId),
                    name: "Gel controlo oleosidade",
                    unitPriceCents: 1299,
                    quantity: 2,
                    lineTotalCents: 2598,
                },
            ],
            save: vi.fn().mockResolvedValue(undefined),
        });
        vi.spyOn(mongoose, "startSession").mockResolvedValueOnce(session);
        Order.findById.mockReturnValueOnce(querySession(order));
        Product.find.mockReturnValueOnce(
            querySelectSession([makeProduct({ stock: 8 })]),
        );
        Product.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

        const result = await applyOrderStockUpdate(orderId);

        expect(result).toEqual({
            orderId,
            stockReserved: true,
            alreadyApplied: false,
        });
        expect(session.withTransaction).toHaveBeenCalled();
        expect(Product.updateOne).toHaveBeenCalledWith(
            expect.objectContaining({ stock: { $gte: 3 } }),
            { $inc: { stock: -3 } },
            { session },
        );
        expect(Product.updateOne.mock.calls[0][0]._id.toString()).toBe(productId);
        expect(order.save).toHaveBeenCalledWith({ session });
        expect(session.endSession).toHaveBeenCalled();
    });

    it("nao reduz stock duas vezes para a mesma encomenda", async () => {
        const session = makeTransactionSession();
        vi.spyOn(mongoose, "startSession").mockResolvedValueOnce(session);
        Order.findById.mockReturnValueOnce(
            querySession(makePaidOrder({ stockReserved: true })),
        );

        const result = await applyOrderStockUpdate(orderId);

        expect(result.alreadyApplied).toBe(true);
        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });

    it("falha preflight de stock sem reduzir produtos anteriores", async () => {
        const session = makeTransactionSession();
        const order = makePaidOrder({
            items: [
                {
                    productId: objectId(productId),
                    name: "Gel controlo oleosidade",
                    unitPriceCents: 1299,
                    quantity: 1,
                    lineTotalCents: 1299,
                },
                {
                    productId: objectId(secondProductId),
                    name: "Creme indisponivel",
                    unitPriceCents: 2099,
                    quantity: 1,
                    lineTotalCents: 2099,
                },
            ],
            save: vi.fn().mockResolvedValue(undefined),
        });
        vi.spyOn(mongoose, "startSession").mockResolvedValueOnce(session);
        Order.findById.mockReturnValueOnce(querySession(order));
        Product.find.mockReturnValueOnce(
            querySelectSession([makeProduct({ stock: 8 })]),
        );

        await expect(applyOrderStockUpdate(orderId)).rejects.toMatchObject({
            statusCode: 409,
        });

        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(order.save).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });

    it("bloqueia carrinho sem sessao", async () => {
        const response = await request(createApp()).get("/api/cart");

        expect(response.status).toBe(401);
        expect(Cart.findOne).not.toHaveBeenCalled();
    });
});
