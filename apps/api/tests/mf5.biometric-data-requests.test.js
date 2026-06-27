/**
 * Testes de integracao HTTP do BK-MF5-01.
 *
 * Cobrem criacao, revisao e efeitos de pedidos de privacidade biometrica sem
 * depender de MongoDB real. O foco e provar ownership por sessao, roles e
 * minimizacao das respostas.
 */
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { User } from "../src/models/user.model.js";
import { recordBiometricAccess } from "../src/services/biometric-audit.service.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findById: vi.fn(),
    },
}));

vi.mock("../src/models/biometric-data-request.model.js", () => ({
    BIOMETRIC_REQUEST_ACTIONS: {
        DELETE: "delete",
        ANONYMIZE: "anonymize",
    },
    BIOMETRIC_REQUEST_RESOURCES: {
        PHOTOS: "photos",
        REPORTS: "reports",
    },
    BIOMETRIC_REQUEST_STATUSES: {
        PENDING: "pending",
        PROCESSING: "processing",
        FAILED: "failed",
        REJECTED: "rejected",
        COMPLETED: "completed",
    },
    BiometricDataRequest: {
        create: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/services/biometric-audit.service.js", () => ({
    BIOMETRIC_AUDIT_ACTIONS: {
        LIST_REQUESTS: "list_requests",
        DECIDE_REQUEST: "decide_request",
        VIEW_AUDIT: "view_audit",
        VIEW_RESOURCE: "view_resource",
    },
    BIOMETRIC_AUDIT_RESOURCE_TYPES: {
        REQUEST: "request",
        PHOTO: "photo",
        REPORT: "report",
        AUDIT: "audit",
    },
    BIOMETRIC_AUDIT_RESULTS: {
        ALLOWED: "allowed",
        DENIED: "denied",
    },
    recordBiometricAccess: vi.fn(),
}));

const clienteId = "665f00000000000000000001";
const consultorId = "665f00000000000000000002";
const adminId = "665f00000000000000000003";
const requestId = "775f00000000000000000001";

/**
 * Cria cookie de sessao igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {{id: string, role: string, email?: string}} user - Utilizador de teste.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(user) {
    const token = createSessionToken({
        id: user.id,
        email: user.email ?? `${user.id}@orelle.test`,
        role: user.role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Simula query `sort().limit()`.
 *
 * @function querySortLimit
 * @param {unknown[]} result - Resultado final da query.
 * @returns {object} Query mock encadeavel.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Revalida a sessao contra estado persistido por utilizador.
 *
 * @function mockSessionAccounts
 * @param {Record<string, {role: string}>} accounts - Contas disponiveis.
 * @returns {void}
 */
function mockSessionAccounts(accounts) {
    User.findById.mockImplementation((userId) => ({
        select: vi.fn().mockResolvedValue({
            role: accounts[userId]?.role ?? ROLES.CLIENTE,
            isActive: true,
            accountStatus: "active",
        }),
    }));
}

/**
 * Cria documento de pedido compatível com o service.
 *
 * @function makeRequestDoc
 * @param {object} [overrides={}] - Campos a sobrepor no pedido.
 * @returns {object} Documento mock.
 */
function makeRequestDoc(overrides = {}) {
    return {
        _id: requestId,
        requesterId: clienteId,
        action: "delete",
        resources: ["photos"],
        reason: "Pedido RGPD",
        status: "pending",
        reviewerId: null,
        decisionReason: "",
        decisionError: "",
        createdAt: new Date("2026-06-22T10:00:00.000Z"),
        reviewedAt: null,
        completedAt: null,
        save: vi.fn(),
        ...overrides,
    };
}

describe("BK-MF5-01 - pedidos de privacidade biometrica", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccounts({
            [clienteId]: { role: ROLES.CLIENTE },
            [consultorId]: { role: ROLES.CONSULTOR },
            [adminId]: { role: ROLES.ADMIN },
        });
    });

    it("permite ao cliente criar pedido e ao consultor listar metadados", async () => {
        const requestDoc = makeRequestDoc();

        BiometricDataRequest.create.mockResolvedValue(requestDoc);
        BiometricDataRequest.find.mockReturnValue(querySortLimit([requestDoc]));

        const app = createApp();
        const created = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({
                action: "delete",
                resources: ["photos"],
                reason: "Pedido RGPD",
                requesterId: adminId,
            });

        expect(created.status).toBe(201);
        expect(created.body.request.requesterId).toBe(clienteId);
        expect(created.body.request.status).toBe("pending");
        expect(BiometricDataRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                requesterId: clienteId,
                action: "delete",
                resources: ["photos"],
            }),
        );

        const listed = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));

        expect(listed.status).toBe(200);
        expect(listed.body.requests).toHaveLength(1);
        expect(JSON.stringify(listed.body)).not.toContain("storageKey");
        expect(JSON.stringify(listed.body)).not.toContain("cosmeticSummary");
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: consultorId,
                actorRole: ROLES.CONSULTOR,
                action: "list_requests",
                resourceType: "request",
            }),
        );
    });

    it("bloqueia cliente no painel administrativo", async () => {
        const response = await request(createApp())
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }));

        expect(response.status).toBe(403);
        expect(BiometricDataRequest.find).not.toHaveBeenCalled();
    });

    it("bloqueia revisor a criar pedido em nome de cliente", async () => {
        const response = await request(createApp())
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ action: "delete", resources: ["photos"] });

        expect(response.status).toBe(403);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
    });

    it("bloqueia pedido sem recursos validos", async () => {
        const response = await request(createApp())
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: [] });

        expect(response.status).toBe(400);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
    });

    it("bloqueia criacao, listagem e decisao sem sessao", async () => {
        const app = createApp();

        const created = await request(app)
            .post("/api/me/biometric-data-requests")
            .send({ action: "delete", resources: ["photos"] });
        const listed = await request(app).get("/api/admin/biometric-data-requests");
        const decided = await request(app)
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(created.status).toBe(401);
        expect(listed.status).toBe(401);
        expect(decided.status).toBe(401);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
        expect(BiometricDataRequest.find).not.toHaveBeenCalled();
        expect(BiometricDataRequest.findById).not.toHaveBeenCalled();
    });

    it("recusa decidir novamente pedido ja fechado", async () => {
        BiometricDataRequest.findById.mockResolvedValue(
            makeRequestDoc({ status: "completed" }),
        );

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(409);
        expect(FacePhoto.updateMany).not.toHaveBeenCalled();
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: "decide_request",
                result: "denied",
            }),
        );
    });

    it("guarda rejeicao de pedido pendente sem alterar recursos biometricos", async () => {
        const rejectedRequest = makeRequestDoc();

        BiometricDataRequest.findById.mockResolvedValue(rejectedRequest);

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({
                decision: "rejected",
                decisionReason: "Pedido sem fundamento suficiente.",
            });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("rejected");
        expect(rejectedRequest.status).toBe("rejected");
        expect(rejectedRequest.decisionReason).toBe("Pedido sem fundamento suficiente.");
        expect(rejectedRequest.reviewerId).toBe(adminId);
        expect(rejectedRequest.reviewedAt).toBeInstanceOf(Date);
        expect(rejectedRequest.save).toHaveBeenCalledTimes(1);
        expect(FacePhoto.updateMany).not.toHaveBeenCalled();
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: "decide_request",
                resourceId: requestId,
                result: "allowed",
            }),
        );
    });

    it("aplica delete a fotografias e relatorios com estado recuperavel", async () => {
        const deleteRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(deleteRequest);
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 1 });
        FaceReport.updateMany.mockResolvedValue({ modifiedCount: 1 });

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("completed");
        expect(deleteRequest.save).toHaveBeenCalledTimes(2);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, status: "active" },
            { $set: { status: "deleted" } },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({
                    privacyStatus: "deleted",
                    routineSuggestions: [],
                }),
            }),
        );
    });

    it("aplica anonymize a fotografias e relatorios com efeitos distinguiveis", async () => {
        const anonymizeRequest = makeRequestDoc({
            action: "anonymize",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(anonymizeRequest);
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 1 });
        FaceReport.updateMany.mockResolvedValue({ modifiedCount: 1 });

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("completed");
        expect(anonymizeRequest.save).toHaveBeenCalledTimes(2);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonymizada",
                },
            },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({
                    privacyStatus: "anonymized",
                }),
            }),
        );
    });

    it("marca pedido como failed quando aplicacao de recursos falha sem transacao", async () => {
        const failingRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(failingRequest);
        FacePhoto.updateMany.mockRejectedValue(new Error("storage offline"));

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(500);
        expect(failingRequest.status).toBe("failed");
        expect(failingRequest.decisionError).toContain("Falha operacional");
        expect(failingRequest.save).toHaveBeenCalledTimes(2);
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
    });

    it("usa sessao transacional quando o runtime MongoDB a suporta", async () => {
        const session = {
            withTransaction: vi.fn(async (handler) => handler()),
            endSession: vi.fn(),
        };
        const startSessionSpy = vi
            .spyOn(mongoose, "startSession")
            .mockResolvedValue(session);
        const previousReadyState = mongoose.connection.readyState;
        const previousClient = mongoose.connection.client;
        const transactionRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos"],
        });

        Object.defineProperty(mongoose.connection, "readyState", {
            configurable: true,
            value: 1,
        });
        Object.defineProperty(mongoose.connection, "client", {
            configurable: true,
            value: {
                topology: {
                    description: {
                        type: "ReplicaSetWithPrimary",
                    },
                },
            },
        });

        BiometricDataRequest.findById.mockResolvedValue(transactionRequest);
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 1 });

        try {
            const response = await request(createApp())
                .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
                .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
                .send({ decision: "approved", decisionReason: "Pedido válido." });

            expect(response.status).toBe(200);
            expect(startSessionSpy).toHaveBeenCalled();
            expect(session.withTransaction).toHaveBeenCalled();
            expect(session.endSession).toHaveBeenCalled();
            expect(BiometricDataRequest.findById).toHaveBeenCalledWith(
                requestId,
                null,
                { session },
            );
            expect(FacePhoto.updateMany).toHaveBeenCalledWith(
                { userId: clienteId, status: "active" },
                { $set: { status: "deleted" } },
                { session },
            );
            expect(transactionRequest.save).toHaveBeenCalledWith({ session });
        } finally {
            startSessionSpy.mockRestore();
            Object.defineProperty(mongoose.connection, "readyState", {
                configurable: true,
                value: previousReadyState,
            });
            Object.defineProperty(mongoose.connection, "client", {
                configurable: true,
                value: previousClient,
            });
        }
    });
});
