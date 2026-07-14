/** Testes do contrato estrutural do outbox IA v2. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../src/models/ai-job.model.js";
import {
    claimNextAiJob,
    enqueueAiJob,
    failAiJob,
    renewAiJobLease,
    retryOwnedAiJob,
} from "../src/services/ai-job.service.js";

afterEach(() => vi.restoreAllMocks());

describe("AI-E2E-02 - AiJob", () => {
    it("aceita quatro tipos e rejeita payload sensível arbitrário", () => {
        expect(Object.values(AI_JOB_TYPES)).toEqual([
            "analyze_photos",
            "select_next_question",
            "generate_report",
            "generate_makeup_preview",
        ]);
        const document = new AiJob({
            type: AI_JOB_TYPES.ANALYZE_PHOTOS,
            userId: "66a000000000000000000001",
            consultationSessionId: "66b000000000000000000001",
            deduplicationKey: "analysis:test",
            payload: { photograph: "never-persist-this" },
        });
        const plain = document.toObject();
        expect(plain.payload).toBeUndefined();
        expect(plain.status).toBe(AI_JOB_STATUSES.QUEUED);
    });

    it("declara índices únicos, claim e TTL terminal de 30 dias", () => {
        const indexes = AiJob.schema.indexes();
        expect(
            indexes.some(([key, options]) =>
                key.deduplicationKey === 1 && options.unique === true,
            ),
        ).toBe(true);
        expect(
            indexes.some(([key, options]) =>
                key.terminalAt === 1 &&
                options.expireAfterSeconds === 30 * 24 * 60 * 60,
            ),
        ).toBe(true);
    });

    it("reutiliza o vencedor quando dois upserts disputam a deduplicação", async () => {
        const duplicate = Object.assign(new Error("duplicate"), { code: 11000 });
        const existing = { _id: "66c000000000000000000001" };
        vi.spyOn(AiJob, "updateOne").mockRejectedValueOnce(duplicate);
        vi.spyOn(AiJob, "findOne").mockResolvedValueOnce(existing);

        await expect(
            enqueueAiJob({
                type: AI_JOB_TYPES.ANALYZE_PHOTOS,
                userId: "66a000000000000000000001",
                consultationSessionId: "66b000000000000000000001",
                deduplicationKey: "analysis:race",
            }),
        ).resolves.toBe(existing);
    });

    it("recupera primeiro leases expirados e depois reclama queued/retryable", async () => {
        const recoveredSelect = vi.fn().mockResolvedValue(null);
        const queuedSelect = vi.fn().mockResolvedValue(null);
        const find = vi
            .spyOn(AiJob, "findOneAndUpdate")
            .mockReturnValueOnce({ select: recoveredSelect })
            .mockReturnValueOnce({ select: queuedSelect });
        vi.spyOn(AiJob, "find").mockReturnValue({
            select: vi.fn().mockResolvedValue([]),
        });
        vi.spyOn(AiJob, "updateMany").mockResolvedValueOnce({
            modifiedCount: 0,
        });
        const now = new Date("2026-07-11T10:00:00.000Z");
        await claimNextAiJob({ workerId: "worker-test", now });
        const [recoveryFilter, recoveryUpdate] = find.mock.calls[0];
        expect(recoveryFilter).toMatchObject({
            status: AI_JOB_STATUSES.PROCESSING,
            "lease.expiresAt": { $lte: now },
        });
        expect(recoveryFilter).not.toHaveProperty("$expr");
        expect(recoveryUpdate).toMatchObject({
            $inc: { leaseRecoveryCount: 1 },
        });
        const [queuedFilter] = find.mock.calls[1];
        expect(queuedFilter.status.$in).toEqual(
            expect.arrayContaining([
                AI_JOB_STATUSES.QUEUED,
                AI_JOB_STATUSES.FAILED_RETRYABLE,
            ]),
        );
        expect(queuedFilter.$expr).toEqual({
            $lt: ["$attempts", "$maxAttempts"],
        });
    });

    it("renova apenas o lease opaco reclamado pelo worker", async () => {
        const update = vi
            .spyOn(AiJob, "updateOne")
            .mockResolvedValueOnce({ modifiedCount: 1 });
        const now = new Date("2026-07-11T10:00:00.000Z");
        const job = {
            _id: "66c000000000000000000001",
            lease: { token: "lease-secret" },
        };

        await expect(
            renewAiJobLease(job, { now, leaseMs: 120_000 }),
        ).resolves.toBe(true);
        expect(update).toHaveBeenCalledWith(
            {
                _id: job._id,
                status: AI_JOB_STATUSES.PROCESSING,
                "lease.token": "lease-secret",
            },
            {
                $set: {
                    "lease.expiresAt": new Date(
                        "2026-07-11T10:02:00.000Z",
                    ),
                },
            },
        );
    });

    it("estaciona falha transitória esgotada e abre nova janela manual", async () => {
        const update = vi
            .spyOn(AiJob, "updateOne")
            .mockResolvedValueOnce({ modifiedCount: 1 });
        const now = new Date("2026-07-11T10:00:00.000Z");
        const job = {
            _id: "66c000000000000000000001",
            attempts: 4,
            maxAttempts: 4,
            lease: { token: "lease-secret" },
        };

        await expect(
            failAiJob(job, { transient: true, code: "OPENAI_TIMEOUT" }, { now }),
        ).resolves.toBe(AI_JOB_STATUSES.FAILED_RETRYABLE);
        expect(update.mock.calls[0][1].$set).toMatchObject({
            status: AI_JOB_STATUSES.FAILED_RETRYABLE,
            availableAt: now,
            terminalAt: null,
            "lastError.retryable": true,
        });

        const findOneAndUpdate = vi
            .spyOn(AiJob, "findOneAndUpdate")
            .mockResolvedValueOnce({
                _id: job._id,
                type: AI_JOB_TYPES.ANALYZE_PHOTOS,
                status: AI_JOB_STATUSES.QUEUED,
                attempts: 0,
                maxAttempts: 4,
                manualRetryCount: 1,
            });
        await retryOwnedAiJob("66a000000000000000000001", job._id, { now });
        expect(findOneAndUpdate.mock.calls[0][1]).toMatchObject({
            $set: {
                status: AI_JOB_STATUSES.QUEUED,
                attempts: 0,
                leaseRecoveryCount: 0,
            },
            $inc: { manualRetryCount: 1 },
        });
    });
});
