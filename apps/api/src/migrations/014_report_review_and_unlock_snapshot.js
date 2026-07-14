/** Migração 014: revisão report-level e snapshot comercial imutável. */
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

async function analyze(db) {
    return {
        catalog: await captureCatalogInvariant(db),
        legacyReviews: await db.collection("aiconsultationreviews").countDocuments({
            schemaVersion: { $exists: false },
        }),
        legacyUnlocks: await db.collection("reportunlocks").countDocuments({
            schemaVersion: { $exists: false },
        }),
    };
}

async function up({ db, session }) {
    const before = await captureCatalogInvariant(db, session);
    const reviews = await db.collection("aiconsultationreviews").updateMany(
        { schemaVersion: { $exists: false } },
        { $set: { schemaVersion: 1, reportVersion: 1 } },
        { session },
    );
    const unlocks = await db.collection("reportunlocks").updateMany(
        { schemaVersion: { $exists: false } },
        [
            {
                $set: {
                    schemaVersion: 1,
                    reportVersion: 1,
                    availableRecommendationCount: {
                        $size: { $ifNull: ["$recommendationIds", []] },
                    },
                    recommendationSnapshots: [],
                    contentHash: null,
                    frozenAt: "$createdAt",
                    zeroFeeReason: null,
                },
            },
        ],
        { session },
    );
    const after = await captureCatalogInvariant(db, session);
    assertCatalogInvariantEqual(before, after);
    return {
        reviewsArchived: reviews.modifiedCount,
        unlocksVersioned: unlocks.modifiedCount,
        catalogPreserved: true,
    };
}

async function finalize({ db }) {
    const reviews = db.collection("aiconsultationreviews");
    const indexes = await reviews.listIndexes().toArray().catch(() => []);
    for (const index of indexes) {
        if (
            index.name !== "_id_" &&
            [
                "userId_1_consultationSessionId_1",
                "uniq_legacy_consultation_review",
                "uniq_report_review",
            ].includes(index.name)
        ) {
            await reviews.dropIndex(index.name);
        }
    }
    await reviews.createIndex(
        { userId: 1, consultationSessionId: 1 },
        {
            unique: true,
            partialFilterExpression: {
                schemaVersion: 1,
                consultationSessionId: { $type: "objectId" },
            },
            name: "uniq_legacy_consultation_review",
        },
    );
    await reviews.createIndex(
        { userId: 1, reportId: 1 },
        {
            unique: true,
            partialFilterExpression: {
                schemaVersion: { $gte: 2 },
                reportId: { $type: "objectId" },
            },
            name: "uniq_report_review",
        },
    );
    await db.collection("reportphotogrants").createIndex(
        { reviewId: 1 },
        { unique: true, name: "reviewId_1" },
    );
    return { indexesReconciled: 3 };
}

async function validate({ db }) {
    const invalid = await db.collection("reportunlocks").countDocuments({
        schemaVersion: { $exists: false },
    });
    if (invalid) throw new Error("Migração 014 deixou unlocks sem versão");
    return { invalid, catalog: await captureCatalogInvariant(db) };
}

export const migration014ReportReviewAndUnlockSnapshot = Object.freeze({
    version: "014_report_review_and_unlock_snapshot",
    description: "Prepara revisão report-level e snapshot comercial",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
