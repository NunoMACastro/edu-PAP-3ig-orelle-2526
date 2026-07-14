/**
 * Prova end-to-end do workflow de privacidade num replica set efémero.
 *
 * O teste nunca lê MONGODB_URI. Exercita transações reais, compare-and-set,
 * ownership, filesystem, falha após unlink e retry idempotente.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { AiInteractionHistory } from "../src/models/ai-interaction-history.model.js";
import { AiJob } from "../src/models/ai-job.model.js";
import { BeforeAfterVisualization } from "../src/models/before-after-visualization.model.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { FileDeletionJob } from "../src/models/file-deletion-job.model.js";
import { MakeupSimulation } from "../src/models/makeup-simulation.model.js";
import { MakeupSimulationQuota } from "../src/models/makeup-simulation-quota.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { ReportPhotoGrant } from "../src/models/report-photo-grant.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import {
    decideBiometricDataRequest,
    listMyBiometricDataRequests,
    processApprovedPrivacyRequest,
    retryBiometricDataRequest,
} from "../src/services/biometric-data-request.service.js";

const DATABASE_NAME = "orelle_privacy_requests_test";
const ADMIN_ROLE = "administrador";

const REPORT_GRAPH_MODELS = Object.freeze([
    AiConsultationSession,
    AiInteractionHistory,
    AiJob,
    BeforeAfterVisualization,
    DailyRoutine,
    FaceAnalysis,
    FaceReport,
    MakeupSimulation,
    MakeupSimulationQuota,
    ProductRecommendation,
    ReportUnlock,
    SkinComparison,
    AiConsultationReview,
]);

let replicaSet;
let storageDirectory;

const VALID_PHOTO_QUALITY = Object.freeze({
    profileVersion: "face-photo-quality-v1",
    status: "pass",
    failures: [],
    warnings: [],
    metrics: {
        lumaMean: 128,
        darkClippedRatio: 0,
        lightClippedRatio: 0,
        blurVariance: 80,
    },
});

/**
 * Recusa qualquer URI que não seja o replica set loopback criado pelo teste.
 *
 * @param {string} uri - URI efémera.
 * @returns {void}
 */
function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("Teste de privacidade recusou URI não efémera");
    }
}

/**
 * Cria bytes e metadados faciais válidos para um titular.
 *
 * @param {mongoose.Types.ObjectId} userId - Titular.
 * @param {string} label - Namespace do cenário.
 * @returns {Promise<string[]>} Paths físicos criados.
 */
async function createFaceResources(userId, label) {
    const paths = [];
    const consentId = new mongoose.Types.ObjectId();
    const consultationSessionId = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();
    const reportId = new mongoose.Types.ObjectId();
    const recommendationId = new mongoose.Types.ObjectId();
    const reviewId = new mongoose.Types.ObjectId();
    const simulationId = new mongoose.Types.ObjectId();
    const simulationJobId = new mongoose.Types.ObjectId();

    for (const kind of ["frontal", "perfil"]) {
        const storageKey = path.join(
            storageDirectory,
            `${label}-${kind}.webp.enc`,
        );
        await writeFile(storageKey, Buffer.from(`private-${label}-${kind}`), {
            mode: 0o600,
        });
        paths.push(storageKey);
        await FacePhoto.create({
            userId,
            kind,
            storageKey,
            encryption: {
                algorithm: "aes-256-gcm",
                keyVersion: 2,
                aadHash: Buffer.alloc(32).toString("base64"),
                iv: Buffer.alloc(12).toString("base64"),
                authTag: Buffer.alloc(16).toString("base64"),
            },
            originalName: `${kind}.webp`,
            mimeType: "image/webp",
            sizeBytes: 24,
            quality: VALID_PHOTO_QUALITY,
            consentId,
            status: "active",
        });
    }

    const makeupOutputStorageKey = path.join(
        storageDirectory,
        `${label}-makeup.webp.enc`,
    );
    await writeFile(
        makeupOutputStorageKey,
        Buffer.from(`private-${label}-makeup-output`),
        { mode: 0o600 },
    );
    paths.push(makeupOutputStorageKey);

    // Inserções diretas exercitam toda a cascata v2 sem depender de providers,
    // chaves OpenAI ou da decifragem de payloads que só serão eliminados.
    await AiConsultationSession.collection.insertOne({
        _id: consultationSessionId,
        userId,
        reportId,
        analysisId,
        currentReviewId: reviewId,
        testMarker: label,
    });
    await AiInteractionHistory.collection.insertOne({
        userId,
        sessionId: consultationSessionId,
        testMarker: label,
    });
    await FaceAnalysis.collection.insertOne({
        _id: analysisId,
        userId,
        consultationSessionId,
        testMarker: label,
    });
    await FaceReport.collection.insertOne({
        _id: reportId,
        userId,
        analysisId,
        consultationSessionId,
        cosmeticSummary: "texto pessoal",
        routineSuggestions: ["texto livre"],
        sources: ["fonte"],
        limitations: ["limitação"],
        privacyStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    await ProductRecommendation.collection.insertOne({
        _id: recommendationId,
        userId,
        reportId,
        analysisId,
        testMarker: label,
    });
    await AiConsultationReview.collection.insertOne({
        _id: reviewId,
        userId,
        reportId,
        consultationSessionId,
        recommendationIds: [recommendationId],
        testMarker: label,
    });
    await AiConsultationAuditLog.collection.insertOne({
        actorId: new mongoose.Types.ObjectId(),
        actorRole: "consultor",
        action: "detail",
        reviewId,
        occurredAt: new Date(),
    });
    await ReportPhotoGrant.collection.insertOne({
        clientUserId: userId,
        reportId,
        reviewId,
        consentId,
        testMarker: label,
    });
    await ReportUnlock.collection.insertOne({
        userId,
        reportId,
        analysisId,
        recommendationIds: [recommendationId],
        testMarker: label,
    });
    await AiJob.collection.insertMany([
        {
            _id: new mongoose.Types.ObjectId(),
            userId,
            consultationSessionId,
            type: "generate_report",
            deduplicationKey: `${label}-report-job`,
            status: "queued",
            testMarker: label,
        },
        {
            _id: simulationJobId,
            userId,
            type: "generate_makeup_preview",
            deduplicationKey: `${label}-makeup-job`,
            status: "queued",
            testMarker: label,
        },
    ]);
    await MakeupSimulation.collection.insertOne({
        _id: simulationId,
        userId,
        schemaVersion: 2,
        reportId,
        jobId: simulationJobId,
        outputStorageKey: makeupOutputStorageKey,
        status: "completed",
        testMarker: label,
    });
    await MakeupSimulationQuota.collection.insertOne({
        userId,
        reservations: [{ simulationId, createdAt: new Date() }],
        testMarker: label,
    });
    await BeforeAfterVisualization.collection.insertOne({
        userId,
        simulationId,
        testMarker: label,
    });
    await DailyRoutine.collection.insertOne({
        userId,
        testMarker: label,
    });
    await SkinComparison.collection.insertOne({
        userId,
        baselineAnalysisId: analysisId,
        followUpAnalysisId: new mongoose.Types.ObjectId(),
        testMarker: label,
    });
    await RecommendationReview.collection.insertOne({
        clientUserId: userId,
        recommendationId,
        testMarker: label,
    });

    return paths;
}

/**
 * Cria pedido e respetivos recursos privados.
 *
 * @param {string} label - Nome do cenário.
 * @param {"delete"|"anonymize"} [action] - Ação solicitada.
 * @param {string[]} [resources] - Recursos abrangidos pelo pedido.
 * @returns {Promise<{request: object, userId: mongoose.Types.ObjectId, paths: string[]}>} Fixture persistida.
 */
async function createPrivacyFixture(
    label,
    action = "delete",
    resources = ["photos", "reports"],
) {
    const userId = new mongoose.Types.ObjectId();
    const paths = await createFaceResources(userId, label);
    const request = await BiometricDataRequest.create({
        requesterId: userId,
        scope: "biometric",
        action,
        resources,
        reason: `Pedido ${label}`,
    });

    return { request, userId, paths };
}

describe("pedidos canónicos de privacidade com eliminação física", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            throw new Error("O teste exige a ligação Mongoose desligada");
        }

        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), "orelle-privacy-test-"),
        );
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralUri(uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
        await Promise.all([
            BiometricAccessLog.syncIndexes(),
            BiometricDataRequest.syncIndexes(),
            FacePhoto.syncIndexes(),
            FaceReport.syncIndexes(),
            FileDeletionJob.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        if (mongoose.connection.readyState === 1) {
            await Promise.all(
                Object.values(mongoose.connection.collections).map(
                    (collection) => collection.deleteMany({}),
                ),
            );
        }
        await rm(storageDirectory, { recursive: true, force: true });
        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), "orelle-privacy-test-"),
        );
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        await replicaSet?.stop();
        await rm(storageDirectory, { recursive: true, force: true });
    }, 60_000);

    it("aplica uma única decisão concorrente e só conclui sem bytes/documentos", async () => {
        const fixture = await createPrivacyFixture("concurrent-delete");
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };

        const outcomes = await Promise.allSettled([
            decideBiometricDataRequest(fixture.request._id.toString(), actor, {
                decision: "approved",
                decisionReason: "Pedido confirmado.",
            }),
            decideBiometricDataRequest(fixture.request._id.toString(), actor, {
                decision: "approved",
                decisionReason: "Pedido confirmado.",
            }),
        ]);

        expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
        expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(1);
        const rejected = outcomes.find(({ status }) => status === "rejected");
        expect(rejected.reason).toMatchObject({ statusCode: 409 });

        const request = await BiometricDataRequest.findById(fixture.request._id)
            .select("+lease.token")
            .lean();
        expect(request).toMatchObject({
            status: "completed",
            attempts: 1,
            decisionError: "",
        });
        expect(request.erasureVerifiedAt).toBeInstanceOf(Date);
        expect(request.lease.token).toBeNull();
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(0);
        expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(0);
        for (const model of REPORT_GRAPH_MODELS) {
            expect(await model.countDocuments({ userId: fixture.userId })).toBe(
                0,
            );
        }
        expect(
            await ReportPhotoGrant.countDocuments({
                clientUserId: fixture.userId,
            }),
        ).toBe(0);
        expect(
            await RecommendationReview.countDocuments({
                clientUserId: fixture.userId,
            }),
        ).toBe(0);
        expect(
            await AiConsultationAuditLog.countDocuments({ action: "detail" }),
        ).toBe(0);

        for (const storageKey of fixture.paths) {
            await expect(readFile(storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }

        const jobs = await FileDeletionJob.find({
            status: "completed",
        }).lean();
        expect(jobs).toHaveLength(3);
        expect(jobs.every(({ status, attempts }) => status === "completed" && attempts === 1)).toBe(true);
        expect(
            jobs.every(
                ({ ownerId, sourceType, sourceId, terminalAt }) =>
                    ownerId === undefined &&
                    sourceType === undefined &&
                    sourceId === undefined &&
                    terminalAt instanceof Date,
            ),
        ).toBe(true);
        expect(JSON.stringify(jobs)).not.toContain(storageDirectory);
        expect(JSON.stringify(outcomes)).not.toContain(storageDirectory);

        const replay = await retryBiometricDataRequest(
            fixture.request._id.toString(),
            actor,
            { decisionReason: "Replay administrativo seguro." },
        );
        const jobsAfterReplay = await FileDeletionJob.find({
            _id: { $in: jobs.map(({ _id }) => _id) },
            status: "completed",
        }).lean();
        expect(replay).toMatchObject({ status: "completed", attempts: 1 });
        expect(jobsAfterReplay).toHaveLength(3);
        expect(jobsAfterReplay.every(({ attempts }) => attempts === 1)).toBe(
            true,
        );
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: fixture.request._id.toString(),
                result: "allowed",
            }),
        ).toBe(2);
    }, 30_000);

    it("remove o grafo v2 e output derivado num pedido só de relatórios sem apagar as fotografias fonte", async () => {
        const fixture = await createPrivacyFixture(
            "reports-only",
            "anonymize",
            ["reports"],
        );
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };

        const result = await decideBiometricDataRequest(
            fixture.request._id.toString(),
            actor,
            {
                decision: "approved",
                decisionReason: "Anonimização sem agregado seguro.",
            },
        );

        expect(result).toMatchObject({ status: "completed" });
        for (const model of REPORT_GRAPH_MODELS) {
            expect(await model.countDocuments({ userId: fixture.userId })).toBe(
                0,
            );
        }
        expect(
            await ReportPhotoGrant.countDocuments({
                clientUserId: fixture.userId,
            }),
        ).toBe(0);
        expect(
            await AiConsultationAuditLog.countDocuments({ action: "detail" }),
        ).toBe(0);
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(
            2,
        );
        await expect(readFile(fixture.paths[0])).resolves.toBeInstanceOf(Buffer);
        await expect(readFile(fixture.paths[1])).resolves.toBeInstanceOf(Buffer);
        await expect(readFile(fixture.paths[2])).rejects.toMatchObject({
            code: "ENOENT",
        });
    }, 30_000);

    it("não confirma aprovação quando o audit falha e permite retry", async () => {
        const fixture = await createPrivacyFixture("approval-audit-rollback");
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };
        const auditSpy = vi
            .spyOn(BiometricAccessLog, "create")
            .mockRejectedValueOnce(new Error("falha-injetada-audit"));

        try {
            await expect(
                decideBiometricDataRequest(
                    fixture.request._id.toString(),
                    actor,
                    {
                        decision: "approved",
                        decisionReason: "Pedido confirmado com audit atómico.",
                    },
                ),
            ).rejects.toThrow("falha-injetada-audit");
        } finally {
            auditSpy.mockRestore();
        }

        expect(
            await BiometricDataRequest.findById(fixture.request._id).lean(),
        ).toMatchObject({
            status: "failed",
            attempts: 1,
            completedAt: null,
            erasureVerifiedAt: null,
        });
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: fixture.request._id.toString(),
                result: "allowed",
            }),
        ).toBe(0);
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: fixture.request._id.toString(),
                result: "denied",
            }),
        ).toBe(1);

        const retried = await retryBiometricDataRequest(
            fixture.request._id.toString(),
            actor,
            { decisionReason: "Retry depois da indisponibilidade do audit." },
        );

        expect(retried).toMatchObject({ status: "completed", attempts: 2 });
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: fixture.request._id.toString(),
                result: "allowed",
            }),
        ).toBe(1);
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(
            0,
        );
        expect(
            await FaceReport.countDocuments({ userId: fixture.userId }),
        ).toBe(0);
    }, 30_000);

    it("recupera completed legado sem evidência física antes de aceitar replay", async () => {
        const fixture = await createPrivacyFixture("legacy-completed");
        await BiometricDataRequest.updateOne(
            { _id: fixture.request._id },
            {
                $set: {
                    status: "completed",
                    completedAt: new Date("2026-06-01T10:00:00.000Z"),
                },
                $unset: { erasureVerifiedAt: "" },
            },
        );
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };

        const recovered = await retryBiometricDataRequest(
            fixture.request._id.toString(),
            actor,
            { decisionReason: "Recuperação de pedido legado." },
        );

        expect(recovered).toMatchObject({ status: "completed", attempts: 1 });
        expect(
            await BiometricDataRequest.findById(fixture.request._id).lean(),
        ).toMatchObject({
            status: "completed",
            attempts: 1,
            erasureVerifiedAt: expect.any(Date),
        });
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(
            0,
        );
        expect(
            await FaceReport.countDocuments({ userId: fixture.userId }),
        ).toBe(0);
        for (const storageKey of fixture.paths) {
            await expect(readFile(storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }
    }, 30_000);

    it("mantém failed após crash pós-unlink e retry confirma ENOENT de forma idempotente", async () => {
        const fixture = await createPrivacyFixture(
            "retry-anonymize",
            "anonymize",
        );
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };
        let injected = false;

        await expect(
            processApprovedPrivacyRequest(
                fixture.request._id.toString(),
                actor,
                { decisionReason: "Anonimização confirmada." },
                {
                    fileWorker: {
                        afterUnlink: async () => {
                            if (!injected) {
                                injected = true;
                                throw new Error("segredo-interno-injetado");
                            }
                        },
                    },
                },
            ),
        ).rejects.toMatchObject({ statusCode: 503 });

        const failedRequest = await BiometricDataRequest.findById(
            fixture.request._id,
        ).lean();
        const failedJobs = await FileDeletionJob.find({
            sourceId: fixture.request._id.toString(),
        }).lean();
        const failedJobIds = failedJobs.map(({ _id }) => _id);
        expect(failedRequest.status).toBe("failed");
        expect(failedRequest.attempts).toBe(1);
        expect(failedRequest.completedAt).toBeNull();
        expect(failedRequest.decisionError).toContain("Pode ser reprocessado");
        expect(JSON.stringify(failedRequest)).not.toContain("segredo-interno-injetado");
        expect(failedJobs.some(({ status }) => status === "failed")).toBe(true);
        expect(JSON.stringify(failedJobs)).not.toContain("segredo-interno-injetado");
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(2);
        expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(0);

        const retried = await retryBiometricDataRequest(
            fixture.request._id.toString(),
            actor,
            { decisionReason: "Retry operacional." },
        );
        expect(retried).toMatchObject({ status: "completed", attempts: 2 });
        expect(await FacePhoto.countDocuments({ userId: fixture.userId })).toBe(0);
        expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(0);

        for (const storageKey of fixture.paths) {
            await expect(readFile(storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }

        const retriedJobs = await FileDeletionJob.find({
            _id: { $in: failedJobIds },
        }).lean();
        expect(retriedJobs.every(({ status }) => status === "completed")).toBe(true);
        expect(retriedJobs.some(({ attempts }) => attempts === 2)).toBe(true);
        expect(
            retriedJobs.every(
                ({ ownerId, sourceType, sourceId, terminalAt }) =>
                    ownerId === undefined &&
                    sourceType === undefined &&
                    sourceId === undefined &&
                    terminalAt instanceof Date,
            ),
        ).toBe(true);
    }, 30_000);

    it("faz rollback integral quando o outbox não pode ser criado", async () => {
        const fixture = await createPrivacyFixture("outbox-rollback");
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };
        const bulkWriteSpy = vi
            .spyOn(FileDeletionJob, "bulkWrite")
            .mockRejectedValueOnce(new Error("falha-interna-outbox"));

        try {
            await expect(
                processApprovedPrivacyRequest(
                    fixture.request._id.toString(),
                    actor,
                    { decisionReason: "Pedido confirmado." },
                ),
            ).rejects.toThrow("falha-interna-outbox");
        } finally {
            bulkWriteSpy.mockRestore();
        }

        const persistedRequest = await BiometricDataRequest.findById(
            fixture.request._id,
        ).lean();
        expect(persistedRequest).toMatchObject({
            status: "pending",
            attempts: 0,
            reviewerId: null,
        });
        expect(
            await FacePhoto.countDocuments({
                userId: fixture.userId,
                status: "active",
            }),
        ).toBe(2);
        expect(
            await FaceReport.countDocuments({ userId: fixture.userId }),
        ).toBe(1);
        expect(await FileDeletionJob.countDocuments({})).toBe(0);

        for (const storageKey of fixture.paths) {
            await expect(readFile(storageKey)).resolves.toBeInstanceOf(Buffer);
        }
    }, 30_000);

    it("aceita apenas uma rejeição concorrente através de compare-and-set", async () => {
        const request = await BiometricDataRequest.create({
            requesterId: new mongoose.Types.ObjectId(),
            scope: "biometric",
            action: "delete",
            resources: ["reports"],
            reason: "Pedido duplicado",
        });
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };

        const outcomes = await Promise.allSettled([
            decideBiometricDataRequest(request._id.toString(), actor, {
                decision: "rejected",
                decisionReason: "Pedido já tratado anteriormente.",
            }),
            decideBiometricDataRequest(request._id.toString(), actor, {
                decision: "rejected",
                decisionReason: "Pedido já tratado anteriormente.",
            }),
        ]);

        expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(
            1,
        );
        expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
            1,
        );
        expect(
            outcomes.find(({ status }) => status === "rejected").reason,
        ).toMatchObject({ statusCode: 409 });
        const stored = await BiometricDataRequest.findById(request._id);
        expect(stored).toMatchObject({ status: "rejected", attempts: 0 });
        expect(stored.decisionReason).toBe("Pedido já tratado anteriormente.");
        const raw = await BiometricDataRequest.collection.findOne({
            _id: request._id,
        });
        expect(raw.decisionReason).toMatchObject({
            encrypted: true,
            keyVersion: 2,
            aadHash: expect.any(String),
        });
        expect(JSON.stringify(raw)).not.toContain(
            "Pedido já tratado anteriormente.",
        );
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: request._id.toString(),
                result: "allowed",
            }),
        ).toBe(1);
    });

    it("faz rollback da rejeição quando o audit append-only falha", async () => {
        const request = await BiometricDataRequest.create({
            requesterId: new mongoose.Types.ObjectId(),
            scope: "biometric",
            action: "delete",
            resources: ["reports"],
            reason: "Pedido com falha de audit",
        });
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: ADMIN_ROLE,
        };
        const auditSpy = vi
            .spyOn(BiometricAccessLog, "create")
            .mockRejectedValueOnce(new Error("falha-injetada-audit-rejeicao"));

        try {
            await expect(
                decideBiometricDataRequest(request._id.toString(), actor, {
                    decision: "rejected",
                    decisionReason: "Rejeição exige audit atómico.",
                }),
            ).rejects.toThrow("falha-injetada-audit-rejeicao");
        } finally {
            auditSpy.mockRestore();
        }

        expect(await BiometricDataRequest.findById(request._id).lean()).toMatchObject(
            {
                status: "pending",
                attempts: 0,
                reviewerId: null,
            },
        );
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: request._id.toString(),
                result: "allowed",
            }),
        ).toBe(0);
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: request._id.toString(),
                result: "denied",
            }),
        ).toBe(1);

        const retried = await decideBiometricDataRequest(
            request._id.toString(),
            actor,
            {
                decision: "rejected",
                decisionReason: "Rejeição confirmada no retry.",
            },
        );
        expect(retried).toMatchObject({ status: "rejected" });
        expect(
            await BiometricAccessLog.countDocuments({
                resourceId: request._id.toString(),
                result: "allowed",
            }),
        ).toBe(1);
    });

    it("lista exclusivamente pedidos pertencentes ao titular", async () => {
        const ownerId = new mongoose.Types.ObjectId();
        const otherOwnerId = new mongoose.Types.ObjectId();
        await BiometricDataRequest.create([
            {
                requesterId: ownerId,
                action: "delete",
                resources: ["photos"],
                reason: "Meu pedido",
            },
            {
                requesterId: otherOwnerId,
                action: "delete",
                resources: ["reports"],
                reason: "Pedido alheio",
            },
        ]);

        const ownRequests = await listMyBiometricDataRequests(
            ownerId.toString(),
        );
        expect(ownRequests).toHaveLength(1);
        expect(ownRequests[0]).toMatchObject({
            requesterId: ownerId.toString(),
            reason: "Meu pedido",
        });
        expect(JSON.stringify(ownRequests)).not.toContain("Pedido alheio");
    });
});
