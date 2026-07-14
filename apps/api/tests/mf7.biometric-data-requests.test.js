/**
 * Testes unitários dos limites de segurança do workflow de privacidade MF7.
 *
 * Complementam a prova transacional em replica set: validam minimização,
 * input, deduplicação do outbox e confirmação física sem abrir sockets nem
 * depender de uma base configurada externamente.
 */
import { describe, expect, it, vi } from "vitest";
import { FileDeletionJob } from "../src/models/file-deletion-job.model.js";
import { toPrivacyRequestResponse } from "../src/services/biometric-data-request.service.js";
import {
    buildFileDeletionDeduplicationKey,
    deleteAndConfirmFile,
    enqueueFileDeletionJobs,
} from "../src/services/file-deletion-job.service.js";
import {
    validateBiometricDataRequestDecisionInput,
    validateBiometricDataRequestRetryInput,
    validateCreateBiometricDataRequestInput,
} from "../src/validators/biometric-data-request.validator.js";

const REQUEST_ID = "775f00000000000000000001";
const USER_ID = "665f00000000000000000001";

describe("MF7 - limites do workflow de pedidos de privacidade", () => {
    it("normaliza a intenção do titular e elimina recursos duplicados", () => {
        expect(
            validateCreateBiometricDataRequestInput({
                action: " delete ",
                resources: ["photos", "photos", "reports"],
                reason: "  Eliminar os meus dados  ",
                requesterId: "outro-utilizador",
            }),
        ).toEqual({
            action: "delete",
            resources: ["photos", "reports"],
            reason: "Eliminar os meus dados",
        });
    });

    it("recusa ações e recursos fora da lista fechada", () => {
        expect(() =>
            validateCreateBiometricDataRequestInput({
                action: "export",
                resources: ["photos"],
            }),
        ).toThrow("Tipo de pedido inválido");
        expect(() =>
            validateCreateBiometricDataRequestInput({
                action: "delete",
                resources: ["orders"],
            }),
        ).toThrow("Recursos do pedido inválidos");
    });

    it("exige justificação material na rejeição e minimiza a nota de retry", () => {
        expect(() =>
            validateBiometricDataRequestDecisionInput({
                decision: "rejected",
                decisionReason: "não",
            }),
        ).toThrow("Justificação obrigatória");

        expect(
            validateBiometricDataRequestDecisionInput({
                decision: "rejected",
                decisionReason: "  Pedido já tratado.  ",
            }),
        ).toEqual({
            decision: "rejected",
            decisionReason: "Pedido já tratado.",
        });
        expect(
            validateBiometricDataRequestRetryInput({
                decisionReason: ` ${"x".repeat(700)} `,
                action: "delete",
            }).decisionReason,
        ).toHaveLength(500);
    });

    it("produz DTO sem lease token, storage key ou dados faciais", () => {
        const response = toPrivacyRequestResponse({
            _id: REQUEST_ID,
            requesterId: USER_ID,
            scope: "biometric",
            action: "anonymize",
            resources: ["photos", "reports"],
            reason: "Pedido",
            status: "processing",
            attempts: 1,
            reviewerId: null,
            decisionReason: "",
            decisionError: "",
            createdAt: new Date("2026-07-10T08:00:00.000Z"),
            lease: {
                token: "token-secreto",
                expiresAt: new Date("2026-07-10T08:05:00.000Z"),
            },
            storageKey: "/private/foto.enc",
            cosmeticSummary: "conteúdo facial",
        });
        const serialized = JSON.stringify(response);

        expect(response).toMatchObject({
            id: REQUEST_ID,
            requesterId: USER_ID,
            leaseExpiresAt: new Date("2026-07-10T08:05:00.000Z"),
        });
        expect(serialized).not.toContain("token-secreto");
        expect(serialized).not.toContain("storageKey");
        expect(serialized).not.toContain("conteúdo facial");
    });

    it("gera deduplicação estável e sensível à origem e ao path", () => {
        const base = {
            sourceType: "privacy_request",
            sourceId: REQUEST_ID,
            storageKey: "/private/frontal.webp.enc",
        };

        expect(buildFileDeletionDeduplicationKey(base)).toBe(
            buildFileDeletionDeduplicationKey({ ...base }),
        );
        expect(buildFileDeletionDeduplicationKey(base)).not.toBe(
            buildFileDeletionDeduplicationKey({
                ...base,
                storageKey: "/private/perfil.webp.enc",
            }),
        );
        expect(buildFileDeletionDeduplicationKey(base)).toMatch(/^[a-f0-9]{64}$/);
    });

    it("submete upsert idempotente sem expor o path na chave de deduplicação", async () => {
        const bulkWriteSpy = vi
            .spyOn(FileDeletionJob, "bulkWrite")
            .mockResolvedValue({ upsertedCount: 1 });
        const entry = {
            sourceType: "privacy_request",
            sourceId: REQUEST_ID,
            ownerId: USER_ID,
            storageKey: "/private/frontal.webp.enc",
        };
        let calls;

        try {
            await enqueueFileDeletionJobs([entry]);
            await enqueueFileDeletionJobs([entry]);
            calls = [...bulkWriteSpy.mock.calls];
        } finally {
            bulkWriteSpy.mockRestore();
        }

        expect(calls).toHaveLength(2);
        const firstOperation = calls[0][0][0].updateOne;
        const secondOperation = calls[1][0][0].updateOne;
        expect(firstOperation.filter).toEqual(secondOperation.filter);
        expect(firstOperation.upsert).toBe(true);
        expect(firstOperation.filter.deduplicationKey).not.toContain("private");
    });

    it("recusa metadados incompletos em vez de deixar bytes órfãos", async () => {
        const bulkWriteSpy = vi.spyOn(FileDeletionJob, "bulkWrite");
        let called;

        try {
            await expect(
                enqueueFileDeletionJobs([
                    {
                        sourceType: "privacy_request",
                        sourceId: REQUEST_ID,
                        ownerId: USER_ID,
                        storageKey: "",
                    },
                ]),
            ).rejects.toThrow("Metadados de eliminação física inválidos");
            called = bulkWriteSpy.mock.calls.length > 0;
        } finally {
            bulkWriteSpy.mockRestore();
        }

        expect(called).toBe(false);
    });

    it("trata ENOENT como sucesso idempotente e recusa ausência não confirmada", async () => {
        const missingError = Object.assign(new Error("missing"), {
            code: "ENOENT",
        });

        await expect(
            deleteAndConfirmFile("/private/ja-ausente.enc", {
                unlinkFile: vi.fn().mockRejectedValue(missingError),
                statFile: vi.fn().mockRejectedValue(missingError),
            }),
        ).resolves.toBeUndefined();

        await expect(
            deleteAndConfirmFile("/private/ainda-existe.enc", {
                unlinkFile: vi.fn().mockResolvedValue(undefined),
                statFile: vi.fn().mockResolvedValue({ size: 1 }),
            }),
        ).rejects.toThrow("confirmar a eliminação física");
    });
});
