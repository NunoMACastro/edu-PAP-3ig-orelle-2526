/**
 * Contratos HTTP dos pedidos canónicos de privacidade.
 *
 * A persistência, as transações e a eliminação física são exercitadas no
 * replica set por `privacy-requests.replset.integration.test.js`. Este ficheiro
 * isola routing, autenticação, autorização, validação e ownership no boundary
 * HTTP, evitando simular incorretamente transações Mongoose com mocks parciais.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AppError } from "../src/middlewares/error.middleware.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    createMyBiometricDataRequest,
    decideBiometricDataRequest,
    listBiometricDataRequestsForReview,
    listMyBiometricDataRequests,
    retryBiometricDataRequest,
} from "../src/services/biometric-data-request.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: { findById: vi.fn() },
}));

vi.mock("../src/services/biometric-data-request.service.js", () => ({
    createMyBiometricDataRequest: vi.fn(),
    decideBiometricDataRequest: vi.fn(),
    listBiometricDataRequestsForReview: vi.fn(),
    listMyBiometricDataRequests: vi.fn(),
    retryBiometricDataRequest: vi.fn(),
}));

const CLIENT_ID = "665f00000000000000000001";
const CONSULTANT_ID = "665f00000000000000000002";
const ADMIN_ID = "665f00000000000000000003";
const REQUEST_ID = "775f00000000000000000001";

/**
 * Cria um DTO público sem paths, bytes faciais ou conteúdo de relatório.
 *
 * @param {Partial<object>} [overrides] - Campos do cenário.
 * @returns {object} Pedido minimizado.
 */
function makeRequestDto(overrides = {}) {
    return {
        id: REQUEST_ID,
        requesterId: CLIENT_ID,
        scope: "biometric",
        action: "delete",
        resources: ["photos"],
        reason: "Pedido RGPD",
        status: "pending",
        attempts: 0,
        reviewerId: null,
        decisionReason: "",
        decisionError: "",
        createdAt: new Date("2026-07-10T08:00:00.000Z"),
        reviewedAt: null,
        lastAttemptAt: null,
        leaseExpiresAt: null,
        completedAt: null,
        ...overrides,
    };
}

/**
 * Cria o cookie opaco de compatibilidade usado apenas nos testes.
 *
 * @param {{id: string, role: string}} user - Identidade simulada.
 * @returns {string[]} Header Cookie.
 */
function cookieFor(user) {
    return [
        `orelle_session=${createSessionToken({
            id: user.id,
            email: `${user.id}@orelle.test`,
            role: user.role,
        })}`,
    ];
}

/**
 * Faz a revalidação de role exigida pelo middleware autenticado.
 *
 * @returns {void}
 */
function mockSessionAccounts() {
    const roles = {
        [CLIENT_ID]: ROLES.CLIENTE,
        [CONSULTANT_ID]: ROLES.CONSULTOR,
        [ADMIN_ID]: ROLES.ADMIN,
    };

    User.findById.mockImplementation((userId) => ({
        select: vi.fn().mockResolvedValue({
            role: roles[userId] ?? ROLES.CLIENTE,
            isActive: true,
            accountStatus: "active",
        }),
    }));
}

describe("MF5 - contratos HTTP canónicos de privacidade", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccounts();
        createMyBiometricDataRequest.mockResolvedValue(makeRequestDto());
        listMyBiometricDataRequests.mockResolvedValue([makeRequestDto()]);
        listBiometricDataRequestsForReview.mockResolvedValue([
            makeRequestDto(),
        ]);
        decideBiometricDataRequest.mockResolvedValue(
            makeRequestDto({ status: "completed", attempts: 1 }),
        );
        retryBiometricDataRequest.mockResolvedValue(
            makeRequestDto({ status: "completed", attempts: 2 }),
        );
    });

    it("cria pelo endpoint canónico com ownership exclusivo da sessão", async () => {
        const response = await request(createApp())
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }))
            .send({
                action: "delete",
                resources: ["photos", "photos"],
                reason: "  Pedido RGPD  ",
                requesterId: ADMIN_ID,
                storageKey: "/private/nao-pode-passar.enc",
            });

        expect(response.status).toBe(201);
        expect(response.body.request.requesterId).toBe(CLIENT_ID);
        expect(createMyBiometricDataRequest).toHaveBeenCalledWith(CLIENT_ID, {
            action: "delete",
            resources: ["photos"],
            reason: "Pedido RGPD",
        });
        expect(JSON.stringify(createMyBiometricDataRequest.mock.calls)).not.toContain(
            "storageKey",
        );
    });

    it("lista apenas o histórico do próprio titular", async () => {
        const response = await request(createApp())
            .get("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }));

        expect(response.status).toBe(200);
        expect(response.body.requests).toHaveLength(1);
        expect(listMyBiometricDataRequests).toHaveBeenCalledWith(CLIENT_ID);
    });

    it("reserva a fila destrutiva de privacidade ao administrador", async () => {
        const app = createApp();
        const consultant = await request(app)
            .get("/api/admin/privacy-requests")
            .set(
                "Cookie",
                cookieFor({ id: CONSULTANT_ID, role: ROLES.CONSULTOR }),
            );
        const admin = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }));

        expect(consultant.status).toBe(403);
        expect(admin.status).toBe(200);
        expect(listBiometricDataRequestsForReview).toHaveBeenCalledTimes(1);
        expect(listBiometricDataRequestsForReview).toHaveBeenCalledWith(
            expect.objectContaining({ id: ADMIN_ID, role: ROLES.ADMIN }),
        );
    });

    it("impede um consultor de decidir, repetir ou usar o alias destrutivo", async () => {
        const app = createApp();
        const cookie = cookieFor({
            id: CONSULTANT_ID,
            role: ROLES.CONSULTOR,
        });
        const [decision, retry, legacyDecision] = await Promise.all([
            request(app)
                .patch(`/api/admin/privacy-requests/${REQUEST_ID}`)
                .set("Cookie", cookie)
                .send({
                    decision: "approved",
                    decisionReason: "Sem autoridade administrativa.",
                }),
            request(app)
                .post(`/api/admin/privacy-requests/${REQUEST_ID}/retry`)
                .set("Cookie", cookie)
                .send({ decisionReason: "Sem autoridade administrativa." }),
            request(app)
                .patch(
                    `/api/admin/biometric-data-requests/${REQUEST_ID}/decision`,
                )
                .set("Cookie", cookie)
                .send({
                    decision: "approved",
                    decisionReason: "Sem autoridade administrativa.",
                }),
        ]);

        expect([decision.status, retry.status, legacyDecision.status]).toEqual([
            403, 403, 403,
        ]);
        expect(decideBiometricDataRequest).not.toHaveBeenCalled();
        expect(retryBiometricDataRequest).not.toHaveBeenCalled();
    });

    it("aceita PATCH canónico com ID no body sem o propagar para o input", async () => {
        const response = await request(createApp())
            .patch("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({
                requestId: REQUEST_ID,
                decision: "approved",
                decisionReason: "Pedido confirmado.",
                resources: ["reports"],
            });

        expect(response.status).toBe(200);
        expect(decideBiometricDataRequest).toHaveBeenCalledWith(
            REQUEST_ID,
            expect.objectContaining({ id: ADMIN_ID, role: ROLES.ADMIN }),
            {
                decision: "approved",
                decisionReason: "Pedido confirmado.",
            },
        );
    });

    it("aceita a variante REST e o retry explícito sem alterar ação/recursos", async () => {
        const app = createApp();
        const decided = await request(app)
            .patch(`/api/admin/privacy-requests/${REQUEST_ID}`)
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({
                decision: "rejected",
                decisionReason: "Pedido duplicado confirmado.",
            });
        const retried = await request(app)
            .post(`/api/admin/privacy-requests/${REQUEST_ID}/retry`)
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({
                decisionReason: "Retry operacional.",
                action: "delete",
                resources: ["reports"],
            });

        expect(decided.status).toBe(200);
        expect(retried.status).toBe(200);
        expect(retryBiometricDataRequest).toHaveBeenCalledWith(
            REQUEST_ID,
            expect.objectContaining({ id: ADMIN_ID, role: ROLES.ADMIN }),
            { decisionReason: "Retry operacional." },
        );
    });

    it("mantém os aliases históricos durante a migração de consumidores", async () => {
        const app = createApp();
        const created = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }))
            .send({ action: "anonymize", resources: ["reports"] });
        const listed = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }));
        const decided = await request(app)
            .patch(
                `/api/admin/biometric-data-requests/${REQUEST_ID}/decision`,
            )
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({
                decision: "approved",
                decisionReason: "Pedido confirmado.",
            });

        expect([created.status, listed.status, decided.status]).toEqual([
            201, 200, 200,
        ]);
    });

    it("bloqueia todos os contratos sem sessão", async () => {
        const app = createApp();
        const responses = await Promise.all([
            request(app)
                .post("/api/me/privacy-requests")
                .send({ action: "delete", resources: ["photos"] }),
            request(app).get("/api/me/privacy-requests"),
            request(app).get("/api/admin/privacy-requests"),
            request(app)
                .patch("/api/admin/privacy-requests")
                .send({
                    requestId: REQUEST_ID,
                    decision: "approved",
                }),
            request(app).post(
                `/api/admin/privacy-requests/${REQUEST_ID}/retry`,
            ),
        ]);

        expect(responses.map(({ status }) => status)).toEqual([
            401, 401, 401, 401, 401,
        ]);
        expect(createMyBiometricDataRequest).not.toHaveBeenCalled();
        expect(decideBiometricDataRequest).not.toHaveBeenCalled();
        expect(retryBiometricDataRequest).not.toHaveBeenCalled();
    });

    it("aplica a separação de roles no cliente e no painel de revisão", async () => {
        const app = createApp();
        const adminCreates = await request(app)
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({ action: "delete", resources: ["photos"] });
        const clientReviews = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }));

        expect(adminCreates.status).toBe(403);
        expect(clientReviews.status).toBe(403);
    });

    it("recusa ações, recursos e rejeições sem justificação válidos", async () => {
        const app = createApp();
        const invalidAction = await request(app)
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }))
            .send({ action: "export", resources: ["photos"] });
        const invalidResource = await request(app)
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: CLIENT_ID, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: ["orders"] });
        const invalidRejection = await request(app)
            .patch(`/api/admin/privacy-requests/${REQUEST_ID}`)
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({ decision: "rejected", decisionReason: "não" });

        expect([
            invalidAction.status,
            invalidResource.status,
            invalidRejection.status,
        ]).toEqual([400, 400, 400]);
        expect(createMyBiometricDataRequest).not.toHaveBeenCalled();
        expect(decideBiometricDataRequest).not.toHaveBeenCalled();
    });

    it("preserva o status controlado do serviço e não expõe a causa interna", async () => {
        decideBiometricDataRequest.mockRejectedValueOnce(
            new AppError(409, "Pedido já foi decidido."),
        );
        const conflict = await request(createApp())
            .patch(`/api/admin/privacy-requests/${REQUEST_ID}`)
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Confirmado." });

        decideBiometricDataRequest.mockRejectedValueOnce(
            new Error("segredo-interno-da-base"),
        );
        const failure = await request(createApp())
            .patch(`/api/admin/privacy-requests/${REQUEST_ID}`)
            .set("Cookie", cookieFor({ id: ADMIN_ID, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Confirmado." });

        expect(conflict.status).toBe(409);
        expect(conflict.body.error.message).toBe("Pedido já foi decidido.");
        expect(failure.status).toBe(500);
        expect(JSON.stringify(failure.body)).not.toContain(
            "segredo-interno-da-base",
        );
    });
});
