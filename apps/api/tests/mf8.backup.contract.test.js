/**
 * Contrato MF8/BK-MF8-04 para backups diarios seguros.
 */
import { readFile, rm } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    assertPublicOutputDoesNotExposeSecrets,
    createBackupId,
    redactSensitiveFields,
    resolveBackupRoot,
    runBackup,
    validateBackupConfiguration,
} from "../scripts/backup-daily.mjs";

const SAFE_TEST_ENV = {
    OPENAI_API_KEY: "fake-openai-key",
    AZURE_FACE_API_KEY: "fake-azure-key",
};

/**
 * O RNF21 precisa de prova repetivel: destino privado, ambiente isolado,
 * manifesto de evidence e negativos contra exposicao de dados sensiveis.
 */
describe("BK-MF8-04 - backup diario", () => {
    it("gera manifesto dry-run em destino privado", async () => {
        const backupRoot = resolveBackupRoot("storage/private/backups-test");
        const now = new Date("2026-07-01T10:00:00.000Z");

        await rm(backupRoot, { recursive: true, force: true });

        const summary = await runBackup({
            dryRun: true,
            now,
            backupRoot: "storage/private/backups-test",
            nodeEnv: "test",
            mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            source: SAFE_TEST_ENV,
        });
        const manifestPath = path.join(
            backupRoot,
            `${createBackupId(now)}-manifest.backup.json`,
        );
        const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

        expect(summary).toMatchObject({
            status: "ok",
            dryRun: true,
            databaseName: "orelle_test",
            collections: [],
        });
        expect(manifest).toMatchObject({
            bkId: "BK-MF8-04",
            requirement: "RNF21",
            dryRun: true,
            databaseName: "orelle_test",
        });

        await rm(backupRoot, { recursive: true, force: true });
    });

    it("recusa destino fora de storage/private", () => {
        expect(() => resolveBackupRoot("api/public/backups")).toThrow(
            "storage/private",
        );
    });

    it("recusa backup sem MONGODB_URI de teste", () => {
        expect(() =>
            validateBackupConfiguration({
                nodeEnv: "test",
                mongoUri: "",
                backupRoot: "storage/private/backups-test",
                source: SAFE_TEST_ENV,
            }),
        ).toThrow("MONGODB_URI");
    });

    it("redige campos sensiveis antes de escrever ficheiros", () => {
        const redacted = redactSensitiveFields({
            email: "cliente@orelle.test",
            passwordHash: "$2a$12$hash",
            profile: {
                skinType: "oleosa",
                storageKey: "private/faces/user-1/front.png",
            },
            recommendations: [{ productName: "Gel suave", reason: "oleosidade" }],
        });

        expect(redacted).toEqual({
            email: "cliente@orelle.test",
            passwordHash: "[redigido]",
            profile: {
                skinType: "oleosa",
                storageKey: "[redigido]",
            },
            recommendations: [{ productName: "Gel suave", reason: "oleosidade" }],
        });
    });

    it("bloqueia resumo publico com segredos ou paths internos", () => {
        expect(() =>
            assertPublicOutputDoesNotExposeSecrets({
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            }),
        ).toThrow("Resumo publico");

        expect(() =>
            assertPublicOutputDoesNotExposeSecrets({
                filePath: "/Users/aluno/orelle/storage/private/backups/a.backup.json",
            }),
        ).toThrow("Resumo publico");
    });
});
