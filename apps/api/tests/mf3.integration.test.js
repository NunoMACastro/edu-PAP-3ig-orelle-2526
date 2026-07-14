/**
 * Testes de integracao HTTP da MF3.
 *
 * Cobrem comparacao temporal, carrinho, checkout, historico, recompra,
 * dashboard admin e stock com mocks dos modelos Mongoose. O foco e validar os
 * contratos de seguranca: sessao, role, ownership por backend, stock e preco
 * calculados no servidor.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Cart } from "../src/models/cart.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { User } from "../src/models/user.model.js";
import { Voucher } from "../src/models/voucher.model.js";
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

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: { LOCKED: "locked", UNLOCKED: "unlocked" },
    ReportUnlock: { find: vi.fn() },
}));

vi.mock("../src/models/cart.model.js", () => ({
    Cart: {
        create: vi.fn(),
        deleteOne: vi.fn(),
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
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
            findOneAndUpdate: vi.fn(),
        },
    };
});

vi.mock("../src/models/user.model.js", () => ({
    User: {
        countDocuments: vi.fn(),
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

const userId = "66c000000000000000000110";
const adminId = "66c000000000000000000111";
const baselineAnalysisId = "66c000000000000000000120";
const followUpAnalysisId = "66c000000000000000000121";
const productId = "66c000000000000000000130";
const secondProductId = "66c000000000000000000131";
const orderId = "66c000000000000000000140";
const cartId = "66c000000000000000000150";
const voucherId = "66c000000000000000000151";

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        /**
         * Devolve o valor textual do ObjectId simulado.
         *
         * @function toString
         * @returns {string} Identificador textual usado no teste.
         */
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
 * @returns {string} Token opaco de sessão válido para os testes.
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
        _id: objectId(cartId),
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
        checkoutKey: makeCheckoutKey(),
        items: [
            {
                productId: objectId(productId),
                name: "Gel controlo oleosidade",
                unitPriceCents: 1299,
                quantity: 2,
                lineTotalCents: 2598,
            },
        ],
        subtotalCents: 2598,
        discountCents: 0,
        totalCents: 2598,
        voucher: null,
        status: "pendente",
        payment: {
            mode: "simulated",
            status: "awaiting_simulation",
            simulationReference: null,
            simulatedAt: null,
            idempotencyKeyHash: null,
            message: "Pagamento por simular. Não será efetuada qualquer cobrança.",
        },
        paymentAttempts: [],
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
            mode: "simulated",
            status: "simulated_paid",
            simulationReference: `sim-${orderId}-stock-test`,
            simulatedAt: new Date("2026-06-10T10:05:00.000Z"),
            idempotencyKeyHash: "internal-test-hash",
            message:
                "Demonstração académica — não foi efetuada qualquer cobrança.",
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

function querySelectLean(result) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(result),
    };
    query.select.mockReturnValue(query);
    return query;
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

/**
 * Reproduz a checkoutKey esperada para carrinhos mock sem updatedAt.
 *
 * @function makeCheckoutKey
 * @returns {string} Chave calculada pelo service para o carrinho base.
 */
function makeCheckoutKey() {
    return createHash("sha256")
        .update(`${userId}:${cartId}:${productId}:2`)
        .digest("hex");
}

describe("MF3 - comparacao, comercio e stock", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        Cart.deleteOne.mockResolvedValue({ deletedCount: 1 });
        Voucher.findOne.mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });
        Voucher.findOneAndUpdate.mockResolvedValue(null);
        ReportUnlock.find.mockReturnValue(
            querySelectLean([
                { analysisId: objectId(baselineAnalysisId) },
                { analysisId: objectId(followUpAnalysisId) },
            ]),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
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
            .send({
                baselineSelection: baselineAnalysisId,
                followUpSelection: followUpAnalysisId,
            });

        expect(response.status).toBe(201);
        expect(response.body.comparison.daysBetween).toBe(35);
        expect(response.body.comparison.storageKey).toBeUndefined();
        expect(response.body.comparison.photoIds).toBeUndefined();
        expect(response.body.comparison.baselineAnalysisId).toBeUndefined();
        expect(response.body.comparison.followUpAnalysisId).toBeUndefined();
        expect(FaceAnalysis.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                status: "completed",
                _id: expect.any(String),
            }),
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
            .send({
                baselineSelection: baselineAnalysisId,
                followUpSelection: followUpAnalysisId,
            });

        expect(response.status).toBe(400);
        expect(SkinComparison.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("adiciona produto ao carrinho usando preco e ownership do backend", async () => {
        const cart = makeCartDoc([]);
        const product = makeProduct();
        Product.findById.mockResolvedValueOnce(product);
        Cart.findOneAndUpdate
            .mockResolvedValueOnce(cart)
            .mockImplementationOnce(async () => {
                cart.items.push({
                    productId: product._id,
                    quantity: 2,
                    priceSnapshotCents: product.priceCents,
                    productNameSnapshot: product.name,
                });
                return cart;
            });

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
        expect(cart.save).not.toHaveBeenCalled();
        expect(Cart.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(Cart.create).not.toHaveBeenCalled();
    });

    it("rejeita adicionar ao carrinho quando stock nao chega", async () => {
        Product.findById.mockResolvedValueOnce(makeProduct({ stock: 1 }));

        const response = await request(createApp())
            .post("/api/cart/items")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId, quantity: 2 });

        expect(response.status).toBe(409);
    });

    it("recusa método, gateway e total enviados pelo frontend", async () => {
        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ gateway: "external", totalCents: 1 });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain(
            "não aceita método, preço ou dados de pagamento",
        );
        expect(Order.create).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("cria checkout pendente sem consumir stock, voucher ou carrinho", async () => {
        const cart = makeCartDoc([makeCartItem({ priceSnapshotCents: 1 })]);
        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Order.findOneAndUpdate.mockResolvedValueOnce(null);
        Order.findOne.mockResolvedValueOnce(null);
        Order.create.mockImplementationOnce(async (payload) => makeOrder(payload));

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({});

        expect(response.status).toBe(201);
        expect(response.body.order.totalCents).toBe(2598);
        expect(response.body.order.payment).toMatchObject({
            mode: "simulated",
            status: "awaiting_simulation",
            simulationReference: null,
        });
        expect(response.body.order.payment.gateway).toBeUndefined();
        expect(Order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                checkoutKey: makeCheckoutKey(),
                totalCents: 2598,
                userId,
            }),
        );
        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(Voucher.findOneAndUpdate).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("faz apenas preview do voucher no checkout e não o consome", async () => {
        const cart = makeCartDoc([makeCartItem()]);
        const voucher = {
            _id: objectId(voucherId),
            userId: objectId(userId),
            code: "ORELLE-00000151",
            amountCents: 5000,
            remainingCents: 5000,
            status: "active",
            appliedOrderIds: [],
        };

        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Order.findOneAndUpdate.mockResolvedValueOnce(null);
        Order.findOne.mockResolvedValueOnce(null);
        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue(voucher),
        });
        Order.create.mockImplementationOnce(async (payload) => makeOrder(payload));

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({});

        expect(response.status).toBe(201);
        expect(response.body.order).toMatchObject({
            subtotalCents: 2598,
            discountCents: 2598,
            totalCents: 0,
        });
        expect(response.body.order.voucher).toMatchObject({
            code: "ORELLE-00000151",
            amountCents: 2598,
        });
        expect(response.body.order.payment.status).toBe("awaiting_simulation");
        expect(Voucher.findOneAndUpdate).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("aplica no preview o voucher explicitamente escolhido", async () => {
        const cart = makeCartDoc([makeCartItem()]);
        const voucher = {
            _id: objectId(voucherId),
            userId: objectId(userId),
            code: "ORELLE-ESCOLHIDO",
            amountCents: 500,
            remainingCents: 500,
            status: "active",
            appliedOrderIds: [],
        };

        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Order.findOneAndUpdate.mockResolvedValueOnce(null);
        Order.findOne.mockResolvedValueOnce(null);
        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue(voucher),
        });
        Order.create.mockImplementationOnce(async (payload) => makeOrder(payload));

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ voucherCode: "orelle-escolhido" });

        expect(response.status).toBe(201);
        expect(response.body.order.voucher).toMatchObject({
            code: "ORELLE-ESCOLHIDO",
            amountCents: 500,
        });
        expect(Voucher.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                code: "ORELLE-ESCOLHIDO",
                userId,
            }),
        );
    });

    it("rejeita um voucher escolhido que não pertence aos ativos do cliente", async () => {
        Cart.findOne.mockResolvedValueOnce(makeCartDoc([makeCartItem()]));
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue(null),
        });

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ voucherCode: "ORELLE-INDISPONIVEL" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("não existe");
        expect(Order.create).not.toHaveBeenCalled();
    });

    it("reaproveita o checkout pendente calculado para o mesmo carrinho", async () => {
        const cart = makeCartDoc([makeCartItem()]);
        const order = makeOrder();
        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([makeProduct()]);
        Order.findOneAndUpdate.mockResolvedValueOnce(order);

        const response = await request(createApp())
            .post("/api/orders/checkout")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({});

        expect(response.status).toBe(201);
        expect(response.body.order.id).toBe(orderId);
        expect(response.body.order.checkoutKey).toBeUndefined();
        expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                checkoutKey: makeCheckoutKey(),
                userId,
                status: "pendente",
                stockReserved: false,
            }),
            expect.objectContaining({
                $set: expect.objectContaining({
                    payment: expect.objectContaining({
                        status: "awaiting_simulation",
                    }),
                }),
            }),
            { new: true, runValidators: true },
        );
        expect(Order.create).not.toHaveBeenCalled();
        expect(order.save).not.toHaveBeenCalled();
        expect(Cart.deleteOne).not.toHaveBeenCalled();
    });

    it("exige Idempotency-Key no momento explícito da simulação", async () => {
        const response = await request(createApp())
            .post(`/api/orders/${orderId}/payments/simulate`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("Idempotency-Key");
        expect(Order.findOne).not.toHaveBeenCalled();
    });

    it("simula pagamento e aplica stock/carrinho apenas dentro da transação", async () => {
        const session = makeTransactionSession();
        const cart = makeCartDoc([makeCartItem()]);
        const order = makeOrder();
        vi.spyOn(mongoose, "startSession").mockResolvedValueOnce(session);
        Order.findOne.mockReturnValueOnce(querySelectSession(order));
        Cart.findOne.mockReturnValueOnce(querySession(cart));
        Product.find.mockReturnValueOnce(querySession([makeProduct()]));
        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockReturnValue(querySession(null)),
        });
        Product.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

        const response = await request(createApp())
            .post(`/api/orders/${orderId}/payments/simulate`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .set("Idempotency-Key", "mf3-simulated-payment-attempt")
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.order.payment).toMatchObject({
            mode: "simulated",
            status: "simulated_paid",
        });
        expect(response.body.order.payment.gateway).toBeUndefined();
        expect(Product.updateOne).toHaveBeenCalledWith(
            expect.objectContaining({ stock: { $gte: 2 } }),
            { $inc: { stock: -2 } },
            { session },
        );
        expect(Cart.deleteOne).toHaveBeenCalledWith(
            { _id: cart._id, userId },
            { session },
        );
        expect(order.paymentAttempts).toHaveLength(1);
        expect(session.endSession).toHaveBeenCalled();
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
        Cart.findOneAndUpdate
            .mockResolvedValueOnce(cart)
            .mockImplementationOnce(async () => {
                cart.items.push(makeCartItem());
                return cart;
            });

        const response = await request(createApp())
            .post(`/api/me/orders/${orderId}/reorder`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.cart.totalCents).toBe(2598);
        expect(Order.create).not.toHaveBeenCalled();
        expect(Cart.create).not.toHaveBeenCalled();
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
