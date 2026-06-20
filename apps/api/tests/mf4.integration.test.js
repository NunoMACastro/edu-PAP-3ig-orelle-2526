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
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Notification } from "../src/models/notification.model.js";
import { Order } from "../src/models/order.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { Review } from "../src/models/review.model.js";
import { RoutineAlertPreference } from "../src/models/routine-alert-preference.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { filterProductsBlockedByProfile } from "../src/services/recommendation-restrictions.service.js";

vi.mock("../src/models/user.model.js", () => ({
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

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        findOneAndUpdate: vi.fn(),
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

/**
 * Cria um ObjectId minimo compativel com DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual do identificador.
 * @returns {{toString: () => string}} ObjectId mock.
 */
function objectId(id) {
    return {
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
 * @returns {string} JWT de sessao.
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

    it("admin suspende e elimina logicamente contas sem expor passwordHash", async () => {
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
                email: `deleted-${userId}@orelle.local`,
                passwordHash: "nao-deve-sair",
                role: ROLES.CLIENTE,
                isActive: false,
                accountStatus: "deleted",
                deletedAt: new Date("2026-06-18T10:00:00.000Z"),
            });

        const app = createApp();
        const cookie = `orelle_session=${makeToken()}`;
        const suspend = await request(app)
            .patch(`/api/admin/users/${userId}/status`)
            .set("Cookie", [cookie])
            .send({ status: "suspended" });
        const deleted = await request(app)
            .delete(`/api/admin/users/${userId}`)
            .set("Cookie", [cookie]);

        expect(suspend.status).toBe(200);
        expect(suspend.body.user.accountStatus).toBe("suspended");
        expect(deleted.status).toBe(200);
        expect(deleted.body.user.accountStatus).toBe("deleted");
        expect(JSON.stringify(deleted.body)).not.toContain("passwordHash");
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
        expect(preference.save).toHaveBeenCalled();
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

    it("gera recomendacoes sem persistir nem devolver produto bloqueado por alergia", async () => {
        mockSessionAccount({ role: ROLES.CLIENTE });

        const analysisId = "66f000000000000000000012";
        const reportId = "66f000000000000000000013";
        const blockedProductId = "66f000000000000000000014";
        const allowedProductIds = [
            "66f000000000000000000015",
            "66f000000000000000000016",
            "66f000000000000000000017",
        ];
        const products = [
            {
                _id: objectId(blockedProductId),
                name: "Serum Retinol Acne",
                brandName: "Orelle",
                description: "Tratamento para acne e pele oleosa",
                ingredientNames: ["retinol", "niacinamida"],
                skinTypes: ["oleosa"],
                imageUrl: "https://cdn.orelle.test/retinol.jpg",
                priceCents: 2990,
                stock: 8,
            },
            {
                _id: objectId(allowedProductIds[0]),
                name: "Gel Niacinamida Acne",
                brandName: "Orelle",
                description: "Ajuda em acne e oleosidade",
                ingredientNames: ["niacinamida", "zinco"],
                skinTypes: ["oleosa"],
                imageUrl: "https://cdn.orelle.test/niacinamida.jpg",
                priceCents: 1990,
                stock: 10,
            },
            {
                _id: objectId(allowedProductIds[1]),
                name: "Serum Manchas",
                brandName: "Orelle",
                description: "Cuidado para manchas",
                ingredientNames: ["vitamina c", "acido hialuronico"],
                skinTypes: ["oleosa"],
                imageUrl: "https://cdn.orelle.test/manchas.jpg",
                priceCents: 2490,
                stock: 6,
            },
            {
                _id: objectId(allowedProductIds[2]),
                name: "Creme Rugas",
                brandName: "Orelle",
                description: "Suporte cosmetico para rugas",
                ingredientNames: ["peptidos", "ceramidas"],
                skinTypes: ["oleosa"],
                imageUrl: "https://cdn.orelle.test/rugas.jpg",
                priceCents: 2790,
                stock: 5,
            },
        ];
        const productsById = new Map(
            products.map((product) => [product._id.toString(), product]),
        );

        FaceAnalysis.findOne.mockReturnValueOnce(
            querySort({
                _id: objectId(analysisId),
                findings: {
                    skinType: { label: "oleosa" },
                    oleosidade: { label: "alto" },
                    acne: { label: "alto" },
                    manchas: { label: "alto" },
                    rugas: { label: "moderado" },
                },
            }),
        );
        FaceReport.findOne.mockReturnValueOnce(
            querySort({
                _id: objectId(reportId),
                userId: objectId(userId),
                analysisId: objectId(analysisId),
                limitations: ["Evitar ingredientes declarados no perfil."],
            }),
        );
        Profile.findOne.mockResolvedValueOnce({
            userId: objectId(userId),
            allergies: ["retinol"],
            avoidIngredients: [],
            lightMedicalRestrictions: ["pele reativa"],
        });
        Product.find.mockReturnValueOnce(querySelectLimit(products));
        ProductRecommendation.findOneAndUpdate.mockImplementation((filter, update) => ({
            populate: vi.fn().mockResolvedValue({
                _id: objectId(`77${filter.productId.toString().slice(2)}`),
                productId: productsById.get(filter.productId.toString()),
                score: update.$set.score,
                reasonCodes: update.$set.reasonCodes,
                explanation: update.$set.explanation,
                limitations: update.$set.limitations,
                status: update.$set.status,
                feedback: update.$set.feedback,
                consultantNote: update.$set.consultantNote,
                createdAt: new Date("2026-06-18T12:00:00.000Z"),
                updatedAt: new Date("2026-06-18T12:00:00.000Z"),
            }),
        }));

        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE, userId)}`]);

        expect(response.status).toBe(201);
        expect(response.body.recommendations).toHaveLength(3);
        expect(JSON.stringify(response.body.recommendations)).not.toContain(
            "Serum Retinol Acne",
        );
        expect(ProductRecommendation.findOneAndUpdate).toHaveBeenCalledTimes(3);
        expect(
            ProductRecommendation.findOneAndUpdate.mock.calls.some(
                ([filter]) => filter.productId.toString() === blockedProductId,
            ),
        ).toBe(false);
    });

    it("marca segredos de sessao placeholder ou curtos como inseguros para producao", () => {
        expect(
            isUnsafeProductionSessionSecret("change-me-use-a-long-random-string"),
        ).toBe(true);
        expect(isUnsafeProductionSessionSecret("secret")).toBe(true);
        expect(isUnsafeProductionSessionSecret("a".repeat(64))).toBe(false);
    });
});
