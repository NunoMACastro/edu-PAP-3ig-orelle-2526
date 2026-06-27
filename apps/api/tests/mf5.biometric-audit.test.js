/**
 * Testes de integracao HTTP e service do BK-MF5-04.
 *
 * Cobrem auditoria minimizada de acessos biometricos, alertas por volume e
 * autorizacao administrativa sem depender de MongoDB real.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    recordBiometricAccess,
} from "../src/services/biometric-audit.service.js";

vi.mock("../src/models/biometric-access-log.model.js", () => ({
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
    BiometricAccessLog: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findById: vi.fn(),
    },
}));

const adminId = "665f00000000000000000011";
const consultantId = "665f00000000000000000012";
const subjectUserId = "665f00000000000000000013";

/**
 * Cria objeto com `toString`, tal como um ObjectId em DTOs.
 *
 * @function objectId
 * @param {string} id - Identificador textual.
 * @returns {{toString: () => string}} ObjectId minimo para testes.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria cookie de sessao igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {string} role - Role autenticada.
 * @param {string} [id=adminId] - ID do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role, id = adminId) {
    const token = createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Simula a conta persistida consultada pelo middleware de autenticacao.
 *
 * @function mockSessionAccount
 * @param {string} role - Role guardada em base de dados.
 * @returns {void}
 */
function mockSessionAccount(role) {
    User.findById.mockReturnValue({
        // A role persistida confirma que o backend nao confia apenas no token.
        select: vi.fn().mockResolvedValue({
            role,
            isActive: true,
            accountStatus: "active",
        }),
    });
}

/**
 * Simula query Mongoose `sort().limit()`.
 *
 * @function querySortLimit
 * @param {object[]} result - Documentos devolvidos pela query.
 * @returns {object} Query encadeavel.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria documento de auditoria com campos extra que nao podem sair no DTO.
 *
 * @function makeAuditLog
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Documento mock de auditoria.
 */
function makeAuditLog(overrides = {}) {
    return {
        _id: objectId("audit-log-1"),
        actorId: objectId(adminId),
        actorRole: ROLES.ADMIN,
        subjectUserId: objectId(subjectUserId),
        action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REPORT,
        resourceId: "report-1",
        result: "allowed",
        reason: "Revisao administrativa autorizada.",
        alertRaised: false,
        createdAt: new Date("2026-06-22T10:00:00.000Z"),
        storageKey: "/private/nao-deve-sair.png",
        cosmeticSummary: "Resumo que nao deve sair.",
        ...overrides,
    };
}

describe("BK-MF5-04 - auditoria biometrica", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("regista evento minimizado e assinala alerta por volume", async () => {
        BiometricAccessLog.countDocuments.mockResolvedValue(10);
        BiometricAccessLog.create.mockImplementation(async (payload) =>
            makeAuditLog({
                ...payload,
                _id: objectId("audit-log-volume"),
                actorId: objectId(payload.actorId),
                subjectUserId: objectId(payload.subjectUserId),
            }),
        );

        const log = await recordBiometricAccess({
            actorId: adminId,
            actorRole: ROLES.ADMIN,
            subjectUserId,
            action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
            resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REPORT,
            resourceId: "report-1",
            reason: "Revisao administrativa autorizada.",
        });

        expect(log.action).toBe(BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE);
        expect(log.resourceType).toBe(BIOMETRIC_AUDIT_RESOURCE_TYPES.REPORT);
        expect(log.alertRaised).toBe(true);
        expect(JSON.stringify(log)).not.toContain("storageKey");
        expect(JSON.stringify(log)).not.toContain("cosmeticSummary");
    });

    it("lista logs e alertas apenas para administrador com resposta minimizada", async () => {
        const app = createApp();

        mockSessionAccount(ROLES.ADMIN);
        BiometricAccessLog.countDocuments.mockResolvedValue(0);
        BiometricAccessLog.create.mockImplementation(async (payload) =>
            makeAuditLog({
                ...payload,
                _id: objectId(`audit-view-${payload.reason}`),
                actorId: objectId(payload.actorId),
                subjectUserId: null,
            }),
        );
        BiometricAccessLog.find.mockImplementation((filter = {}) =>
            querySortLimit([
                makeAuditLog({
                    resourceType: filter.alertRaised ? "audit" : "request",
                    alertRaised: Boolean(filter.alertRaised),
                }),
            ]),
        );

        const logs = await request(app)
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.ADMIN));
        const alerts = await request(app)
            .get("/api/admin/biometric-audit/alerts")
            .set("Cookie", cookieFor(ROLES.ADMIN));

        expect(logs.status).toBe(200);
        expect(alerts.status).toBe(200);
        expect(logs.body.logs).toHaveLength(1);
        expect(alerts.body.alerts[0].alertRaised).toBe(true);
        expect(JSON.stringify(logs.body)).not.toContain("storageKey");
        expect(JSON.stringify(logs.body)).not.toContain("cosmeticSummary");
        expect(BiometricAccessLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: BIOMETRIC_AUDIT_ACTIONS.VIEW_AUDIT,
                resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.AUDIT,
            }),
        );
    });

    it("bloqueia consultor na leitura completa da auditoria", async () => {
        mockSessionAccount(ROLES.CONSULTOR);

        const response = await request(createApp())
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.CONSULTOR, consultantId));

        expect(response.status).toBe(403);
        expect(BiometricAccessLog.find).not.toHaveBeenCalled();
        expect(BiometricAccessLog.create).not.toHaveBeenCalled();
    });
});
