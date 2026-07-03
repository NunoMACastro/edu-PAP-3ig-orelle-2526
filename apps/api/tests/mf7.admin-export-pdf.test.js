/**
 * Testes do BK-MF7-05 / RNF16.
 *
 * Validam exportacao PDF minimizada, headers, autorizacao e filtro de
 * privacidade para relatorios IA sem depender de uma base de dados real.
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
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";
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
 * Cria um identificador minimo com a interface usada nos DTOs.
 *
 * @function objectId
 * @param {string} value - Valor textual do identificador.
 * @returns {{toString: Function}} Objeto compativel com `toString`.
 */
function objectId(value) {
    return {
        toString() {
            return value;
        },
    };
}

/**
 * Simula query Mongoose com `select().sort().limit()`.
 *
 * @function queryWithSelectSortLimit
 * @param {unknown[]} rows - Linhas a devolver pela query.
 * @returns {{select: Function}} Query encadeavel mockada.
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

/**
 * Cria cookie de sessao assinado para Supertest.
 *
 * @function makeSessionCookie
 * @param {string} role - Role a colocar no token.
 * @returns {string} Header Cookie.
 */
function makeSessionCookie(role = ROLES.ADMIN) {
    const token = createSessionToken({
        id: `${role}-1`,
        email: `${role}@orelle.test`,
        role,
    });

    return `${SESSION_COOKIE_NAME}=${token}`;
}

describe("BK-MF7-05 / RNF16 - exportacao PDF", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("gera um buffer PDF minimo sem dependencia externa", () => {
        const pdf = buildSimplePdf("Orelle", "relatorio minimizado");

        expect(pdf.toString("utf8").startsWith("%PDF")).toBe(true);
    });

    it("recusa formato invalido antes de consultar dados", () => {
        expect(() =>
            validateAdminExportRequest({ dataset: "sales" }, { format: "html" }),
        ).toThrow("Pedido de exportacao invalido");

        expect(Order.find).not.toHaveBeenCalled();
        expect(User.find).not.toHaveBeenCalled();
        expect(FaceReport.find).not.toHaveBeenCalled();
    });

    it("gera PDF de relatorios IA apenas com privacyStatus active", async () => {
        FaceReport.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("66f000000000000000000101"),
                    userId: objectId("66f000000000000000000102"),
                    analysisId: objectId("66f000000000000000000103"),
                    cosmeticSummary: "Resumo cosmetico ativo.",
                    sources: ["fotografia_frontal"],
                    limitations: ["Nao e diagnostico medico."],
                    storageKey: "private/face/report.json",
                    passwordHash: "nao-deve-sair",
                    privacyStatus: "deleted",
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });
        const pdfText = result.buffer.toString("utf8");

        // A query e a projecao sao a barreira de privacidade deste export.
        expect(FaceReport.find).toHaveBeenCalledWith({ privacyStatus: "active" });
        expect(result.filename).toBe("ai-reports.pdf");
        expect(result.contentType).toBe("application/pdf");
        expect(pdfText).toContain("%PDF");
        expect(pdfText).toContain("Resumo cosmetico ativo.");
        expect(pdfText).not.toContain("storageKey");
        expect(pdfText).not.toContain("private/face");
        expect(pdfText).not.toContain("passwordHash");
        expect(pdfText).not.toContain("privacyStatus");
        expect(result.rowCount).toBe(1);
    });

    it("devolve PDF com headers seguros para admin", async () => {
        User.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("66f000000000000000000201"),
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
            .set("Cookie", [makeSessionCookie()]);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
        expect(response.headers["content-disposition"]).toBe(
            'attachment; filename="users.pdf"',
        );
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-orelle-export-rows"]).toBe("1");
    });

    it("bloqueia cliente autenticado em exportacao admin", async () => {
        const response = await request(createApp())
            .get("/api/admin/exports/users?format=pdf")
            .set("Cookie", [makeSessionCookie(ROLES.CLIENTE)]);

        expect(response.status).toBe(403);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("bloqueia visitante sem sessao", async () => {
        const response = await request(createApp()).get(
            "/api/admin/exports/users?format=pdf",
        );

        expect(response.status).toBe(401);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("recusa dataset desconhecido por HTTP antes de consultar modelos", async () => {
        const response = await request(createApp())
            .get("/api/admin/exports/secrets?format=pdf")
            .set("Cookie", [makeSessionCookie()]);

        expect(response.status).toBe(400);
        expect(Order.find).not.toHaveBeenCalled();
        expect(User.find).not.toHaveBeenCalled();
        expect(FaceReport.find).not.toHaveBeenCalled();
    });
});
