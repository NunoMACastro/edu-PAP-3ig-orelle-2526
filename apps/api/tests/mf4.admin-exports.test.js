import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateAdminExportRequest } from "../src/validators/admin-export.validator.js";
import { buildAdminExport } from "../src/services/admin-export.service.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: { find: vi.fn() },
}));

vi.mock("../src/models/order.model.js", () => ({
    PAYMENT_STATUS: Object.freeze({ PAID: "paid" }),
    Order: { find: vi.fn() },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: { find: vi.fn() },
}));

// Os services convertem ObjectId para texto antes de criar o ficheiro.
// Este helper simula só essa parte, mantendo o teste independente do MongoDB.
function objectId(value) {
    return { toString: () => value };
}

// Simula a chain Mongoose usada nas queries de exportação.
// Assim o teste confirma `.select().sort().limit()` sem precisar de base de dados real.
function queryRows(rows) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(rows),
    };
}

describe("BK-MF4-03 admin exports", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("bloqueia datasets desconhecidos no validator", () => {
        expect(() =>
            validateAdminExportRequest(
                { dataset: "raw-users" },
                { format: "csv" },
            ),
        ).toThrow("Dataset de exportação invalido");
    });

    it("gera CSV de utilizadores sem campos sensíveis", async () => {
        // O mock inclui campos proibidos de propósito.
        // O teste só passa se o service os excluir do ficheiro final.
        User.find.mockReturnValueOnce(
            queryRows([
                {
                    email: "cliente@orelle.local",
                    role: "cliente",
                    accountStatus: "active",
                    isActive: true,
                    passwordHash: "nunca-exportar",
                    storageKey: "private/path",
                    createdAt: new Date("2026-06-15T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({ dataset: "users", format: "csv" });
        const text = result.buffer.toString("utf8");

        expect(result.contentType).toBe("text/csv; charset=utf-8");
        expect(text).toContain("createdAt");
        expect(text).toContain("cliente@orelle.local");
        // Estes asserts são a evidência de minimização para a defesa.
        expect(text).not.toContain("passwordHash");
        expect(text).not.toContain("nunca-exportar");
        expect(text).not.toContain("storageKey");
        expect(text).not.toContain("private/path");
    });

    it("gera PDF de relatórios IA apenas com resumo minimizado", async () => {
        // O relatório falso tem `storageKey` privado para provar que o PDF final
        // não exporta caminhos internos nem ficheiros de análise facial.
        FaceReport.find.mockReturnValueOnce(
            queryRows([
                {
                    analysisId: objectId("analysis-1"),
                    limitations: ["Luz irregular", "Resultado indicativo"],
                    storageKey: "faces/raw/report.json",
                    createdAt: new Date("2026-06-15T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });
        const text = result.buffer.toString("utf8");

        expect(result.contentType).toBe("application/pdf");
        expect(text).toContain("%PDF-1.4");
        expect(text).toContain("limitationsCount");
        expect(text).not.toContain("storageKey");
        expect(text).not.toContain("faces/raw/report.json");
    });
});