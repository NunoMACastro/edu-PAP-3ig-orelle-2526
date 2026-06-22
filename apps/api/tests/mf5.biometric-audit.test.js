import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    recordBiometricAccess,
} from "../src/services/biometric-audit.service.js";

vi.mock("../src/models/biometric-access-log.model.js", () => ({
    BIOMETRIC_AUDIT_ACTIONS: {
        LIST_REQUESTS: "list_requests",
        DECIDE_REQUEST: "decide_request",
        VIEW_AUDIT: "view_audit",
        VIEW_RESOURCE: "view_resource",
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
 * Cria objeto com `toString`, igual ao que os DTOs recebem de ObjectId.
 *
 * @function objectId
 * @param {string} id - Identificador textual.
 * @returns {{toString: () => string}} ObjectId mínimo para testes.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria cookie de sessão igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {string} role - Role autenticada.
 * @param {string} id - ID do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role = ROLES.ADMIN, id = adminId) {
    const token = createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Simula a conta persistida consultada pelo middleware `requireAuth`.
 *
 * @function mockSessionAccount
 * @param {string} role - Role guardada na base de dados.
 * @returns {void}
 */
function mockSessionAccount(role = ROLES.ADMIN) {
    User.findById.mockReturnValue({
        // A role persistida confirma que a autorização não depende só do token enviado.
        select: vi.fn().mockResolvedValue({
            role,
            isActive: true,
            accountStatus: "active",
        }),
    });
}

/**
 * Simula query Mongoose `sort().limit()` usada pela listagem.
 *
 * @function querySortLimit
 * @param {object[]} result - Documentos devolvidos pela query.
 * @returns {object} Query encadeável.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

describe("MF5 - auditoria biométrica", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("regista evento minimizado e assinala alerta por volume", async () => {
        BiometricAccessLog.countDocuments.mockResolvedValue(10);
        BiometricAccessLog.create.mockImplementation(async (payload) => ({
            _id: objectId("audit-log-1"),
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            ...payload,
            actorId: objectId(payload.actorId),
            subjectUserId: objectId(payload.subjectUserId),
        }));

        const log = await recordBiometricAccess({
            actorId: adminId,
            actorRole: ROLES.ADMIN,
            subjectUserId,
            action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
            resourceType: "report",
            resourceId: "report-1",
            reason: "Revisão administrativa autorizada.",
        });

        expect(log.action).toBe(BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE);
        expect(log.resourceType).toBe("report");
        expect(log.alertRaised).toBe(true);
        // A resposta de auditoria é minimizada para provar que o log não virou cópia do relatório.
        expect(JSON.stringify(log)).not.toContain("storageKey");
        expect(JSON.stringify(log)).not.toContain("cosmeticSummary");
    });

    it("lista logs e alertas apenas para administrador", async () => {
        const app = createApp();
        mockSessionAccount(ROLES.ADMIN);
        BiometricAccessLog.find.mockImplementation((filter = {}) => {
            const result = [
                {
                    _id: objectId("audit-log-2"),
                    actorId: objectId(adminId),
                    actorRole: ROLES.ADMIN,
                    subjectUserId: objectId(subjectUserId),
                    action: BIOMETRIC_AUDIT_ACTIONS.VIEW_AUDIT,
                    resourceType: filter.alertRaised ? "audit" : "request",
                    resourceId: "audit-resource-1",
                    result: "allowed",
                    reason: "Consulta administrativa.",
                    alertRaised: Boolean(filter.alertRaised),
                    createdAt: new Date("2026-06-19T10:05:00.000Z"),
                    storageKey: "/private/nao-deve-sair.png",
                    cosmeticSummary: "Resumo que não deve sair.",
                },
            ];

            // O service deve remover campos extra antes de responder ao frontend.
            return querySortLimit(result);
        });

        const logs = await request(app)
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.ADMIN));
        const alerts = await request(app)
            .get("/api/admin/biometric-audit/alerts")
            .set("Cookie", cookieFor(ROLES.ADMIN));

        expect(logs.status).toBe(200);
        expect(alerts.status).toBe(200);
        expect(JSON.stringify(logs.body)).not.toContain("storageKey");
        expect(JSON.stringify(logs.body)).not.toContain("cosmeticSummary");
        expect(alerts.body.alerts[0].alertRaised).toBe(true);
    });

    it("bloqueia consultor na leitura completa da auditoria", async () => {
        const app = createApp();
        mockSessionAccount(ROLES.CONSULTOR);

        const response = await request(app)
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.CONSULTOR, consultantId));

        // Consultores geram eventos noutros fluxos, mas a auditoria global é só de administrador.
        expect(response.status).toBe(403);
    });
});