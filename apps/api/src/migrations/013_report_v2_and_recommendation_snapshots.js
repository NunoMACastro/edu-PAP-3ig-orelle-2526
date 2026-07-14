/** Migração 013: arquiva contratos antigos e prepara relatórios/recomendações v2. */
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

async function listIndexes(collection) {
    try {
        return await collection.listIndexes().toArray();
    } catch (error) {
        if (error?.code === 26) return [];
        throw error;
    }
}

async function replaceIndex(collection, key, options) {
    const indexes = await listIndexes(collection);
    for (const index of indexes) {
        if (
            index.name !== "_id_" &&
            (index.name === options.name ||
                JSON.stringify(index.key) === JSON.stringify(key))
        ) {
            await collection.dropIndex(index.name);
        }
    }
    await collection.createIndex(key, options);
}

async function analyze(db) {
    return {
        catalog: await captureCatalogInvariant(db),
        legacyReports: await db.collection("facereports").countDocuments({
            schemaVersion: { $ne: 2 },
        }),
        legacyRecommendations: await db
            .collection("productrecommendations")
            .countDocuments({ schemaVersion: { $ne: 2 } }),
    };
}

function legacyModeExpression() {
    return {
        $switch: {
            branches: [
                { case: { $eq: ["$analysisMode", "openai"] }, then: "openai" },
                {
                    case: {
                        $in: ["$analysisMode", ["external", "legacy_external"]],
                    },
                    then: "legacy_external",
                },
                {
                    case: {
                        $in: ["$analysisMode", ["demo", "local", "legacy_demo"]],
                    },
                    then: "legacy_demo",
                },
            ],
            default: "legacy_demo",
        },
    };
}

async function up({ db, session, now }) {
    const before = await captureCatalogInvariant(db, session);
    const reports = await db.collection("facereports").updateMany(
        { schemaVersion: { $ne: 2 } },
        [
            {
                $set: {
                    schemaVersion: 1,
                    version: 1,
                    lifecycleStatus: "archived_legacy",
                    analysisMode: legacyModeExpression(),
                    frozenAt: "$frozenAt",
                    legacyArchivedAt: now,
                },
            },
        ],
        { session },
    );
    const recommendations = await db
        .collection("productrecommendations")
        .updateMany(
            { schemaVersion: { $ne: 2 } },
            [
                {
                    $set: {
                        schemaVersion: 1,
                        reportVersion: 1,
                        analysisMode: legacyModeExpression(),
                        legacyArchivedAt: now,
                    },
                },
            ],
            { session },
        );
    const after = await captureCatalogInvariant(db, session);
    assertCatalogInvariantEqual(before, after);
    return {
        reportsArchived: reports.modifiedCount,
        recommendationsArchived: recommendations.modifiedCount,
        catalogPreserved: true,
    };
}

async function finalize({ db }) {
    await replaceIndex(
        db.collection("facereports"),
        { userId: 1, analysisId: 1 },
        {
            unique: true,
            partialFilterExpression: { schemaVersion: 1 },
            name: "uniq_legacy_report_per_analysis",
        },
    );
    await replaceIndex(
        db.collection("facereports"),
        { userId: 1, consultationSessionId: 1, version: 1 },
        {
            unique: true,
            partialFilterExpression: {
                schemaVersion: { $gte: 2 },
                consultationSessionId: { $type: "objectId" },
            },
            name: "uniq_consultation_report_version",
        },
    );
    await replaceIndex(
        db.collection("productrecommendations"),
        { userId: 1, analysisId: 1, productId: 1 },
        {
            unique: true,
            partialFilterExpression: { schemaVersion: 1 },
            name: "uniq_legacy_recommendation_product",
        },
    );
    await replaceIndex(
        db.collection("productrecommendations"),
        { userId: 1, reportId: 1, reportVersion: 1, productId: 1, variantId: 1 },
        {
            unique: true,
            partialFilterExpression: { schemaVersion: { $gte: 2 } },
            name: "uniq_report_recommendation_variant",
        },
    );
    return { indexesReconciled: 4 };
}

async function validate({ db }) {
    const forbiddenModes = await db.collection("facereports").countDocuments({
        analysisMode: { $in: ["demo", "external"] },
    });
    if (forbiddenModes) throw new Error("Migração 013 deixou modos antigos ativos");
    return { forbiddenModes, catalog: await captureCatalogInvariant(db) };
}

export const migration013ReportV2AndRecommendationSnapshots = Object.freeze({
    version: "013_report_v2_and_recommendation_snapshots",
    description: "Versiona relatórios e snapshots de recomendações",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
