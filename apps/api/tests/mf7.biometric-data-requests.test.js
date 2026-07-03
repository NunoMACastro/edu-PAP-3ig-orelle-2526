/**
 * Testes de integracao HTTP do BK-MF7-02.
 *
 * Cobrem o direito RNF13 a eliminacao/anonimizacao de dados biometricos com
 * ownership por sessao, decisao autorizada, auditoria e respostas minimizadas.
 */
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
 * Simula query Mongoose `sort().limit()`.
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
 * Cria documento de pedido compativel com o service real.
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
        resources: ["photos", "reports"],
        reason: "Pedido RGPD",
        status: "pending",
        reviewerId: null,
        decisionReason: "",
        decisionError: "",
        createdAt: new Date("2026-06-29T10:00:00.000Z"),
        reviewedAt: null,
        completedAt: null,
        save: vi.fn(),
        ...overrides,
    };
}

describe("BK-MF7-02 - direito a eliminar conta e dados biometricos", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccounts({
            [clienteId]: { role: ROLES.CLIENTE },
            [consultorId]: { role: ROLES.CONSULTOR },
            [adminId]: { role: ROLES.ADMIN },
        });
    });

    it("cria pedido pelo proprio cliente e ignora requesterId enviado no body", async () => {
        const requestDoc = makeRequestDoc();

        BiometricDataRequest.create.mockResolvedValue(requestDoc);

        const response = await request(createApp())
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({
                action: "delete",
                resources: ["photos", "reports"],
                reason: "Pedido RGPD",
                requesterId: adminId,
            });

        expect(response.status).toBe(201);
        expect(response.body.request.requesterId).toBe(clienteId);
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain("cosmeticSummary");
        expect(JSON.stringify(response.body)).not.toContain("passwordHash");
        expect(BiometricDataRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                requesterId: clienteId,
                action: "delete",
                resources: ["photos", "reports"],
            }),
        );
    });

    it("lista apenas metadados para consultor e regista auditoria RF44", async () => {
        BiometricDataRequest.find.mockReturnValue(
            querySortLimit([makeRequestDoc()]),
        );

        const response = await request(createApp())
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));

        expect(response.status).toBe(200);
        expect(response.body.requests).toHaveLength(1);
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain("limitations");
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: consultorId,
                actorRole: ROLES.CONSULTOR,
                action: "list_requests",
                resourceType: "request",
            }),
        );
    });

    it("bloqueia negativos de sessao, role e recursos invalidos", async () => {
        const app = createApp();

        const semSessao = await request(app)
            .post("/api/me/biometric-data-requests")
            .send({ action: "delete", resources: ["photos"] });
        const adminCriaPedido = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ action: "delete", resources: ["photos"] });
        const clienteListaPainel = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }));
        const recursoInvalido = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: ["payments"] });

        expect(semSessao.status).toBe(401);
        expect(adminCriaPedido.status).toBe(403);
        expect(clienteListaPainel.status).toBe(403);
        expect(recursoInvalido.status).toBe(400);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
        expect(BiometricDataRequest.find).not.toHaveBeenCalled();
    });

    it("aprova delete com ownership por requesterId e estados de privacidade", async () => {
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
            .send({ decision: "approved", decisionReason: "Pedido valido." });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("completed");
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
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                subjectUserId: clienteId,
                action: "decide_request",
                result: "allowed",
            }),
        );
    });

    it("aprova anonymize sem expor conteudo pessoal util", async () => {
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
            .send({ decision: "approved", decisionReason: "Pedido valido." });

        expect(response.status).toBe(200);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonimizada",
                },
            },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({
                    privacyStatus: "anonymized",
                    cosmeticSummary: "Relatório anonimizado a pedido do utilizador.",
                }),
            }),
        );
    });

    it("devolve 404 para pedido inexistente e 409 para pedido ja decidido", async () => {
        BiometricDataRequest.findById.mockResolvedValueOnce(null);

        const inexistente = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido valido." });

        BiometricDataRequest.findById.mockResolvedValueOnce(
            makeRequestDoc({ status: "completed" }),
        );

        const fechado = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido valido." });

        expect(inexistente.status).toBe(404);
        expect(fechado.status).toBe(409);
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

    it("mantem pedido failed quando a aplicacao aos recursos falha sem transacao", async () => {
        const failingRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(failingRequest);
        FacePhoto.updateMany.mockRejectedValue(new Error("storage offline"));

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido valido." });

        expect(response.status).toBe(500);
        expect(failingRequest.status).toBe("failed");
        expect(failingRequest.decisionError).toContain("Falha operacional");
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
    });
});
