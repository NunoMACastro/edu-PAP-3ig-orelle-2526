/**
 * Prova real das migrações 004/006 sobre documentos legados inseridos sem os
 * schemas atuais. Usa exclusivamente um replica set efémero loopback.
 */
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migration004PrivacyRequestsAndErasure } from "../src/migrations/004_privacy_requests_and_erasure.js";
import { migration006AiMachineHumanSplit } from "../src/migrations/006_ai_machine_human_split.js";
import {
    decryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../src/utils/encryption.util.js";
import {
    dryRunMigrations,
    getMigrationStatus,
    MIGRATION_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";

const DATABASE_NAME = "orelle_migrations_privacy_ai_test";
const MIGRATIONS = Object.freeze([
    Object.freeze({
        ...migration004PrivacyRequestsAndErasure,
        sourcePath: fileURLToPath(
            new URL(
                "../src/migrations/004_privacy_requests_and_erasure.js",
                import.meta.url,
            ),
        ),
    }),
    Object.freeze({
        ...migration006AiMachineHumanSplit,
        sourcePath: fileURLToPath(
            new URL(
                "../src/migrations/006_ai_machine_human_split.js",
                import.meta.url,
            ),
        ),
    }),
]);

let replicaSet;
let client;
let db;
let ids;

async function seedLegacyDocuments() {
    const now = new Date("2026-07-10T08:00:00.000Z");
    ids = {
        user: new ObjectId(),
        reviewer: new ObjectId(),
        completedRequest: new ObjectId(),
        verifiedRequest: new ObjectId(),
        processingRequest: new ObjectId(),
        completedJob: new ObjectId(),
        consent: new ObjectId(),
        analysis: new ObjectId(),
        report: new ObjectId(),
        product: new ObjectId(),
        recommendation: new ObjectId(),
        otherRecommendation: new ObjectId(),
        session: new ObjectId(),
        unprovenSession: new ObjectId(),
        pendingReview: new ObjectId(),
        approvedReview: new ObjectId(),
        unprovenReview: new ObjectId(),
    };

    await db.collection("users").insertOne({
        _id: ids.user,
        email: "legacy-erased@deleted.invalid",
        passwordHash: "legacy-tombstone",
        isActive: true,
        deletedAt: new Date("2026-06-01T10:00:00.000Z"),
        createdAt: now,
        updatedAt: now,
    });
    await db.collection("biometricdatarequests").insertMany([
        {
            _id: ids.completedRequest,
            requesterId: ids.user,
            action: "delete",
            resources: ["photos"],
            status: "completed",
            completedAt: now,
            createdAt: now,
        },
        {
            _id: ids.verifiedRequest,
            requesterId: ids.user,
            scope: "biometric",
            action: "delete",
            resources: ["reports"],
            status: "completed",
            attempts: 1,
            decisionError: "",
            lease: { token: null, expiresAt: null },
            completedAt: now,
            erasureVerifiedAt: now,
            createdAt: now,
        },
        {
            _id: ids.processingRequest,
            requesterId: ids.user,
            action: "anonymize",
            resources: ["photos", "reports"],
            status: "processing",
            attempts: -2,
            lease: {
                token: "legacy-lease",
                expiresAt: new Date("2026-07-09T08:00:00.000Z"),
            },
            createdAt: now,
        },
    ]);
    await db.collection("faceconsents").insertOne({
        _id: ids.consent,
        userId: ids.user,
        acceptedAt: now,
        version: "face-analysis-v1",
        purpose: "facial_cosmetic_analysis",
        revokedAt: now,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: "notice-v1",
            acceptedAt: new Date("2026-06-01T08:00:00.000Z"),
            revokedAt: null,
        },
    });
    await db.collection("filedeletionjobs").insertOne({
        _id: ids.completedJob,
        deduplicationKey: "f".repeat(64),
        sourceType: "privacy_request",
        sourceId: ids.completedRequest.toString(),
        ownerId: ids.user,
        storageKey: "/private/legacy/path.enc",
        status: "completed",
        attempts: 1,
        lease: { token: "obsolete-lease", expiresAt: null },
        completedAt: now,
        createdAt: now,
        updatedAt: now,
    });
    await db.collection("productrecommendations").insertOne({
        _id: ids.recommendation,
        userId: ids.user,
        analysisId: ids.analysis,
        reportId: ids.report,
        productId: ids.product,
        score: 0.74,
        reasonCodes: ["skin_type_match"],
        explanation: "Recomendação automática legada para pele mista.",
        sourceSignals: ["skinType:mista"],
        limitations: ["Registo académico legado."],
        status: "adjusted",
        consultantNote: "Nota legada sem revisor demonstrável.",
        createdAt: now,
        updatedAt: now,
    });
    await db.collection("aiconsultationreviews").insertMany([
        {
            _id: ids.pendingReview,
            userId: ids.user,
            consultationSessionId: ids.session,
            recommendationIds: [ids.recommendation],
            status: "pending",
            summary: "Review duplicado pendente que deve ser fundido.",
            sourceLabels: ["tipo de pele"],
            limitations: ["Limitação pendente."],
            auditTrail: [
                {
                    actorId: ids.reviewer,
                    actorRole: "consultor",
                    action: "needs_clarification",
                    occurredAt: new Date("2026-07-09T10:00:00.000Z"),
                },
            ],
            createdAt: new Date("2026-07-09T09:00:00.000Z"),
            updatedAt: new Date("2026-07-09T10:00:00.000Z"),
        },
        {
            _id: ids.approvedReview,
            userId: ids.user,
            consultationSessionId: ids.session,
            recommendationIds: [ids.otherRecommendation],
            status: "approved",
            summary: "Review aprovado com decisão humana comprovada.",
            sourceLabels: ["rotina"],
            limitations: ["Limitação aprovada."],
            publicInsight: {
                note: "Rotina confirmada pelo consultor.",
                publishedAt: now,
            },
            internalNote: "Nota humana privada preservada.",
            reviewedBy: ids.reviewer,
            reviewedAt: now,
            auditTrail: [
                {
                    actorId: ids.reviewer,
                    actorRole: "consultor",
                    action: "approved",
                    occurredAt: now,
                },
            ],
            createdAt: new Date("2026-07-09T09:30:00.000Z"),
            updatedAt: now,
        },
        {
            _id: ids.unprovenReview,
            userId: ids.user,
            consultationSessionId: ids.unprovenSession,
            recommendationIds: [],
            status: "approved",
            summary: "Estado final legado sem identidade de revisor.",
            sourceLabels: [],
            limitations: [],
            createdAt: now,
            updatedAt: now,
        },
    ]);
}

describe("migrations 004/006 de privacidade e split IA", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI das migrations 004/006 não é loopback efémera");
        }
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
        await seedLegacyDocuments();
    }, 120_000);

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("faz dry-run sanitizado sem alterar dados", async () => {
        const requestsBefore = await db
            .collection("biometricdatarequests")
            .find({})
            .toArray();
        const status = await getMigrationStatus({ db, migrations: MIGRATIONS });
        const dryRun = await dryRunMigrations({ db, migrations: MIGRATIONS });

        expect(status.map(({ state }) => state)).toEqual(["pending", "pending"]);
        expect(dryRun[0].analysis).toMatchObject({
            unverifiedCompletedRequests: 1,
            staleProcessingRequests: 1,
            terminalUsersNeedingNormalization: 1,
            providerRevocationsNeedingSync: 1,
            completedJobsWithSensitiveMetadata: 1,
        });
        expect(dryRun[1].analysis).toMatchObject({
            legacyRecommendations: 1,
            legacyReviews: 3,
            duplicateReviewDocuments: 2,
        });
        expect(
            await db.collection("biometricdatarequests").find({}).toArray(),
        ).toEqual(requestsBefore);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
    });

    it("aplica estados recuperáveis e preserva apenas decisões humanas comprovadas", async () => {
        const result = await runMigrations({
            client,
            db,
            migrations: MIGRATIONS,
            now: new Date("2026-07-10T12:00:00.000Z"),
            ownerId: "privacy-ai-migration-owner",
        });
        expect(result.map(({ state }) => state)).toEqual(["applied", "applied"]);

        const [unverified, verified, stale, user, consent, recommendation] =
            await Promise.all([
                db.collection("biometricdatarequests").findOne({ _id: ids.completedRequest }),
                db.collection("biometricdatarequests").findOne({ _id: ids.verifiedRequest }),
                db.collection("biometricdatarequests").findOne({ _id: ids.processingRequest }),
                db.collection("users").findOne({ _id: ids.user }),
                db.collection("faceconsents").findOne({ _id: ids.consent }),
                db.collection("productrecommendations").findOne({ _id: ids.recommendation }),
            ]);

        expect(unverified).toMatchObject({
            scope: "biometric",
            status: "failed",
            attempts: 0,
            completedAt: null,
            erasureVerifiedAt: null,
        });
        expect(unverified.decisionError).toContain("reprocessamento");
        expect(verified).toMatchObject({ status: "completed", erasureVerifiedAt: expect.any(Date) });
        expect(stale).toMatchObject({
            scope: "biometric",
            status: "failed",
            attempts: 0,
            lease: { token: null, expiresAt: null },
        });
        expect(user).toMatchObject({ accountStatus: "deleted", isActive: false });
        expect(user.deletedAt).toBeInstanceOf(Date);
        expect(consent.externalProviderConsent.revokedAt).toEqual(consent.revokedAt);
        const sanitizedJob = await db
            .collection("filedeletionjobs")
            .findOne({ _id: ids.completedJob });
        expect(sanitizedJob).not.toHaveProperty("ownerId");
        expect(sanitizedJob).not.toHaveProperty("storageKey");
        expect(sanitizedJob.lease).not.toHaveProperty("token");

        expect(recommendation).toMatchObject({
            analysisMode: "demo",
            analysisIsDemo: true,
            analysisProviderVersion: "legacy-demo-v1",
            humanOverride: null,
            machineResult: {
                score: 0.74,
                reasonCodes: ["skin_type_match"],
                version: "recommendation-engine-legacy-v1",
            },
        });
        const mergedReviews = await db
            .collection("aiconsultationreviews")
            .find({ userId: ids.user, consultationSessionId: ids.session })
            .toArray();
        expect(mergedReviews).toHaveLength(1);
        expect(mergedReviews[0].recommendationIds.map(String).sort()).toEqual(
            [ids.recommendation, ids.otherRecommendation].map(String).sort(),
        );
        expect(mergedReviews[0].auditTrail).toHaveLength(2);
        expect(mergedReviews[0].machineResult).toBeTruthy();
        expect(isContextualEncryptedPayload(mergedReviews[0].humanOverride)).toBe(
            true,
        );
        const humanOverride = decryptJsonWithContext(
            mergedReviews[0].humanOverride,
            {
                collection: "aiconsultationreviews",
                owner: ids.user,
                field: "humanOverride",
            },
        );
        expect(humanOverride).toMatchObject({
            decision: "approved",
            publicNote: "Rotina confirmada pelo consultor.",
            internalNote: "Nota humana privada preservada.",
            reviewerId: ids.reviewer.toString(),
            reviewedAt: expect.any(Date),
        });
        expect(JSON.stringify(mergedReviews[0])).not.toContain(
            "Nota humana privada preservada.",
        );
        const unprovenReview = await db
            .collection("aiconsultationreviews")
            .findOne({ _id: ids.unprovenReview });
        expect(unprovenReview.humanOverride).toBeNull();

        const requestIndexes = await db
            .collection("biometricdatarequests")
            .listIndexes()
            .toArray();
        const reviewIndexes = await db
            .collection("aiconsultationreviews")
            .listIndexes()
            .toArray();
        expect(requestIndexes.some(({ name }) => name === "status_1_lease.expiresAt_1")).toBe(true);
        expect(
            reviewIndexes.find(({ name }) => name === "userId_1_consultationSessionId_1"),
        ).toMatchObject({ unique: true });
    });

    it("é idempotente no replay", async () => {
        const reviewsBefore = await db
            .collection("aiconsultationreviews")
            .find({})
            .sort({ _id: 1 })
            .toArray();
        const replay = await runMigrations({
            client,
            db,
            migrations: MIGRATIONS,
            ownerId: "privacy-ai-migration-replay",
        });
        expect(replay).toEqual([
            { version: MIGRATIONS[0].version, state: "skipped" },
            { version: MIGRATIONS[1].version, state: "skipped" },
        ]);
        expect(
            await db.collection("aiconsultationreviews").find({}).sort({ _id: 1 }).toArray(),
        ).toEqual(reviewsBefore);
    });
});
