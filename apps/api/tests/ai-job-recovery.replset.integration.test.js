/** Recuperação real de jobs, projeção de estado e limite de leases perdidas. */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../src/models/ai-consultation-session.model.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../src/models/ai-job.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { retryAiConsultationOperation } from "../src/services/ai-consultation.service.js";
import { runAiJobWorkerOnce } from "../src/services/ai-job.service.js";

const DATABASE_NAME = "orelle_ai_job_recovery_test";
let replicaSet;
let previousOpenAiKey;

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
        throw new Error("URI externa recusada no teste de recuperação de jobs");
    }
    await mongoose.connect(uri);
    previousOpenAiKey = env.openAiApiKey;
    env.openAiApiKey = "test-openai-key-not-a-real-credential";
    await Promise.all([
        AiConsultationSession.syncIndexes(),
        AiJob.syncIndexes(),
        FaceConsent.syncIndexes(),
    ]);
}, 30_000);

afterEach(async () => {
    await Promise.all([
        AiConsultationSession.deleteMany({}),
        AiJob.deleteMany({}),
        FaceConsent.deleteMany({}),
    ]);
});

afterAll(async () => {
    env.openAiApiKey = previousOpenAiKey;
    await mongoose.disconnect();
    await replicaSet?.stop();
});

async function createJobFixture({
    status = AI_JOB_STATUSES.QUEUED,
    attempts = 0,
    maxAttempts = 4,
    leaseRecoveryCount = 0,
    leaseExpiresAt = null,
} = {}) {
    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();
    const jobId = new mongoose.Types.ObjectId();
    const acceptedAt = new Date("2026-07-11T08:00:00.000Z");
    await FaceConsent.create({
        userId,
        acceptedAt,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: env.openAiNoticeVersion,
            acceptedAt,
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    });
    await AiConsultationSession.create({
        _id: sessionId,
        userId,
        goalSelection: {
            primaryGoal: "hydration_barrier",
            secondaryGoals: [],
        },
        conversation: { turns: [], currentQuestion: null },
        facts: {},
        answers: [],
        flowState: AI_CONSULTATION_FLOW_STATES.ANALYZING,
        status: "active",
        isOpen: true,
        currentJobId: jobId,
    });
    await AiJob.create({
        _id: jobId,
        type: AI_JOB_TYPES.ANALYZE_PHOTOS,
        userId,
        consultationSessionId: sessionId,
        resourceType: "AiConsultationSession",
        resourceId: sessionId.toString(),
        deduplicationKey: `recovery:${jobId}`,
        status,
        attempts,
        maxAttempts,
        leaseRecoveryCount,
        availableAt: new Date("2026-07-11T09:00:00.000Z"),
        lease:
            status === AI_JOB_STATUSES.PROCESSING
                ? {
                      token: "expired-worker-token",
                      workerId: "expired-worker",
                      expiresAt: leaseExpiresAt,
                  }
                : undefined,
    });
    return { userId, sessionId, jobId };
}

describe("worker IA recuperável", () => {
    it("mantém o estado ativo e o polling durante um auto-retry", async () => {
        const fixture = await createJobFixture();
        const failed = await runAiJobWorkerOnce({
            workerId: "worker-failure",
            now: new Date("2026-07-11T10:00:00.000Z"),
            handlers: {
                [AI_JOB_TYPES.ANALYZE_PHOTOS]: async () => {
                    const error = new Error("timeout controlado");
                    error.transient = true;
                    error.code = "OPENAI_TIMEOUT";
                    throw error;
                },
            },
        });
        expect(failed.status).toBe(AI_JOB_STATUSES.FAILED_RETRYABLE);
        expect(
            (await AiConsultationSession.findById(fixture.sessionId)).flowState,
        ).toBe(AI_CONSULTATION_FLOW_STATES.ANALYZING);

        await AiJob.updateOne(
            { _id: fixture.jobId },
            { $set: { availableAt: new Date("2026-07-11T10:00:00.000Z") } },
        );
        let flowObservedByHandler = null;
        const retried = await runAiJobWorkerOnce({
            workerId: "worker-retry",
            now: new Date("2026-07-11T10:00:01.000Z"),
            handlers: {
                [AI_JOB_TYPES.ANALYZE_PHOTOS]: async () => {
                    flowObservedByHandler = (
                        await AiConsultationSession.findById(fixture.sessionId)
                    ).flowState;
                    return {
                        resourceType: "FaceAnalysis",
                        resourceId: new mongoose.Types.ObjectId().toString(),
                        flowState: "asking_questions",
                    };
                },
            },
        });
        expect(retried.status).toBe(AI_JOB_STATUSES.COMPLETED);
        expect(flowObservedByHandler).toBe(
            AI_CONSULTATION_FLOW_STATES.ANALYZING,
        );
    });

    it("recupera a lease expirada da última tentativa sem incrementar attempts", async () => {
        const fixture = await createJobFixture({
            status: AI_JOB_STATUSES.PROCESSING,
            attempts: 4,
            maxAttempts: 4,
            leaseExpiresAt: new Date("2026-07-11T09:59:00.000Z"),
        });
        let claimedAttempts = null;
        const result = await runAiJobWorkerOnce({
            workerId: "worker-after-restart",
            now: new Date("2026-07-11T10:00:00.000Z"),
            handlers: {
                [AI_JOB_TYPES.ANALYZE_PHOTOS]: async (job) => {
                    claimedAttempts = job.attempts;
                    return {
                        resourceType: "FaceAnalysis",
                        resourceId: new mongoose.Types.ObjectId().toString(),
                        flowState: "asking_questions",
                    };
                },
            },
        });

        expect(result.status).toBe(AI_JOB_STATUSES.COMPLETED);
        expect(claimedAttempts).toBe(4);
        const persisted = await AiJob.findById(fixture.jobId);
        expect(persisted.attempts).toBe(4);
        expect(persisted.leaseRecoveryCount).toBe(1);
    });

    it("não deixa processing eterno depois de três workers perdidos", async () => {
        const fixture = await createJobFixture({
            status: AI_JOB_STATUSES.PROCESSING,
            attempts: 4,
            maxAttempts: 4,
            leaseRecoveryCount: 3,
            leaseExpiresAt: new Date("2026-07-11T09:59:00.000Z"),
        });
        const result = await runAiJobWorkerOnce({
            workerId: "worker-exhausted",
            now: new Date("2026-07-11T10:00:00.000Z"),
            handlers: {},
        });

        expect(result.claimed).toBe(false);
        const [job, consultation] = await Promise.all([
            AiJob.findById(fixture.jobId),
            AiConsultationSession.findById(fixture.sessionId),
        ]);
        expect(job.status).toBe(AI_JOB_STATUSES.FAILED_RETRYABLE);
        expect(job.lastError.code).toBe("AI_JOB_LEASE_RECOVERY_EXHAUSTED");
        expect(consultation.flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
        );
    });

    it("projeta falha terminal e o retry manual repõe job e sessão no estado ativo", async () => {
        const fixture = await createJobFixture();
        const result = await runAiJobWorkerOnce({
            workerId: "worker-terminal-failure",
            now: new Date("2026-07-11T10:00:00.000Z"),
            handlers: {
                [AI_JOB_TYPES.ANALYZE_PHOTOS]: async () => {
                    const error = new Error("schema inválido sanitizado");
                    error.code = "OPENAI_SCHEMA_INVALID";
                    throw error;
                },
            },
        });

        expect(result.status).toBe(AI_JOB_STATUSES.FAILED_TERMINAL);
        const [failedJob, projectedSession] = await Promise.all([
            AiJob.findById(fixture.jobId),
            AiConsultationSession.findById(fixture.sessionId),
        ]);
        expect(failedJob).toMatchObject({
            status: AI_JOB_STATUSES.FAILED_TERMINAL,
            lastError: {
                code: "OPENAI_SCHEMA_INVALID",
                retryable: false,
            },
        });
        expect(failedJob.terminalAt).toBeInstanceOf(Date);
        expect(projectedSession.flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
        );

        const retried = await retryAiConsultationOperation(
            fixture.userId.toString(),
            fixture.sessionId.toString(),
        );
        expect(retried).toMatchObject({
            flowState: AI_CONSULTATION_FLOW_STATES.ANALYZING,
            operation: {
                id: fixture.jobId.toString(),
                status: AI_JOB_STATUSES.QUEUED,
                attempts: 0,
                error: null,
            },
        });
        const reopenedJob = await AiJob.findById(fixture.jobId);
        expect(reopenedJob).toMatchObject({
            status: AI_JOB_STATUSES.QUEUED,
            attempts: 0,
            manualRetryCount: 1,
        });
        expect(reopenedJob.terminalAt).toBeNull();
        expect(reopenedJob.lastError.code).toBeNull();
    });
});
