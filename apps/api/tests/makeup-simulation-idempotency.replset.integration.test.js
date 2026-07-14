/**
 * Provas transacionais da idempotência e quota móvel da edição de maquilhagem.
 *
 * O teste usa um replica set efémero, sem `.env`, rede OpenAI ou fotografia
 * real. O objetivo é provar que a fronteira `simulação + job + quota` é uma
 * única operação lógica mesmo sob concorrência.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    AiJob,
    AI_JOB_STATUSES,
} from "../src/models/ai-job.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FileDeletionJob } from "../src/models/file-deletion-job.model.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../src/models/face-report.model.js";
import { MakeupSimulationQuota } from "../src/models/makeup-simulation-quota.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../src/models/makeup-simulation.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Product } from "../src/models/product.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../src/models/report-unlock.model.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
    GENERATIVE_MAKEUP_NOTICE_VERSION,
} from "../src/constants/purpose-grants.js";
import {
    createCosmeticVisualizationForReport,
    createMakeupSimulationForReport,
    revokeMakeupSimulationConsent,
} from "../src/services/makeup-simulation.service.js";

const DATABASE_NAME = "orelle_makeup_idempotency_test";
const OPENAI_NOTICE_VERSION = "openai-cosmetic-consultation-v2";
const DAY_MS = 24 * 60 * 60 * 1000;
let replicaSet;

function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("URI externa recusada no teste de idempotência");
    }
}

async function createOwnerContext() {
    const userId = new mongoose.Types.ObjectId();
    const acceptedAt = new Date();
    const consent = await FaceConsent.create({
        userId,
        acceptedAt,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: OPENAI_NOTICE_VERSION,
            acceptedAt,
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    });
    const photo = await FacePhoto.create({
        userId,
        kind: "frontal",
        storageKey: `/private/${userId.toString()}/frontal.webp.enc`,
        encryption: {
            algorithm: "aes-256-gcm",
            keyVersion: 2,
            aadHash: "a".repeat(64),
            iv: Buffer.alloc(12).toString("base64"),
            authTag: Buffer.alloc(16).toString("base64"),
        },
        originalName: "frontal.webp",
        mimeType: "image/webp",
        sizeBytes: 1024,
        quality: {
            profileVersion: "photo-quality-v1",
            status: "pass",
            failures: [],
            warnings: [],
            metrics: {
                lumaMean: 128,
                darkClippedRatio: 0,
                lightClippedRatio: 0,
                blurVariance: 120,
            },
        },
        consentId: consent._id,
        status: "active",
    });
    const analysis = await FaceAnalysis.create({
        schemaVersion: 2,
        userId,
        photoIds: [photo._id],
        consentId: consent._id,
        providerName: "openai",
        providerVersion: "gpt-test",
        mode: "openai",
        isDemo: false,
        findings: { skinType: "combination" },
        photoQuality: { status: "pass", warnings: [], failures: [] },
        sources: ["openai-responses"],
        limitations: ["Teste cosmético sem finalidade médica."],
        safetyFlags: [],
        provenance: {
            requestedModel: "gpt-test-primary",
            effectiveModel: "gpt-test-primary",
            requestId: "makeup-idempotency-fixture",
            promptVersion: "analysis-test-v2",
            schemaVersion: "analysis-test-v2",
        },
        status: "completed",
    });
    return { userId, consent, photo, analysis };
}

async function createUnlockedReport(context, label) {
    const productId = new mongoose.Types.ObjectId();
    await Product.create({
        _id: productId,
        name: `Produto ${label}`,
        brandName: "Orélle Test",
        description: "Produto de teste com variante atualmente disponível.",
        ingredientNames: ["glycerin"],
        inciIngredients: ["glycerin"],
        skinTypes: ["mista"],
        imageUrl: `/images/product-${label}.webp`,
        priceCents: 2000,
        stock: 10,
        aiEligible: true,
        concernTags: ["makeup"],
        routineSteps: ["complexion"],
        variants: [
            {
                variantId: `variant-${label}`,
                label: `Tom ${label}`,
                colorHex: "#D7A17D",
                finish: "natural",
                coverage: "medium",
                priceCents: 2000,
                stock: 10,
            },
        ],
        createdBy: new mongoose.Types.ObjectId(),
    });
    const report = await FaceReport.create({
        schemaVersion: 2,
        version: 1,
        userId: context.userId,
        analysisId: context.analysis._id,
        lifecycleStatus: FACE_REPORT_LIFECYCLE.UNLOCKED,
        objectives: [{ code: "makeup", priority: "primary" }],
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        cosmeticSummary: `Resumo ${label}`,
        routineSuggestions: [],
        sources: ["openai-responses"],
        limitations: ["Sem finalidade médica."],
        simulationSpec: {
            enabled: true,
            regions: ["complexion"],
            lookDescription: `Look ${label}`,
            preserve: ["identity", "skin_texture"],
        },
        finalRecommendationIds: [],
        privacyStatus: "active",
    });
    const recommendation = await ProductRecommendation.create({
        schemaVersion: 2,
        reportVersion: 1,
        userId: context.userId,
        analysisId: context.analysis._id,
        reportId: report._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        productId,
        variantId: `variant-${label}`,
        productSnapshot: {
            name: `Produto ${label}`,
            variant: {
                variantId: `variant-${label}`,
                label: `Tom ${label}`,
                colorHex: "#d7a17d",
                finish: "natural",
                coverage: "medium",
            },
        },
        selectionRank: 1,
        candidateAllowlistHash: "b".repeat(64),
        score: 0.9,
        reasonCodes: ["goal_match"],
        explanation: "Variante da allowlist congelada.",
        sourceSignals: ["report_snapshot"],
        limitations: ["A cor real pode variar."],
        machineResult: { selectedBy: "openai" },
    });
    report.finalRecommendationIds = [recommendation._id];
    await report.save();
    await ReportUnlock.create({
        schemaVersion: 2,
        reportVersion: 1,
        userId: context.userId,
        analysisId: context.analysis._id,
        reportId: report._id,
        recommendationIds: [recommendation._id],
        recommendedTotalCents: 2000,
        depositCents: 200,
        availableRecommendationCount: 1,
        recommendationSnapshots: [],
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
        simulatedPayment: {
            status: "simulated_paid",
            amountCents: 200,
            confirmedAt: new Date(),
            reference: `SIM-${label}`,
        },
        unlockedAt: new Date(),
    });
    return report;
}

function createInput(report) {
    return {
        reportId: report._id,
        generativeEditAccepted: true,
        generativeEditNoticeVersion: GENERATIVE_MAKEUP_NOTICE_VERSION,
    };
}

describe("idempotência da pré-visualização OpenAI", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
            instanceOpts: [{ ip: "127.0.0.1" }],
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralUri(uri);
        await mongoose.connect(uri);
        await Promise.all([
            AiJob.syncIndexes(),
            FaceAnalysis.syncIndexes(),
            FaceConsent.syncIndexes(),
            FacePhoto.syncIndexes(),
            FaceReport.syncIndexes(),
            FileDeletionJob.syncIndexes(),
            MakeupSimulation.syncIndexes(),
            MakeupSimulationQuota.syncIndexes(),
            Product.syncIndexes(),
            ProductRecommendation.syncIndexes(),
            ReportUnlock.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        await Promise.all([
            AiJob.deleteMany({}),
            FaceAnalysis.deleteMany({}),
            FaceConsent.deleteMany({}),
            FacePhoto.deleteMany({}),
            FaceReport.deleteMany({}),
            FileDeletionJob.deleteMany({}),
            MakeupSimulation.deleteMany({}),
            MakeupSimulationQuota.deleteMany({}),
            Product.deleteMany({}),
            ProductRecommendation.deleteMany({}),
            ReportUnlock.deleteMany({}),
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("25 pedidos concorrentes criam uma simulação, um job e uma reserva", async () => {
        const context = await createOwnerContext();
        const report = await createUnlockedReport(context, "concurrent");
        const results = await Promise.all(
            Array.from({ length: 25 }, () =>
                createMakeupSimulationForReport(
                    context.userId,
                    createInput(report),
                    context.consent,
                ),
            ),
        );

        expect(new Set(results.map(({ id }) => id))).toHaveLength(1);
        await expect(
            MakeupSimulation.countDocuments({ userId: context.userId }),
        ).resolves.toBe(1);
        await expect(AiJob.countDocuments({ userId: context.userId })).resolves.toBe(
            1,
        );
        const queuedJob = await AiJob.findOne({ userId: context.userId }).lean();
        expect(queuedJob.maxAttempts).toBe(1);
        const quota = await MakeupSimulationQuota.findOne({
            userId: context.userId,
        })
            .select("+reservations")
            .lean();
        expect(quota.reservations).toHaveLength(1);
        expect(quota.reservations[0].simulationId.toString()).toBe(results[0].id);
    }, 60_000);

    it("bloqueia um relatório principal de maquilhagem sem regiões executáveis antes de criar job ou consumir quota", async () => {
        const context = await createOwnerContext();
        const report = await createUnlockedReport(context, "incomplete-makeup");

        await expect(
            createCosmeticVisualizationForReport(
                context.userId,
                {
                    reportId: report._id,
                    generativeEditAccepted: true,
                    generativeEditNoticeVersion:
                        GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
                    intensity: "balanced",
                    variantSelections: [],
                },
                context.consent,
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: {
                code: "PRIMARY_MAKEUP_VISUALIZATION_INCOMPLETE",
            },
        });

        await expect(
            MakeupSimulation.countDocuments({ userId: context.userId }),
        ).resolves.toBe(0);
        await expect(AiJob.countDocuments({ userId: context.userId })).resolves.toBe(
            0,
        );
        await expect(
            MakeupSimulationQuota.countDocuments({ userId: context.userId }),
        ).resolves.toBe(0);
    });

    it("25 retries concorrentes reabrem o mesmo job sem consumir nova quota", async () => {
        const context = await createOwnerContext();
        const report = await createUnlockedReport(context, "retry");
        const first = await createMakeupSimulationForReport(
            context.userId,
            createInput(report),
            context.consent,
        );
        const firstJob = await AiJob.findById(first.jobId);
        await Promise.all([
            MakeupSimulation.updateOne(
                { _id: first.id },
                {
                    $set: {
                        status: MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE,
                        failedAt: new Date(),
                        safeErrorCode: "OPENAI_TRANSIENT",
                    },
                },
            ),
            AiJob.updateOne(
                { _id: firstJob._id },
                {
                    $set: {
                        status: AI_JOB_STATUSES.FAILED_RETRYABLE,
                        attempts: 3,
                        maxAttempts: 3,
                        availableAt: new Date(),
                        "lastError.code": "OPENAI_TRANSIENT",
                        "lastError.retryable": true,
                        "lastError.at": new Date(),
                    },
                },
            ),
        ]);

        const results = await Promise.all(
            Array.from({ length: 25 }, () =>
                createMakeupSimulationForReport(
                    context.userId,
                    createInput(report),
                    context.consent,
                ),
            ),
        );
        expect([...new Set(results.map(({ id }) => id))]).toHaveLength(1);
        expect(results[0]).toMatchObject({
            id: first.id,
            jobId: first.jobId,
            status: MAKEUP_SIMULATION_STATUSES.QUEUED,
        });
        const [storedJob, quota] = await Promise.all([
            AiJob.findById(first.jobId).lean(),
            MakeupSimulationQuota.findOne({ userId: context.userId })
                .select("+reservations")
                .lean(),
        ]);
        expect(storedJob).toMatchObject({
            status: AI_JOB_STATUSES.QUEUED,
            attempts: 0,
            maxAttempts: 1,
            manualRetryCount: 1,
        });
        expect(quota.reservations).toHaveLength(1);
        await expect(
            MakeupSimulation.countDocuments({ userId: context.userId }),
        ).resolves.toBe(1);
        await expect(AiJob.countDocuments({ userId: context.userId })).resolves.toBe(
            1,
        );
    }, 60_000);

    it("regenera após expiração/revogação e aplica três operações por 24 horas", async () => {
        const context = await createOwnerContext();
        const report = await createUnlockedReport(context, "rolling");
        const first = await createMakeupSimulationForReport(
            context.userId,
            createInput(report),
            context.consent,
        );
        await MakeupSimulation.updateOne(
            { _id: first.id },
            {
                $set: {
                    status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
                    completedAt: new Date(Date.now() - 8 * DAY_MS),
                    expiresAt: new Date(Date.now() - 1_000),
                    outputStorageKey: "/private/makeup-expired.webp.enc",
                },
            },
        );

        const second = await createMakeupSimulationForReport(
            context.userId,
            createInput(report),
            context.consent,
        );
        expect(second.id).not.toBe(first.id);
        const expired = await MakeupSimulation.findById(first.id)
            .select("+outputStorageKey")
            .lean();
        expect(expired.status).toBe(MAKEUP_SIMULATION_STATUSES.EXPIRED);
        expect(expired.outputStorageKey).toBeUndefined();
        await expect(
            FileDeletionJob.findOne({
                sourceType: "makeup_expiry",
                sourceId: first.id,
                ownerId: context.userId,
            })
                .select("+storageKey")
                .lean(),
        ).resolves.toMatchObject({
            storageKey: "/private/makeup-expired.webp.enc",
            status: "pending",
        });

        await revokeMakeupSimulationConsent(context.userId, second.id);
        const third = await createMakeupSimulationForReport(
            context.userId,
            createInput(report),
            context.consent,
        );
        expect(third.id).not.toBe(second.id);
        await revokeMakeupSimulationConsent(context.userId, third.id);

        await expect(
            createMakeupSimulationForReport(
                context.userId,
                createInput(report),
                context.consent,
            ),
        ).rejects.toMatchObject({ statusCode: 429 });
        await expect(
            MakeupSimulation.countDocuments({ userId: context.userId }),
        ).resolves.toBe(3);
        await expect(AiJob.countDocuments({ userId: context.userId })).resolves.toBe(
            3,
        );
        let quota = await MakeupSimulationQuota.findOne({
            userId: context.userId,
        })
            .select("+reservations")
            .lean();
        expect(quota.reservations).toHaveLength(3);

        await MakeupSimulationQuota.updateOne(
            { userId: context.userId },
            { $set: { "reservations.$[].createdAt": new Date(Date.now() - DAY_MS - 1_000) } },
        );
        const afterWindow = await createMakeupSimulationForReport(
            context.userId,
            createInput(report),
            context.consent,
        );
        expect(afterWindow.id).not.toBe(third.id);
        quota = await MakeupSimulationQuota.findOne({ userId: context.userId })
            .select("+reservations")
            .lean();
        expect(quota.reservations).toHaveLength(1);
        expect(quota.reservations[0].simulationId.toString()).toBe(afterWindow.id);
    }, 60_000);
});
