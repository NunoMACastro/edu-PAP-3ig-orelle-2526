/**
 * Testes do BK-MF7-05 / RNF16.
 *
 * Validam exportação PDF minimizada, headers, autorização e filtro de privacidade.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Order } from "../src/models/order.model.js";
import { User } from "../src/models/user.model.js";
import {
    buildAdminExport,
    buildSimplePdf,
} from "../src/services/admin-export.service.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateAdminExportRequest } from "../src/validators/admin-export.validator.js";

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: {
        find: vi.fn(),
    },
}));

/**
 * Cria um identificador mínimo com a interface usada nos DTOs.
 *
 * @function objectId
 * @param {string} value - Valor textual do identificador.
 * @returns {{toString: Function}} Objeto compatível com `toString`.
 */
function objectId(value) {
    return {
        toString() {
            return value;
        },
    };
}

/**
 * Simula uma query Mongoose com `sort().limit()`.
 *
 * @function queryWithSortLimit
 * @param {unknown[]} rows - Linhas a devolver.
 * @returns {{sort: Function}} Query simulada.
 */
function queryWithSortLimit(rows) {
    return {
        sort: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve(rows)),
        })),
    };
}

/**
 * Simula uma query Mongoose com `select().sort().limit()`.
 *
 * @function queryWithSelectSortLimit
 * @param {unknown[]} rows - Linhas a devolver.
 * @returns {{select: Function}} Query simulada.
 */
function queryWithSelectSortLimit(rows) {
    return {
        select: vi.fn(() => ({
            sort: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve(rows)),
            })),
        })),
    };
}

function createAdminCookie() {
    const token = createSessionToken({
        id: "admin-1",
        email: "admin@orelle.test",
        role: ROLES.ADMIN,
    });

    return `orelle_session=${token}`;
}

describe("BK-MF7-05 / RNF16 - exportação PDF", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("gera um buffer PDF mínimo", () => {
        const pdf = buildSimplePdf("Orelle", "relatório minimizado");

        expect(pdf.toString("utf8").startsWith("%PDF")).toBe(true);
    });

    it("recusa formato inválido antes de consultar dados", () => {
        expect(() =>
            validateAdminExportRequest({ dataset: "sales" }, { format: "html" }),
        ).toThrow("Pedido de exportação inválido");
    });

    it("gera PDF de relatórios IA apenas com privacyStatus active", async () => {
        FaceReport.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("report-1"),
                    userId: objectId("user-1"),
                    analysisId: objectId("analysis-1"),
                    cosmeticSummary: "Tom uniforme.",
                    sources: ["analysis"],
                    limitations: ["Sem diagnóstico médico."],
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });

        // A chamada ao modelo prova que relatórios apagados/anonimizados não entram.
        expect(FaceReport.find).toHaveBeenCalledWith({ privacyStatus: "active" });
        expect(result.filename).toBe("ai-reports.pdf");
        expect(result.contentType).toBe("application/pdf");
        expect(result.buffer.toString("utf8")).toContain("%PDF");
        expect(result.rowCount).toBe(1);
    });

    it("devolve PDF com headers seguros para admin", async () => {
        User.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("user-1"),
                    email: "cliente@orelle.test",
                    role: ROLES.CLIENTE,
                    isActive: true,
                    accountStatus: "active",
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get("/api/admin/exports/users?format=pdf")
            .set("Cookie", [createAdminCookie()]);

        // A prova HTTP cobre o contrato que o browser vai receber no download.
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
        expect(response.headers["content-disposition"]).toBe(
            'attachment; filename="users.pdf"',
        );
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-orelle-export-rows"]).toBe("1");
    });

    it("bloqueia cliente autenticado em exportação admin", async () => {
        const token = createSessionToken({
            id: "cliente-1",
            email: "cliente@orelle.test",
            role: ROLES.CLIENTE,
        });

        const response = await request(createApp())
            .get("/api/admin/exports/users?format=pdf")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(response.status).toBe(403);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("bloqueia visitante sem sessão", async () => {
        const response = await request(createApp()).get(
            "/api/admin/exports/users?format=pdf",
        );

        expect(response.status).toBe(401);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("recusa dataset desconhecido por HTTP", async () => {
        const response = await request(createApp())
            .get("/api/admin/exports/secrets?format=pdf")
            .set("Cookie", [createAdminCookie()]);

        expect(response.status).toBe(400);
        expect(Order.find).not.toHaveBeenCalled();
        expect(User.find).not.toHaveBeenCalled();
        expect(FaceReport.find).not.toHaveBeenCalled();
    });
});