/**
 * Testes do BK-MF7-05 / RNF16.
 *
 * Validam exportacao PDF minimizada, headers, autorizacao e filtro de
 * privacidade para relatorios IA sem depender de uma base de dados real.
 */
import request from "supertest";
import { PDFDocument } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Order } from "../src/models/order.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { User } from "../src/models/user.model.js";
import {
    buildAdminExport,
    buildCsv,
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

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AiConsultationReview: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    ReportUnlock: {
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
        /**
         * Devolve o valor textual do ObjectId simulado.
         *
         * @function toString
         * @returns {string} Identificador textual usado no teste.
         */
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

/** Simula query minimizada `select().lean()` dos metadados v2. */
function queryWithSelectLean(rows) {
    return {
        select: vi.fn(() => ({
            lean: vi.fn(() => Promise.resolve(rows)),
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

    it("gera um PDF válido, paginado e tolerante a Unicode externo", async () => {
        const pdf = await buildSimplePdf(
            "Orélle",
            `${"relatório minimizado ".repeat(900)}🧪`,
        );
        const parsed = await PDFDocument.load(pdf);

        expect(pdf.toString("utf8").startsWith("%PDF")).toBe(true);
        expect(parsed.getPageCount()).toBeGreaterThan(1);
        expect(parsed.getTitle()).toBe("Orélle");
    });

    it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", "\tformula", "\rformula"])(
        "mantém payload CSV perigoso como texto: %s",
        (payload) => {
            const csv = buildCsv(["value"], [{ value: payload }]).toString("utf8");

            expect(csv).toContain(`"'${payload}"`);
            expect(csv).not.toContain(`\n"${payload}"`);
        },
    );

    it("recusa formato invalido antes de consultar dados", () => {
        expect(() =>
            validateAdminExportRequest({ dataset: "sales" }, { format: "html" }),
        ).toThrow("Pedido de exportacao invalido");

        expect(Order.find).not.toHaveBeenCalled();
        expect(User.find).not.toHaveBeenCalled();
        expect(FaceReport.find).not.toHaveBeenCalled();
    });

    it("gera PDF de relatorios IA apenas com privacyStatus active", async () => {
        const reportId = objectId("66f000000000000000000101");
        const reportQuery = queryWithSelectSortLimit([
                {
                    _id: reportId,
                    userId: objectId("66f000000000000000000102"),
                    analysisId: objectId("66f000000000000000000103"),
                    schemaVersion: 2,
                    lifecycleStatus: "unlocked",
                    objectives: [{ code: "makeup", priority: "primary" }],
                    analysisMode: "openai",
                    providerMetadata: { effectiveModel: "gpt-5.4-mini" },
                    cosmeticSummary: "Resumo cosmetico ativo.",
                    sources: ["fotografia_frontal"],
                    limitations: ["Nao e diagnostico medico."],
                    finalRecommendationIds: [
                        objectId("66f000000000000000000104"),
                    ],
                    storageKey: "private/face/report.json",
                    passwordHash: "nao-deve-sair",
                    privacyStatus: "deleted",
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]);
        FaceReport.find.mockReturnValueOnce(reportQuery);
        AiConsultationReview.find.mockReturnValueOnce(
            queryWithSelectLean([
                { reportId, status: "approved", internalNote: "segredo" },
            ]),
        );
        ReportUnlock.find.mockReturnValueOnce(
            queryWithSelectLean([
                {
                    reportId,
                    status: "unlocked",
                    depositCents: 250,
                    simulatedPayment: { status: "simulated_paid" },
                    idempotencyKeyHash: "nao-deve-sair",
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });
        const parsed = await PDFDocument.load(result.buffer);
        const pdfText = result.buffer.toString("utf8");

        // A query e a projecao sao a barreira de privacidade deste export.
        expect(FaceReport.find).toHaveBeenCalledWith({ privacyStatus: "active" });
        expect(reportQuery.select).toHaveBeenCalledWith(
            "schemaVersion lifecycleStatus finalRecommendationIds createdAt",
        );
        expect(result.filename).toBe("ai-reports.pdf");
        expect(result.contentType).toBe("application/pdf");
        expect(pdfText).toContain("%PDF");
        expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
        expect(parsed.getTitle()).toBe("Orelle ai-reports");
        expect(pdfText).not.toContain("storageKey");
        expect(pdfText).not.toContain("private/face");
        expect(pdfText).not.toContain("passwordHash");
        expect(pdfText).not.toContain("internalNote");
        expect(pdfText).not.toContain("idempotencyKeyHash");
        expect(pdfText).not.toContain("privacyStatus");
        expect(pdfText).not.toContain("66f000000000000000000102");
        expect(pdfText).not.toContain("66f000000000000000000103");
        expect(pdfText).not.toContain("makeup");
        expect(pdfText).not.toContain("gpt-5.4-mini");
        expect(pdfText).not.toContain("Resumo cosmetico ativo.");
        expect(pdfText).not.toContain("fotografia_frontal");
        expect(pdfText).not.toContain("Nao e diagnostico medico.");
        expect(result.rowCount).toBe(1);
    });

    it("exporta CSV ai-reports estritamente metadata-only", async () => {
        const reportId = objectId("66f000000000000000000301");
        FaceReport.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: reportId,
                    userId: objectId("66f000000000000000000302"),
                    analysisId: objectId("66f000000000000000000303"),
                    schemaVersion: 2,
                    lifecycleStatus: "unlocked",
                    objectives: [{ code: "acne_imperfections" }],
                    analysisMode: "openai",
                    providerMetadata: {
                        effectiveModel: "gpt-5.4-mini",
                        requestId: "req-secret-not-exported",
                    },
                    cosmeticSummary: "Resumo minimizado.",
                    sources: ["openai_vision"],
                    limitations: ["Não é diagnóstico."],
                    finalRecommendationIds: [objectId("rec-1"), objectId("rec-2")],
                    createdAt: new Date("2026-07-11T10:00:00.000Z"),
                    machineResult: { encrypted: true, ciphertext: "cipher-secret" },
                },
            ]),
        );
        AiConsultationReview.find.mockReturnValueOnce(
            queryWithSelectLean([{ reportId, status: "approved" }]),
        );
        ReportUnlock.find.mockReturnValueOnce(
            queryWithSelectLean([
                {
                    reportId,
                    status: "unlocked",
                    depositCents: 321,
                    simulatedPayment: { status: "simulated_paid" },
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "csv",
        });
        const csv = result.buffer.toString("utf8");

        expect(csv).toContain("schemaVersion");
        expect(csv).toContain("lifecycleStatus");
        expect(csv).toContain("recommendationCount");
        expect(csv).toContain("approved");
        expect(csv).toContain("simulated_paid");
        expect(csv).toContain("321");
        expect(csv).not.toContain("userId");
        expect(csv).not.toContain("analysisId");
        expect(csv).not.toContain("objectives");
        expect(csv).not.toContain("effectiveModel");
        expect(csv).not.toContain("cosmeticSummary");
        expect(csv).not.toContain("sources");
        expect(csv).not.toContain("limitations");
        expect(csv).not.toContain("66f000000000000000000302");
        expect(csv).not.toContain("66f000000000000000000303");
        expect(csv).not.toContain("acne_imperfections");
        expect(csv).not.toContain("gpt-5.4-mini");
        expect(csv).not.toContain("Resumo minimizado.");
        expect(csv).not.toContain("openai_vision");
        expect(csv).not.toContain("Não é diagnóstico.");
        expect(csv).not.toContain("req-secret-not-exported");
        expect(csv).not.toContain("cipher-secret");
        expect(csv).not.toContain("storageKey");
        expect(csv).not.toContain("outputEncryption");
    });

    it.each(["csv", "pdf"])(
        "serve ai-reports %s sem cache nem metadata pessoal",
        async (format) => {
            const reportId = objectId("66f000000000000000000401");
            FaceReport.find.mockReturnValueOnce(
                queryWithSelectSortLimit([
                    {
                        _id: reportId,
                        schemaVersion: 2,
                        lifecycleStatus: "unlocked",
                        finalRecommendationIds: [],
                        createdAt: new Date("2026-07-11T12:00:00.000Z"),
                        userId: "private-user-marker",
                        analysisId: "private-analysis-marker",
                        objectives: ["private-objective-marker"],
                        providerMetadata: {
                            effectiveModel: "private-model-marker",
                        },
                        cosmeticSummary: "private-summary-marker",
                        sources: ["private-source-marker"],
                        limitations: ["private-limitation-marker"],
                    },
                ]),
            );
            AiConsultationReview.find.mockReturnValueOnce(
                queryWithSelectLean([]),
            );
            ReportUnlock.find.mockReturnValueOnce(queryWithSelectLean([]));

            const response = await request(createApp())
                .get(`/api/admin/exports/ai-reports?format=${format}`)
                .set("Cookie", [makeSessionCookie()]);

            expect(response.status).toBe(200);
            expect(response.headers["cache-control"]).toBe(
                "private, no-store, max-age=0",
            );
            expect(response.headers.pragma).toBe("no-cache");
            expect(response.headers["x-orelle-export-rows"]).toBe("1");
            const body = Buffer.isBuffer(response.body)
                ? response.body.toString("utf8")
                : String(response.text ?? response.body);
            for (const marker of [
                "private-user-marker",
                "private-analysis-marker",
                "private-objective-marker",
                "private-model-marker",
                "private-summary-marker",
                "private-source-marker",
                "private-limitation-marker",
            ]) {
                expect(body).not.toContain(marker);
            }
        },
    );

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
