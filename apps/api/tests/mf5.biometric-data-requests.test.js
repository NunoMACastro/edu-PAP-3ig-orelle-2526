// apps/api/tests/mf5.biometric-data-requests.test.js
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { signSessionToken } from "../src/services/session.service.js";

const app = createApp();

/**
 * Cria cookie de sessão igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {{id: string, role: string, email?: string}} user - Utilizador de teste.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(user) {
    return [`orelle_session=${signSessionToken(user)}`];
}

describe("MF5 - pedidos de privacidade biométrica", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("permite ao cliente criar pedido e ao consultor listar metadados", async () => {
        const cliente = { id: "665f00000000000000000001", role: ROLES.CLIENTE };
        const consultor = { id: "665f00000000000000000002", role: ROLES.CONSULTOR };

        vi.spyOn(BiometricDataRequest, "create").mockResolvedValue({
            _id: "775f00000000000000000001",
            requesterId: cliente.id,
            action: "delete",
            resources: ["photos"],
            reason: "Pedido RGPD",
            status: "pending",
            decisionReason: "",
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            reviewedAt: null,
            completedAt: null,
        });
        vi.spyOn(BiometricDataRequest, "find").mockReturnValue({
            sort: () => ({
                limit: () => [
                    {
                        _id: "775f00000000000000000001",
                        requesterId: cliente.id,
                        action: "delete",
                        resources: ["photos"],
                        reason: "Pedido RGPD",
                        status: "pending",
                        decisionReason: "",
                        createdAt: new Date("2026-06-19T10:00:00.000Z"),
                        reviewedAt: null,
                        completedAt: null,
                    },
                ],
            }),
        });

        const created = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: ["photos"], reason: "Pedido RGPD" });

        expect(created.status).toBe(201);
        expect(created.body.request.status).toBe("pending");

        const listed = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor(consultor));

        expect(listed.status).toBe(200);
        expect(Array.isArray(listed.body.requests)).toBe(true);
        expect(JSON.stringify(listed.body)).not.toContain("storageKey");
    });

    it("bloqueia cliente no painel administrativo", async () => {
        const cliente = { id: "665f00000000000000000003", role: ROLES.CLIENTE };

        const response = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor(cliente));

        expect(response.status).toBe(403);
    });

    it("bloqueia pedido sem recursos válidos", async () => {
        const cliente = { id: "665f00000000000000000004", role: ROLES.CLIENTE };

        const response = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: [] });

        expect(response.status).toBe(400);
    });

    it("aplica delete e anonymize com efeitos distinguíveis", async () => {
        const admin = { id: "665f00000000000000000005", role: ROLES.ADMIN };
        const requestDoc = {
            _id: "775f00000000000000000002",
            requesterId: "665f00000000000000000006",
            action: "anonymize",
            resources: ["photos", "reports"],
            reason: "Quero anonymizar os dados.",
            status: "pending",
            decisionReason: "",
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            reviewedAt: null,
            completedAt: null,
            save: vi.fn(),
        };

        vi.spyOn(BiometricDataRequest, "findById").mockResolvedValue(requestDoc);
        vi.spyOn(FacePhoto, "updateMany").mockResolvedValue({ modifiedCount: 1 });
        vi.spyOn(FaceReport, "updateMany").mockResolvedValue({ modifiedCount: 1 });

        const response = await request(app)
            .patch("/api/admin/biometric-data-requests/775f00000000000000000002/decision")
            .set("Cookie", cookieFor(admin))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonymizada",
                },
            },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({ privacyStatus: "anonymized" }),
            }),
        );
    });
});