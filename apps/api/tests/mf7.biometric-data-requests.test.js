/**
 * Testes de integração HTTP do BK-MF7-02.
 *
 * Cobrem criação, revisão e efeitos de pedidos de privacidade biométrica sem
 * depender de MongoDB real. O foco é provar ownership por sessão, roles,
 * auditoria e minimização das respostas.
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
 * Cria cookie de sessão igual ao usado pela API real.
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
 * @returns {object} Query mock encadeável.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Revalida a sessão contra estado persistido por utilizador.
 *
 * @function mockSessionAccounts
 * @param {Record<string, {role: string}>} accounts - Contas disponíveis.
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

describe("BK-MF7-02 - direito a eliminar conta e dados", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccounts({
            [clienteId]: { role: ROLES.CLIENTE },
            [consultorId]: { role: ROLES.CONSULTOR },
            [adminId]: { role: ROLES.ADMIN },
        });
    });

    it("permite cliente criar pedido e consultor listar metadados", async () => {
        const requestDoc = makeRequestDoc();

        BiometricDataRequest.create.mockResolvedValue(requestDoc);
        BiometricDataRequest.find.mockReturnValue(querySortLimit([requestDoc]));

        const created = await request(createApp())
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
        expect(JSON.stringify(created.body)).not.toContain("storageKey");
        expect(JSON.stringify(created.body)).not.toContain("cosmeticSummary");

        const listed = await request(createApp())
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));

        expect(listed.status).toBe(200);
        expect(listed.body.requests).toHaveLength(1);
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: consultorId,
                action: "list_requests",
                resourceType: "request",
            }),
        );
    });

    it("bloqueia negativos de sessão, role e recurso inválido", async () => {
        const app = createApp();

        const noSession = await request(app)
            .post("/api/me/biometric-data-requests")
            .send({ action: "delete", resources: ["photos"] });
        const wrongRole = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }));
        const invalidResource = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: ["orders"] });

        expect(noSession.status).toBe(401);
        expect(wrongRole.status).toBe(403);
        expect(invalidResource.status).toBe(400);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
    });

    it("aplica aprovação apenas aos recursos do requesterId", async () => {
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

    it("recusa decisão repetida e regista auditoria negada", async () => {
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

    it("marca pedido como failed quando aplicação de recursos falha sem transação", async () => {
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
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
    });
});