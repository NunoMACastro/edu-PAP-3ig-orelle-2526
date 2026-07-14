/** Migração 015: consolida qualidade, previews OpenAI e retenção privada. */
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

const GENERATIVE_MAKEUP_NOTICE_VERSION = "generative-makeup-v1";

async function analyze(db) {
    return {
        catalog: await captureCatalogInvariant(db),
        legacySimulations: await db.collection("makeupsimulations").countDocuments({
            schemaVersion: { $ne: 2 },
        }),
        quotaLedgers: await db.collection("makeupsimulationquotas").countDocuments(),
    };
}

function activeGenerationKey(userId, reportId) {
    return `makeup:${userId.toString()}:${reportId.toString()}`;
}

async function reconcileActiveGenerations(db, session, now) {
    const candidates = await db
        .collection("makeupsimulations")
        .find(
            {
                schemaVersion: 2,
                userId: { $type: "objectId" },
                reportId: { $type: "objectId" },
                status: {
                    $in: ["queued", "processing", "completed", "failed_retryable"],
                },
                "generativeConsent.noticeVersion":
                    GENERATIVE_MAKEUP_NOTICE_VERSION,
                "generativeConsent.acceptedAt": { $type: "date" },
                $and: [
                    {
                        $or: [
                            { "generativeConsent.revokedAt": null },
                            { "generativeConsent.revokedAt": { $exists: false } },
                        ],
                    },
                    {
                        $or: [
                            { status: { $ne: "completed" } },
                            { expiresAt: null },
                            { expiresAt: { $gt: now } },
                        ],
                    },
                ],
            },
            { session },
        )
        .sort({ createdAt: -1, _id: -1 })
        .toArray();
    const claimedKeys = new Set();
    const duplicateJobIds = [];
    const writes = [];

    for (const simulation of candidates) {
        const key = activeGenerationKey(simulation.userId, simulation.reportId);
        if (!claimedKeys.has(key)) {
            claimedKeys.add(key);
            writes.push({
                updateOne: {
                    filter: { _id: simulation._id },
                    update: { $set: { activeGenerationKey: key } },
                },
            });
            continue;
        }

        const update = { $unset: { activeGenerationKey: "" } };
        if (simulation.status !== "completed") {
            update.$set = {
                status: "cancelled",
                failedAt: now,
                safeErrorCode: "DUPLICATE_ACTIVE_ARCHIVED",
            };
            if (simulation.jobId) duplicateJobIds.push(simulation.jobId);
        }
        writes.push({ updateOne: { filter: { _id: simulation._id }, update } });
    }

    if (writes.length > 0) {
        await db.collection("makeupsimulations").bulkWrite(writes, { session });
    }
    if (duplicateJobIds.length > 0) {
        await db.collection("aijobs").updateMany(
            {
                _id: { $in: duplicateJobIds },
                status: { $in: ["queued", "processing", "failed_retryable"] },
            },
            {
                $set: {
                    status: "cancelled",
                    cancelledAt: now,
                    terminalAt: now,
                    "lease.token": null,
                    "lease.workerId": null,
                    "lease.expiresAt": null,
                },
            },
            { session },
        );
    }
    return { activeGenerationKeys: claimedKeys.size };
}

async function backfillQuotaLedgers(db, session, now) {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent = await db
        .collection("makeupsimulations")
        .find(
            {
                schemaVersion: 2,
                userId: { $type: "objectId" },
                createdAt: { $gte: since },
            },
            { session },
        )
        .project({ userId: 1, createdAt: 1 })
        .sort({ createdAt: 1, _id: 1 })
        .toArray();
    const byUser = new Map();
    for (const simulation of recent) {
        const key = simulation.userId.toString();
        const reservations = byUser.get(key) ?? [];
        reservations.push({
            simulationId: simulation._id,
            createdAt: simulation.createdAt,
        });
        byUser.set(key, reservations);
    }
    if (byUser.size === 0) return { quotaLedgersBackfilled: 0 };

    await db.collection("makeupsimulationquotas").bulkWrite(
        [...byUser.entries()].map(([userId, reservations]) => ({
            updateOne: {
                filter: { userId: recent.find((entry) => entry.userId.toString() === userId).userId },
                update: {
                    $set: { reservations, updatedAt: now },
                    $setOnInsert: { createdAt: now },
                },
                upsert: true,
            },
        })),
        { session },
    );
    return { quotaLedgersBackfilled: byUser.size };
}

async function up({ db, session, now }) {
    const before = await captureCatalogInvariant(db, session);
    const archived = await db.collection("makeupsimulations").updateMany(
        { schemaVersion: { $ne: 2 } },
        {
            $set: {
                schemaVersion: 1,
                status: "cancelled",
                failedAt: now,
                safeErrorCode: "LEGACY_PREVIEW_ARCHIVED",
            },
            $unset: { preview: "", providerName: "" },
        },
        { session },
    );
    const provenanceBackfill = await db.collection("makeupsimulations").updateMany(
        { schemaVersion: 2 },
        [
            {
                $set: {
                    promptVersion: {
                        $cond: [
                            { $eq: [{ $type: "$promptVersion" }, "string"] },
                            "$promptVersion",
                            "legacy-unversioned",
                        ],
                    },
                    responseSchemaVersion: {
                        $cond: [
                            {
                                $eq: [
                                    { $type: "$responseSchemaVersion" },
                                    "string",
                                ],
                            },
                            "$responseSchemaVersion",
                            "legacy-unversioned",
                        ],
                    },
                },
            },
        ],
        { session },
    );
    const minimizedDeletionJobs = await db
        .collection("filedeletionjobs")
        .updateMany(
            { status: "completed" },
            [
                {
                    $set: {
                        terminalAt: {
                            $cond: [
                                { $eq: [{ $type: "$terminalAt" }, "date"] },
                                "$terminalAt",
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                { $type: "$completedAt" },
                                                "date",
                                            ],
                                        },
                                        "$completedAt",
                                        now,
                                    ],
                                },
                            ],
                        },
                        ownerId: "$$REMOVE",
                        storageKey: "$$REMOVE",
                        sourceType: "$$REMOVE",
                        sourceId: "$$REMOVE",
                    },
                },
            ],
            { session },
        );
    await db.collection("beforeaftervisualizations").updateMany(
        {},
        {
            $set: { archivedAt: now },
            $unset: {
                beforePanel: "",
                afterPanel: "",
                visualComparison: "",
            },
        },
        { session },
    );
    const activeGenerationChanges = await reconcileActiveGenerations(
        db,
        session,
        now,
    );
    const quotaChanges = await backfillQuotaLedgers(db, session, now);
    const after = await captureCatalogInvariant(db, session);
    assertCatalogInvariantEqual(before, after);
    return {
        archived: archived.modifiedCount,
        provenanceBackfilled: provenanceBackfill.modifiedCount,
        deletionJobsMinimized: minimizedDeletionJobs.modifiedCount,
        ...activeGenerationChanges,
        ...quotaChanges,
        catalogPreserved: true,
    };
}

async function finalize({ db }) {
    await db.collection("makeupsimulations").createIndex(
        { userId: 1, reportId: 1, createdAt: -1 },
        { name: "userId_1_reportId_1_createdAt_-1" },
    );
    await db.collection("makeupsimulations").createIndex(
        { status: 1, expiresAt: 1 },
        { name: "status_1_expiresAt_1" },
    );
    await db.collection("makeupsimulations").createIndex(
        { activeGenerationKey: 1 },
        {
            name: "uniq_active_makeup_generation",
            unique: true,
            partialFilterExpression: {
                activeGenerationKey: { $type: "string" },
            },
        },
    );
    await db.collection("makeupsimulationquotas").createIndex(
        { userId: 1 },
        { name: "userId_1", unique: true },
    );
    await db.collection("filedeletionjobs").createIndex(
        { terminalAt: 1 },
        {
            name: "ttl_completed_file_deletion_jobs_7d",
            expireAfterSeconds: 7 * 24 * 60 * 60,
        },
    );
    return { indexesReconciled: 5 };
}

async function validate({ db }) {
    const activeLegacy = await db.collection("makeupsimulations").countDocuments({
        schemaVersion: { $ne: 2 },
        status: { $ne: "cancelled" },
    });
    if (activeLegacy) throw new Error("Migração 015 deixou preview antigo ativo");
    const duplicateActiveKeys = await db
        .collection("makeupsimulations")
        .aggregate([
            { $match: { activeGenerationKey: { $type: "string" } } },
            { $group: { _id: "$activeGenerationKey", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 1 },
        ])
        .toArray();
    if (duplicateActiveKeys.length > 0) {
        throw new Error("Migração 015 deixou gerações de maquilhagem duplicadas");
    }
    const nonMinimizedDeletionJobs = await db
        .collection("filedeletionjobs")
        .countDocuments({
            status: "completed",
            $or: [
                { terminalAt: { $not: { $type: "date" } } },
                { ownerId: { $exists: true } },
                { storageKey: { $exists: true } },
                { sourceType: { $exists: true } },
                { sourceId: { $exists: true } },
            ],
        });
    if (nonMinimizedDeletionJobs) {
        throw new Error(
            "Migração 015 deixou metadata pessoal em jobs concluídos",
        );
    }
    const deletionJobIndexes = await db
        .collection("filedeletionjobs")
        .indexes();
    const deletionJobTtl = deletionJobIndexes.find(
        ({ name }) => name === "ttl_completed_file_deletion_jobs_7d",
    );
    if (deletionJobTtl?.expireAfterSeconds !== 7 * 24 * 60 * 60) {
        throw new Error("Migração 015 não criou a retenção do outbox físico");
    }
    return {
        activeLegacy,
        duplicateActiveKeys: duplicateActiveKeys.length,
        nonMinimizedDeletionJobs,
        fileDeletionRetentionSeconds: deletionJobTtl.expireAfterSeconds,
        quotaLedgers: await db.collection("makeupsimulationquotas").countDocuments(),
        catalog: await captureCatalogInvariant(db),
    };
}

export const migration015OpenAiMakeupSimulation = Object.freeze({
    version: "015_photo_quality_and_openai_simulation",
    description:
        "Consolida qualidade fotográfica, outputs OpenAI privados e retenção do outbox",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
