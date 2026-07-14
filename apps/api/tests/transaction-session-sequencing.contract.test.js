/**
 * Contrato de regressão para operações MongoDB dentro de ClientSession.
 *
 * O driver não suporta operações paralelas na mesma sessão. Estes testes
 * protegem os dois boundaries transacionais onde uma futura substituição por
 * `Promise.all` voltaria a introduzir concorrência inválida.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readService(relativePath) {
    return readFile(new URL(relativePath, import.meta.url), "utf8");
}

function sliceRequired(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    return source.slice(start, end);
}

describe("sequenciamento de queries na mesma ClientSession", () => {
    it("lê consentimento antes das fotografias ao iniciar a análise", async () => {
        const source = await readService(
            "../src/services/ai-consultation.service.js",
        );
        const transactionBoundary = sliceRequired(
            source,
            "assertOperationCapacity(consultation);",
            "const currentPhotoIds",
        );

        expect(transactionBoundary).not.toContain("Promise.all");
        expect(transactionBoundary).toContain(
            "const consent = await findActiveConsent(userId, databaseSession);",
        );
        expect(transactionBoundary).toContain(
            "const photos = await findActivePhotos(userId, databaseSession);",
        );
        expect(transactionBoundary.indexOf("const consent = await")).toBeLessThan(
            transactionBoundary.indexOf("const photos = await"),
        );
    });

    it("relê consentimento antes do perfil no commit do relatório", async () => {
        const source = await readService(
            "../src/services/consultation-report.service.js",
        );
        const transactionBoundary = sliceRequired(
            source,
            "const currentProducts = await loadCurrentProductsForSelections",
            "if (!activeConsent)",
        );

        expect(transactionBoundary).not.toContain("Promise.all");
        expect(transactionBoundary).toContain(
            "const activeConsent = await FaceConsent.findOne",
        );
        expect(transactionBoundary).toContain(
            "const currentProfile = await Profile.findOne",
        );
        expect(
            transactionBoundary.indexOf("const activeConsent = await"),
        ).toBeLessThan(
            transactionBoundary.indexOf("const currentProfile = await"),
        );
    });
});
