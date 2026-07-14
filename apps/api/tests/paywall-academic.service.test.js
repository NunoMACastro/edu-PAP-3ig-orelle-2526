/**
 * Testes focados da paywall académica de relatórios IA.
 */
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cart } from "../src/models/cart.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../src/models/report-unlock.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { clearCart } from "../src/services/cart.service.js";
import { checkoutMyCart } from "../src/services/order.service.js";
import {
    assertLatestReportUnlockedForRecommendations,
    ensureReportUnlockForRecommendations,
    unlockReportWithSimulatedPayment,
} from "../src/services/report-unlock.service.js";
import {
    consumeVoucherDiscount,
    createVoucherForReportUnlock,
    previewBestVoucherDiscount,
} from "../src/services/voucher.service.js";

vi.mock("../src/models/cart.model.js", () => ({
    Cart: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        create: vi.fn(),
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: {
        LOCKED: "locked",
        UNLOCKED: "unlocked",
    },
    ReportUnlock: {
        create: vi.fn(),
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/voucher.model.js", () => ({
    VOUCHER_STATUS: {
        ACTIVE: "active",
        USED: "used",
    },
    Voucher: {
        create: vi.fn(),
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/services/cart.service.js", () => ({
    clearCart: vi.fn(),
}));

const userId = "66c000000000000000000510";
const otherUserId = "66c000000000000000000511";
const reportId = "66c000000000000000000520";
const analysisId = "66c000000000000000000521";
const unlockId = "66c000000000000000000522";
const voucherId = "66c000000000000000000523";
const orderId = "66c000000000000000000524";
const productId = "66c000000000000000000525";
const cartId = "66c000000000000000000526";

/**
 * Simula um ObjectId mínimo para DTOs e snapshots.
 *
 * @function objectId
 * @param {string} id - Texto devolvido por `toString`.
 * @returns {{toString: Function}} Identificador mock.
 */
function objectId(id) {
    return {
        /**
         * Devolve o valor textual do identificador.
         *
         * @function toString
         * @returns {string} ID mock.
         */
        toString() {
            return id;
        },
    };
}

/** Cria query thenable com suporte aos modifiers usados pelo service. */
function queryResult(value) {
    return {
        select: vi.fn().mockReturnThis(),
        session: vi.fn().mockReturnThis(),
        then(resolve, reject) {
            return Promise.resolve(value).then(resolve, reject);
        },
    };
}

/**
 * Cria documento mock de desbloqueio com método `save`.
 *
 * @function makeUnlock
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Documento ReportUnlock mock.
 */
function makeUnlock(overrides = {}) {
    return {
        _id: objectId(unlockId),
        userId,
        analysisId: objectId(analysisId),
        reportId: objectId(reportId),
        recommendationIds: [objectId("66c000000000000000000527")],
        recommendedTotalCents: 3298,
        depositCents: 330,
        status: REPORT_UNLOCK_STATUS.LOCKED,
        simulatedPayment: {
            status: "not_started",
            amountCents: 0,
            confirmedAt: null,
            reference: null,
        },
        unlockedAt: null,
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/**
 * Cria voucher académico mock.
 *
 * @function makeVoucher
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Documento Voucher mock.
 */
function makeVoucher(overrides = {}) {
    return {
        _id: objectId(voucherId),
        userId,
        code: "ORELLE-00000522",
        amountCents: 330,
        remainingCents: 330,
        status: "active",
        sourceReportUnlockId: objectId(unlockId),
        appliedOrderIds: [],
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe("paywall académica de relatórios IA", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        clearCart.mockResolvedValue(undefined);
    });

    it("cria gate locked por defeito e calcula depósito de 10% arredondado por excesso", async () => {
        const recommendations = [
            {
                id: objectId("66c000000000000000000527"),
                product: { priceCents: 1299 },
            },
            {
                id: objectId("66c000000000000000000528"),
                product: { priceCents: 1999 },
            },
        ];

        const createdUnlock = makeUnlock({
            recommendationIds: [
                objectId("66c000000000000000000527"),
                objectId("66c000000000000000000528"),
            ],
        });
        ReportUnlock.findOneAndUpdate
            .mockResolvedValueOnce(createdUnlock)
            .mockResolvedValueOnce(createdUnlock);

        const unlock = await ensureReportUnlockForRecommendations({
            userId,
            analysisId: objectId(analysisId),
            reportId: objectId(reportId),
            recommendations,
        });

        expect(unlock).toMatchObject({
            recommendedTotalCents: 3298,
            depositCents: 330,
            status: "locked",
        });
        expect(unlock.recommendationIds).toHaveLength(2);
        expect(ReportUnlock.findOneAndUpdate).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                userId,
                reportId: expect.anything(),
            }),
            expect.objectContaining({
                $setOnInsert: expect.objectContaining({
                    userId,
                    recommendedTotalCents: 3298,
                    depositCents: 330,
                    status: "locked",
                }),
            }),
            expect.objectContaining({ upsert: true }),
        );
        expect(ReportUnlock.create).not.toHaveBeenCalled();
    });

    it("devolve apenas metadata segura quando recomendações estão bloqueadas", async () => {
        ReportUnlock.findOne.mockReturnValueOnce(queryResult(makeUnlock()));

        const access = await assertLatestReportUnlockedForRecommendations(userId, {
            _id: objectId(reportId),
        });

        expect(access).toMatchObject({
            locked: true,
            recommendations: [],
            access: {
                status: "locked",
                recommendedTotalCents: 3298,
                depositCents: 330,
                recommendationCount: 1,
            },
        });
        expect(JSON.stringify(access)).not.toContain("product");
        expect(JSON.stringify(access)).not.toContain("explanation");
    });

    it("desbloqueia apenas reports do próprio utilizador e é idempotente", async () => {
        const idempotencyKey = "report-simulation-key-001";
        const idempotencyKeyHash = createHash("sha256")
            .update(idempotencyKey)
            .digest("hex");
        const lockedUnlock = makeUnlock();
        const alreadyUnlocked = makeUnlock({
            status: REPORT_UNLOCK_STATUS.UNLOCKED,
            unlockedAt: new Date("2026-07-01T10:00:00.000Z"),
            simulatedPayment: {
                status: "simulated_paid",
                amountCents: 330,
                confirmedAt: new Date("2026-07-01T10:00:00.000Z"),
                reference: "simulated-report-00000522",
                idempotencyKeyHash,
            },
        });

        ReportUnlock.findOne
            .mockReturnValueOnce(queryResult(null))
            .mockReturnValueOnce(queryResult(lockedUnlock))
            .mockReturnValueOnce(queryResult(alreadyUnlocked));
        ReportUnlock.findOneAndUpdate.mockReturnValueOnce(
            queryResult(alreadyUnlocked),
        );

        await expect(
            unlockReportWithSimulatedPayment(
                otherUserId,
                reportId,
                idempotencyKey,
            ),
        ).rejects.toMatchObject({ statusCode: 404 });

        const unlocked = await unlockReportWithSimulatedPayment(
            userId,
            reportId,
            idempotencyKey,
        );
        const repeated = await unlockReportWithSimulatedPayment(
            userId,
            reportId,
            idempotencyKey,
        );

        expect(ReportUnlock.findOne).toHaveBeenCalledWith({
            userId: otherUserId,
            reportId,
        });
        expect(unlocked.status).toBe("unlocked");
        expect(unlocked.simulatedPayment).toMatchObject({
            status: "simulated_paid",
            amountCents: 330,
        });
        expect(repeated).toBe(alreadyUnlocked);
        expect(alreadyUnlocked.save).not.toHaveBeenCalled();
        expect(ReportUnlock.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("cria no máximo um voucher por report desbloqueado", async () => {
        const unlock = makeUnlock({ status: REPORT_UNLOCK_STATUS.UNLOCKED });
        const existingVoucher = makeVoucher();

        Voucher.findOneAndUpdate
            .mockResolvedValueOnce({
                ...existingVoucher,
                createdAt: new Date("2026-07-01T10:00:00.000Z"),
                updatedAt: new Date("2026-07-01T10:00:00.000Z"),
            })
            .mockResolvedValueOnce(existingVoucher);

        const created = await createVoucherForReportUnlock(userId, unlock);
        const repeated = await createVoucherForReportUnlock(userId, unlock);

        expect(created).toMatchObject({
            code: "ORELLE-00000522",
            amountCents: 330,
            remainingCents: 330,
            status: "active",
        });
        expect(repeated).toMatchObject({ id: voucherId });
        expect(Voucher.findOneAndUpdate).toHaveBeenCalledWith(
            {
                userId,
                sourceReportUnlockId: unlock._id,
            },
            expect.objectContaining({
                $setOnInsert: expect.objectContaining({
                    amountCents: 330,
                    remainingCents: 330,
                }),
            }),
            expect.objectContaining({ upsert: true }),
        );
        expect(Voucher.create).not.toHaveBeenCalled();
    });

    it("faz preview do voucher sem o consumir antes da simulação", async () => {
        const voucher = makeVoucher({ remainingCents: 500 });
        const cart = {
            _id: objectId(cartId),
            items: [{ productId: objectId(productId), quantity: 1 }],
        };
        const product = {
            _id: objectId(productId),
            name: "Creme leve",
            priceCents: 300,
            stock: 3,
        };

        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue(voucher),
        });
        Cart.findOne.mockResolvedValueOnce(cart);
        Product.find.mockResolvedValueOnce([product]);
        Order.findOneAndUpdate.mockResolvedValueOnce(null);
        Order.findOne.mockResolvedValueOnce(null);
        Order.create.mockImplementationOnce(async (payload) => ({
            _id: objectId(orderId),
            ...payload,
            createdAt: new Date("2026-07-01T10:00:00.000Z"),
            updatedAt: new Date("2026-07-01T10:00:00.000Z"),
            save: vi.fn().mockResolvedValue(undefined),
        }));
        const order = await checkoutMyCart(userId);

        expect(order.subtotalCents).toBe(300);
        expect(order.discountCents).toBe(300);
        expect(order.totalCents).toBe(0);
        expect(order.payment).toMatchObject({
            mode: "simulated",
            status: "awaiting_simulation",
            simulationReference: null,
            simulatedAt: null,
        });
        expect(order.voucher).toMatchObject({
            code: "ORELLE-00000522",
            amountCents: 300,
        });
        expect(voucher.remainingCents).toBe(500);
        expect(Voucher.findOneAndUpdate).not.toHaveBeenCalled();
        expect(clearCart).not.toHaveBeenCalled();
    });

    it("não consome duas vezes o mesmo voucher para a mesma encomenda", async () => {
        const repeatedOrderId = objectId(orderId);
        const voucher = makeVoucher({
            remainingCents: 200,
            appliedOrderIds: [repeatedOrderId],
        });
        Voucher.findOneAndUpdate.mockResolvedValueOnce(null);

        await consumeVoucherDiscount(voucher, 100, repeatedOrderId);

        expect(voucher.remainingCents).toBe(200);
        expect(voucher.save).not.toHaveBeenCalled();
        expect(Voucher.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: voucher._id,
                appliedOrderIds: { $ne: repeatedOrderId },
            }),
            expect.any(Array),
            expect.objectContaining({ new: true }),
        );
    });

    it("faz preview do voucher ativo sem ultrapassar o subtotal", async () => {
        Voucher.findOne.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue(makeVoucher({ remainingCents: 5000 })),
        });

        const preview = await previewBestVoucherDiscount(userId, 1200);

        expect(preview.discountCents).toBe(1200);
        expect(preview.finalTotalCents).toBe(0);
    });
});
