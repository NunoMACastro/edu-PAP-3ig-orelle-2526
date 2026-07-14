/**
 * Testes de integracao HTTP da MF4.
 *
 * Cobrem os contratos centrais de administracao, notificacoes, alertas de rotina
 * e restricoes cosmeticas, mantendo mocks de persistencia para nao depender de BD real.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { isUnsafeProductionSessionSecret } from "../src/config/env.js";
import { ROLES } from "../src/constants/roles.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Notification } from "../src/models/notification.model.js";
import { Order } from "../src/models/order.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../src/models/report-unlock.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { Review } from "../src/models/review.model.js";
import { RoutineAlertPreference } from "../src/models/routine-alert-preference.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { filterProductsBlockedByProfile } from "../src/services/recommendation-restrictions.service.js";

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: {
        ACTIVE: "active",
        SUSPENDED: "suspended",
        DELETED: "deleted",
    },
    User: {
        find: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/review.model.js", () => ({
    Review: {
        find: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        find: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/profile.model.js", () => ({
    Profile: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/ai-consultation-session.model.js", () => ({
    AI_CONSULTATION_FLOW_STATES: {
        COLLECTING_PHOTOS: "collecting_photos",
        ANALYZING: "analyzing",
        ASKING_QUESTIONS: "asking_questions",
        GENERATING_REPORT: "generating_report",
        FAILED_RETRYABLE: "failed_retryable",
    },
    AI_CONSULTATION_STATUS: {
        DRAFT: "draft",
        SUBMITTED: "submitted",
    },
    AiConsultationSession: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AiConsultationReview: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: {
        LOCKED: "locked",
        UNLOCKED: "unlocked",
    },
    ReportUnlock: {
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/notification.model.js", () => ({
    NOTIFICATION_TYPES: {
        PROMOTION: "promotion",
        NEW_PRODUCT: "new_product",
        ORDER_STATUS: "order_status",
        ROUTINE_ALERT: "routine_alert",
    },
    NOTIFICATION_TYPE_VALUES: [
        "promotion",
        "new_product",
        "order_status",
        "routine_alert",
    ],
    Notification: {
        find: vi.fn(),
        findOneAndUpdate: vi.fn(),
        insertMany: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock("../src/models/routine-alert-preference.model.js", () => ({
    RoutineAlertPreference: {
        find: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/daily-routine.model.js", () => ({
    DailyRoutine: {
        findOne: vi.fn(),
    },
}));

const adminId = "66f000000000000000000001";
const userId = "66f000000000000000000002";
const reviewId = "66f000000000000000000003";
const orderId = "66f000000000000000000004";
const notificationId = "66f000000000000000000005";
const reportId = "66f000000000000000000006";

/**
 * Cria um ObjectId minimo compativel com DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual do identificador.
 * @returns {{toString: () => string}} ObjectId mock.
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
 * Cria token de sessao para pedidos HTTP.
 *
 * @function makeToken
 * @param {string} role - Role a inserir na sessao.
 * @param {string} id - ID do utilizador autenticado.
 * @returns {string} Token opaco de sessao válido para os testes.
 */
function makeToken(role = ROLES.ADMIN, id = adminId) {
    return createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });
}

/**
 * Simula query `select().sort().limit()`.
 *
 * @function querySelectSortLimit
 * @param {unknown} result - Resultado resolvido.
 * @returns {object} Query mock encadeavel.
 */
function querySelectSortLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/** Simula query `select().lean()` usada por metadados v2 minimizados. */
function querySelectLean(result) {
    return {
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a query minimizada de encomendas administrativas.
 *
 * @param {unknown} result - Resultado resolvido.
 * @returns {object} Query mock encadeável com populate seguro.
 */
function querySelectPopulateSortLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query `sort().limit()`.
 *
 * @function querySortLimit
 * @param {unknown} result - Resultado resolvido.
 * @returns {object} Query mock encadeavel.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query `select().limit()`.
 *
 * @function querySelectLimit
 * @param {unknown} result - Resultado resolvido.
 * @returns {object} Query mock encadeavel.
 */
function querySelectLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query `sort()`.
 *
 * @function querySort
 * @param {unknown} result - Resultado resolvido.
 * @returns {object} Query mock encadeavel.
 */
function querySort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Define o estado persistido da conta consultado pelo middleware de sessao.
 *
 * @function mockSessionAccount
 * @param {object} [accountState={}] - Campos persistidos a devolver.
 * @returns {void}
 */
function mockSessionAccount(accountState = {}) {
    User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({
            role: ROLES.ADMIN,
            isActive: true,
            accountStatus: "active",
            ...accountState,
        }),
    });
}

describe("MF4 - integracao HTTP", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccount();
        AiConsultationSession.findOne.mockReturnValue({
            sort: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue(null),
        });
        AiConsultationReview.find.mockReturnValue(querySelectLean([]));
        ReportUnlock.find.mockReturnValue(querySelectLean([]));
        ReportUnlock.findOne.mockResolvedValue({
            _id: objectId("66f0000000000000000000f0"),
            reportId: objectId(reportId),
            status: REPORT_UNLOCK_STATUS.UNLOCKED,
            recommendedTotalCents: 3000,
            depositCents: 300,
            recommendationIds: [],
            unlockedAt: new Date("2026-06-18T12:00:00.000Z"),
        });
    });

    it("usa a role persistida em vez da role antiga guardada no token", async () => {
        mockSessionAccount({ role: ROLES.CLIENTE });

        const response = await request(createApp())
            .get("/api/admin/users")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.ADMIN, userId)}`]);

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe("Sem permissao para esta operacao");
        expect(User.find).not.toHaveBeenCalled();
    });

    it("bloqueia sessao existente quando a conta esta suspensa", async () => {
        mockSessionAccount({
            role: ROLES.CLIENTE,
            isActive: false,
            accountStatus: "suspended",
        });

        const response = await request(createApp())
            .get("/api/me/notifications")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE, userId)}`]);

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe(
            "Conta inativa. Contacta a equipa Orélle.",
        );
        expect(Notification.find).not.toHaveBeenCalled();
    });

    it("admin suspende e desativa reversivelmente sem expor passwordHash", async () => {
        User.findByIdAndUpdate
            .mockResolvedValueOnce({
                _id: objectId(userId),
                email: "cliente@orelle.test",
                role: ROLES.CLIENTE,
                isActive: false,
                accountStatus: "suspended",
                suspendedAt: new Date("2026-06-18T09:00:00.000Z"),
            })
            .mockResolvedValueOnce({
                _id: objectId(userId),
                email: "cliente@orelle.test",
                passwordHash: "nao-deve-sair",
                role: ROLES.CLIENTE,
                isActive: false,
                accountStatus: "suspended",
                suspendedAt: new Date("2026-06-18T10:00:00.000Z"),
                deletedAt: null,
            });

        const app = createApp();
        const cookie = `orelle_session=${makeToken()}`;
        const suspend = await request(app)
            .patch(`/api/admin/users/${userId}/status`)
            .set("Cookie", [cookie])
            .send({ status: "suspended" });
        const deactivated = await request(app)
            .delete(`/api/admin/users/${userId}`)
            .set("Cookie", [cookie]);

        expect(suspend.status).toBe(200);
        expect(suspend.body.user.accountStatus).toBe("suspended");
        expect(deactivated.status).toBe(200);
        expect(deactivated.body.user).toMatchObject({
            email: "cliente@orelle.test",
            accountStatus: "suspended",
            deletedAt: null,
        });
        expect(JSON.stringify(deactivated.body)).not.toContain("passwordHash");
    });

    it("admin modera review sem alterar comentario nem rating", async () => {
        Review.findByIdAndUpdate.mockResolvedValueOnce({
            _id: objectId(reviewId),
            productId: objectId("66f000000000000000000006"),
            userId: objectId(userId),
            rating: 4,
            comment: "Gostei do produto",
            status: "hidden",
            moderationReason: "Conteudo duplicado",
            moderatedBy: objectId(adminId),
            moderatedAt: new Date("2026-06-18T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .patch(`/api/admin/reviews/${reviewId}`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ status: "hidden", moderationReason: "Conteudo duplicado" });

        expect(response.status).toBe(200);
        expect(response.body.review.status).toBe("hidden");
        expect(response.body.review.comment).toBe("Gostei do produto");
        expect(response.body.review.rating).toBe(4);
        expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
            reviewId,
            expect.objectContaining({ status: "hidden", moderatedBy: adminId }),
            expect.any(Object),
        );
    });

    it("exporta utilizadores em CSV minimizado", async () => {
        User.find.mockReturnValueOnce(
            querySelectSortLimit([
                {
                    _id: objectId(userId),
                    email: "cliente@orelle.test",
                    passwordHash: "nao-deve-sair",
                    role: ROLES.CLIENTE,
                    isActive: true,
                    accountStatus: "active",
                    createdAt: new Date("2026-06-18T10:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get("/api/admin/exports/users?format=csv")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/csv");
        expect(response.headers["content-disposition"]).toBe(
            'attachment; filename="users.csv"',
        );
        expect(response.headers["x-orelle-export-rows"]).toBe("1");
        expect(response.text).toContain("cliente@orelle.test");
        expect(response.text).not.toContain("passwordHash");
        expect(response.text).not.toContain("nao-deve-sair");
    });

    it("exporta apenas relatorios ativos em CSV minimizado", async () => {
        FaceReport.find.mockReturnValueOnce(
            querySelectSortLimit([
                {
                    _id: objectId(reportId),
                    userId: objectId(userId),
                    analysisId: objectId("66f000000000000000000007"),
                    cosmeticSummary: "Resumo ativo.",
                    sources: ["fotografia_frontal"],
                    limitations: ["Nao e diagnostico medico."],
                    createdAt: new Date("2026-06-18T10:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get("/api/admin/exports/ai-reports?format=csv")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(FaceReport.find).toHaveBeenCalledWith({ privacyStatus: "active" });
        expect(response.headers["x-orelle-export-rows"]).toBe("1");
        expect(response.headers["cache-control"]).toBe(
            "private, no-store, max-age=0",
        );
        expect(response.headers.pragma).toBe("no-cache");
        expect(response.text).not.toContain("Resumo ativo.");
        expect(response.text).not.toContain(userId);
        expect(response.text).not.toContain("66f000000000000000000007");
        expect(response.text).not.toContain("fotografia_frontal");
        expect(response.text).not.toContain("Nao e diagnostico medico.");
        expect(response.text).not.toContain("privacyStatus");
    });

    it("cliente lista notificacoes proprias e marca apenas por ownership", async () => {
        mockSessionAccount({ role: ROLES.CLIENTE });
        Notification.find.mockReturnValueOnce(
            querySortLimit([
                {
                    _id: objectId(notificationId),
                    type: "promotion",
                    title: "Promoção",
                    message: "Nova campanha interna",
                    isRead: false,
                    metadata: new Map([["source", "admin_campaign"]]),
                    createdAt: new Date("2026-06-18T10:00:00.000Z"),
                },
            ]),
        );
        Notification.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId(notificationId),
            type: "promotion",
            title: "Promoção",
            message: "Nova campanha interna",
            isRead: true,
            readAt: new Date("2026-06-18T11:00:00.000Z"),
            metadata: new Map(),
        });

        const app = createApp();
        const cookie = `orelle_session=${makeToken(ROLES.CLIENTE, userId)}`;
        const list = await request(app)
            .get("/api/me/notifications")
            .set("Cookie", [cookie]);
        const read = await request(app)
            .patch(`/api/me/notifications/${notificationId}/read`)
            .set("Cookie", [cookie]);

        expect(list.status).toBe(200);
        expect(list.body.notifications).toHaveLength(1);
        expect(read.status).toBe(200);
        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: notificationId, userId },
            expect.any(Object),
            expect.any(Object),
        );
    });

    it("admin cria campanha de notificacoes para role alvo", async () => {
        User.find.mockReturnValueOnce(
            querySelectLimit([{ _id: objectId(userId) }, { _id: objectId(adminId) }]),
        );
        Notification.insertMany.mockResolvedValueOnce([]);

        const response = await request(createApp())
            .post("/api/admin/notifications/campaigns")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                type: "promotion",
                title: "Campanha Junho",
                message: "Novos produtos disponíveis.",
                targetRole: ROLES.CLIENTE,
            });

        expect(response.status).toBe(201);
        expect(response.body.createdCount).toBe(2);
        expect(Notification.insertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ type: "promotion" }),
            ]),
        );
    });

    it("admin lista encomendas minimizadas com o proximo passo logistico", async () => {
        Order.find.mockReturnValueOnce(
            querySelectPopulateSortLimit([
                {
                    _id: objectId(orderId),
                    userId: {
                        _id: objectId(userId),
                        email: "cliente@orelle.test",
                    },
                    items: [
                        {
                            productId: objectId("66f000000000000000000099"),
                            name: "Sérum Orélle",
                            quantity: 2,
                            unitPriceCents: 2000,
                            lineTotalCents: 4000,
                        },
                    ],
                    subtotalCents: 4000,
                    discountCents: 0,
                    totalCents: 4000,
                    status: "pendente",
                    payment: {
                        mode: "simulated",
                        status: "simulated_paid",
                        idempotencyKeyHash: "nao-deve-sair",
                    },
                    createdAt: new Date("2026-06-18T10:00:00.000Z"),
                    updatedAt: new Date("2026-06-18T10:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get("/api/admin/orders")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.orders[0]).toMatchObject({
            customerEmail: "cliente@orelle.test",
            status: "pendente",
            nextStatus: "enviado",
            itemCount: 2,
        });
        expect(JSON.stringify(response.body)).not.toContain("userId");
        expect(JSON.stringify(response.body)).not.toContain("productId");
        expect(JSON.stringify(response.body)).not.toContain("idempotencyKeyHash");
    });

    it("cliente não consegue listar encomendas administrativas", async () => {
        mockSessionAccount({ role: ROLES.CLIENTE });

        const response = await request(createApp())
            .get("/api/admin/orders")
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.CLIENTE, userId)}`,
            ]);

        expect(response.status).toBe(403);
        expect(Order.find).not.toHaveBeenCalled();
    });

    it("rejeita ID malformado antes de iniciar a transicao logistica", async () => {
        const response = await request(createApp())
            .patch("/api/admin/orders/encomenda-invalida/status")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ status: "enviado" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("ID de encomenda invalido");
    });

    it("admin executa alertas de rotina devidos com now ISO controlado", async () => {
        const preference = {
            _id: objectId("66f000000000000000000007"),
            userId: objectId(userId),
            enabled: true,
            eveningTime: "21:00",
            lastNotificationKey: null,
            save: vi.fn().mockResolvedValue(undefined),
        };

        RoutineAlertPreference.find.mockReturnValueOnce(querySortLimit([preference]));
        RoutineAlertPreference.findOneAndUpdate.mockResolvedValueOnce(preference);
        DailyRoutine.findOne.mockResolvedValueOnce({
            _id: objectId("66f000000000000000000008"),
            userId: objectId(userId),
        });
        Notification.create.mockResolvedValueOnce({
            _id: objectId(notificationId),
            userId: objectId(userId),
            type: "routine_alert",
            title: "Rotina noturna",
            message: "Está na hora da tua rotina cosmética noturna.",
            isRead: false,
            metadata: new Map(),
        });

        const response = await request(createApp())
            .post("/api/admin/routine-alerts/run")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ now: "2026-06-18T21:30:00.000Z" });

        expect(response.status).toBe(200);
        expect(response.body.createdCount).toBe(1);
        expect(RoutineAlertPreference.find).toHaveBeenCalledWith({
            enabled: true,
            eveningTime: { $lte: "21:30" },
            lastNotificationKey: { $ne: "2026-06-18" },
        });
        expect(Notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "routine_alert",
                metadata: { source: "routine_alert", dayKey: "2026-06-18" },
            }),
        );
        expect(RoutineAlertPreference.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: preference._id,
                lastNotificationKey: { $ne: "2026-06-18" },
            }),
            { $set: { lastNotificationKey: "2026-06-18" } },
            { new: true },
        );
    });

    it("rejeita now invalido na execucao admin de alertas", async () => {
        const response = await request(createApp())
            .post("/api/admin/routine-alerts/run")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ now: "data-invalida" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Execucao de alertas invalida");
        expect(RoutineAlertPreference.find).not.toHaveBeenCalled();
    });

    it("filtra recomendacoes que violam alergias ou ingredientes a evitar", () => {
        const allowedProduct = {
            _id: objectId("66f000000000000000000009"),
            ingredientNames: ["niacinamida", "zinco"],
        };
        const blockedByAllergy = {
            _id: objectId("66f000000000000000000010"),
            ingredientNames: ["retinol"],
        };
        const blockedByAvoidance = {
            _id: objectId("66f000000000000000000011"),
            ingredientNames: ["oleo mineral"],
        };

        const result = filterProductsBlockedByProfile(
            [allowedProduct, blockedByAllergy, blockedByAvoidance],
            {
                allergies: ["Retinol"],
                avoidIngredients: ["Óleo mineral"],
                lightMedicalRestrictions: [],
            },
        );

        expect(result).toEqual([allowedProduct]);
    });

    it("não executa o ranking antigo fora da consulta canónica", async () => {
        mockSessionAccount({ role: ROLES.CLIENTE });

        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE, userId)}`]);

        expect(response.status).toBe(404);
        expect(FaceAnalysis.findOne).not.toHaveBeenCalled();
        expect(FaceReport.findOne).not.toHaveBeenCalled();
        expect(Profile.findOne).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("marca segredos de sessao placeholder ou curtos como inseguros para producao", () => {
        expect(
            isUnsafeProductionSessionSecret("change-me-use-a-long-random-string"),
        ).toBe(true);
        expect(isUnsafeProductionSessionSecret("secret")).toBe(true);
        expect(isUnsafeProductionSessionSecret("a".repeat(64))).toBe(false);
    });
});
