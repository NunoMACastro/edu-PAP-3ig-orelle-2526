/**
 * Migração 006: separa snapshots de máquina e decisões humanas sem promover
 * dados legados a revisão humana. Duplicados de review são fundidos antes do
 * índice único, preservando recomendações e eventos auditáveis.
 */
import {
    decryptJsonForMigration,
    encryptJsonWithContext,
} from "../utils/encryption.util.js";
import { getSensitiveFieldEncryptionContext } from "../utils/contextual-encrypted-field.util.js";

const FINAL_REVIEW_STATUSES = Object.freeze([
    "approved",
    "adjusted",
    "needs_clarification",
]);
const REAL_MODES = Object.freeze(["demo", "external", "openai"]);

const REQUIRED_INDEXES = Object.freeze({
    productrecommendations: Object.freeze([
        Object.freeze({
            key: { userId: 1, analysisId: 1, productId: 1 },
            options: { name: "userId_1_analysisId_1_productId_1", unique: true },
        }),
    ]),
    aiconsultationreviews: Object.freeze([
        Object.freeze({
            key: { status: 1, updatedAt: -1 },
            options: { name: "status_1_updatedAt_-1" },
        }),
        Object.freeze({
            key: { userId: 1, consultationSessionId: 1 },
            options: { name: "userId_1_consultationSessionId_1", unique: true },
        }),
    ]),
});

const LEGACY_RECOMMENDATION_FILTER = {
    $or: [
        { machineResult: { $not: { $type: "object" } } },
        { humanOverride: { $exists: false } },
        { analysisMode: { $nin: REAL_MODES } },
        { analysisIsDemo: { $not: { $type: "bool" } } },
        { analysisProviderVersion: { $not: { $type: "string" } } },
    ],
};

const LEGACY_REVIEW_FILTER = {
    $or: [
        { machineResult: { $not: { $type: "object" } } },
        { humanOverride: { $exists: false } },
    ],
};

/** Lista índices sem materializar uma coleção ausente. */
async function listIndexes(collection) {
    try {
        return await collection.listIndexes().toArray();
    } catch (error) {
        if (error?.code === 26 || error?.codeName === "NamespaceNotFound") return [];
        throw error;
    }
}

/** Compara a ordem das chaves de um índice composto. */
function sameIndexKey(current = {}, expected = {}) {
    return JSON.stringify(Object.entries(current)) === JSON.stringify(Object.entries(expected));
}

/** Confirma apenas opções com impacto funcional. */
function hasRequiredOptions(current, required) {
    return (
        Boolean(current.unique) === Boolean(required.options.unique) &&
        current.expireAfterSeconds === undefined
    );
}

/** Resume índices ausentes/incompatíveis. */
async function analyzeIndexes(db) {
    let missingIndexes = 0;
    let mismatchedIndexes = 0;
    for (const [name, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
        const current = await listIndexes(db.collection(name));
        for (const required of requiredIndexes) {
            const sameKey = current.find((index) => sameIndexKey(index.key, required.key));
            if (!sameKey) missingIndexes += 1;
            else if (!hasRequiredOptions(sameKey, required)) mismatchedIndexes += 1;
        }
    }
    return { missingIndexes, mismatchedIndexes };
}

/** Conta documentos pertencentes a grupos de review duplicados. */
async function countDuplicateReviewDocuments(collection, session = undefined) {
    const [summary] = await collection
        .aggregate(
            [
                {
                    $match: {
                        userId: { $type: "objectId" },
                        consultationSessionId: { $type: "objectId" },
                    },
                },
                {
                    $group: {
                        _id: {
                            userId: "$userId",
                            consultationSessionId: "$consultationSessionId",
                        },
                        count: { $sum: 1 },
                    },
                },
                { $match: { count: { $gt: 1 } } },
                { $group: { _id: null, documents: { $sum: "$count" } } },
            ],
            session ? { session } : {},
        )
        .toArray();
    return summary?.documents ?? 0;
}

/** Recolhe contagens agregadas para status/dry-run. */
async function analyze(db, session = undefined) {
    const options = session ? { session } : {};
    const reviews = db.collection("aiconsultationreviews");
    const [legacyRecommendations, legacyReviews, duplicateReviewDocuments, indexState] =
        await Promise.all([
            db.collection("productrecommendations").countDocuments(
                LEGACY_RECOMMENDATION_FILTER,
                options,
            ),
            reviews.countDocuments(LEGACY_REVIEW_FILTER, options),
            countDuplicateReviewDocuments(reviews, session),
            session ? { missingIndexes: 0, mismatchedIndexes: 0 } : analyzeIndexes(db),
        ]);
    return {
        legacyRecommendations,
        legacyReviews,
        duplicateReviewDocuments,
        ...indexState,
    };
}

/** Indica se um review contém uma decisão humana reconstruível. */
function hasRecoverableHumanDecision(review) {
    return (
        review?.humanOverride && typeof review.humanOverride === "object"
    ) || (
        FINAL_REVIEW_STATUSES.includes(review?.status) &&
        review?.reviewedBy &&
        review?.reviewedAt instanceof Date
    );
}

/** Funde duplicados sem perder recomendações ou audit trail. */
async function mergeDuplicateReviews(collection, session) {
    const groups = await collection
        .aggregate(
            [
                {
                    $match: {
                        userId: { $type: "objectId" },
                        consultationSessionId: { $type: "objectId" },
                    },
                },
                {
                    $group: {
                        _id: {
                            userId: "$userId",
                            consultationSessionId: "$consultationSessionId",
                        },
                        ids: { $push: "$_id" },
                        count: { $sum: 1 },
                    },
                },
                { $match: { count: { $gt: 1 } } },
            ],
            { session },
        )
        .toArray();
    let removed = 0;

    for (const group of groups) {
        const documents = await collection
            .find({ _id: { $in: group.ids } }, { session })
            .toArray();
        documents.sort((left, right) => {
            const humanDifference =
                Number(hasRecoverableHumanDecision(right)) -
                Number(hasRecoverableHumanDecision(left));
            if (humanDifference !== 0) return humanDifference;
            const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
            const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
            if (rightTime !== leftTime) return rightTime - leftTime;
            return String(left._id).localeCompare(String(right._id));
        });

        const keeper = documents[0];
        const recommendationIds = [
            ...new Map(
                documents
                    .flatMap((document) => document.recommendationIds ?? [])
                    .map((id) => [String(id), id]),
            ).values(),
        ];
        const auditTrail = documents
            .flatMap((document) => document.auditTrail ?? [])
            .sort(
                (left, right) =>
                    new Date(left.occurredAt ?? 0).getTime() -
                    new Date(right.occurredAt ?? 0).getTime(),
            );
        const duplicateIds = documents.slice(1).map(({ _id }) => _id);

        await collection.updateOne(
            { _id: keeper._id },
            { $set: { recommendationIds, auditTrail } },
            { session },
        );
        const deletion = await collection.deleteMany(
            { _id: { $in: duplicateIds } },
            { session },
        );
        removed += deletion.deletedCount;
    }

    return removed;
}

/** Confirma um objeto de domínio sem aceitar null/arrays. */
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Converte um campo sensível legado/v2 no envelope contextual final. */
function normalizeSensitiveField(collection, document, field, value) {
    if (value === null || value === undefined) return value;
    const context = getSensitiveFieldEncryptionContext({
        collection,
        owner: document.userId,
        field,
    });
    return encryptJsonWithContext(
        decryptJsonForMigration(value, context),
        context,
    );
}

/** Lê um campo sensível apenas para construir um novo envelope no mesmo owner. */
function readSensitiveField(collection, document, field) {
    const value = document[field];
    if (value === null || value === undefined) return value;
    return decryptJsonForMigration(
        value,
        getSensitiveFieldEncryptionContext({
            collection,
            owner: document.userId,
            field,
        }),
    );
}

/** Cria snapshots legados e cifra qualquer valor humano que a 006 introduza. */
async function up({ db, session, now }) {
    const recommendationCollection = db.collection("productrecommendations");
    const reviewCollection = db.collection("aiconsultationreviews");
    const duplicateReviewsMerged = await mergeDuplicateReviews(
        reviewCollection,
        session,
    );
    let recommendationsMigrated = 0;
    let reviewsMigrated = 0;

    const recommendationDocuments = await recommendationCollection
        .find({}, { session })
        .toArray();
    for (const document of recommendationDocuments) {
        const machineResult = isRecord(document.machineResult)
            ? document.machineResult
            : {
                  score: Number.isFinite(document.score) ? document.score : 0,
                  reasonCodes:
                      Array.isArray(document.reasonCodes) && document.reasonCodes.length > 0
                          ? document.reasonCodes
                          : ["legacy_context"],
                  explanation:
                      typeof document.explanation === "string"
                          ? document.explanation
                          : "Recomendação legada sem explicação original.",
                  sourceSignals:
                      Array.isArray(document.sourceSignals) && document.sourceSignals.length > 0
                          ? document.sourceSignals
                          : ["legacy:unclassified"],
                  limitations:
                      Array.isArray(document.limitations)
                          ? document.limitations
                          : ["Registo legado migrado; proveniência limitada."],
                  generatedAt: document.updatedAt ?? document.createdAt ?? now,
                  version: "recommendation-engine-legacy-v1",
              };
        const update = {
            analysisMode: REAL_MODES.includes(document.analysisMode)
                ? document.analysisMode
                : "demo",
            analysisIsDemo:
                typeof document.analysisIsDemo === "boolean"
                    ? document.analysisIsDemo
                    : true,
            analysisProviderVersion:
                typeof document.analysisProviderVersion === "string"
                    ? document.analysisProviderVersion
                    : "legacy-demo-v1",
            machineResult,
            humanOverride: normalizeSensitiveField(
                "productrecommendations",
                document,
                "humanOverride",
                document.humanOverride ?? null,
            ),
        };
        if (document.consultantNote !== null && document.consultantNote !== undefined) {
            update.consultantNote = normalizeSensitiveField(
                "productrecommendations",
                document,
                "consultantNote",
                document.consultantNote,
            );
        }

        const result = await recommendationCollection.updateOne(
            { _id: document._id, userId: document.userId },
            { $set: update },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Migração 006 perdeu ownership de recomendação");
        }
        recommendationsMigrated += result.modifiedCount;
    }

    const reviewDocuments = await reviewCollection.find({}, { session }).toArray();
    for (const document of reviewDocuments) {
        const publicInsight = readSensitiveField(
            "aiconsultationreviews",
            document,
            "publicInsight",
        );
        const internalNote = readSensitiveField(
            "aiconsultationreviews",
            document,
            "internalNote",
        );
        let logicalHumanOverride = readSensitiveField(
            "aiconsultationreviews",
            document,
            "humanOverride",
        );
        if (
            !logicalHumanOverride &&
            FINAL_REVIEW_STATUSES.includes(document.status) &&
            document.reviewedBy &&
            document.reviewedAt instanceof Date
        ) {
            logicalHumanOverride = {
                decision: document.status,
                publicNote: publicInsight?.note ?? null,
                internalNote: internalNote ?? null,
                reviewerId: document.reviewedBy,
                reviewedAt: document.reviewedAt,
            };
        }

        const update = {
            machineResult: isRecord(document.machineResult)
                ? document.machineResult
                : {
                      recommendationIds: Array.isArray(document.recommendationIds)
                          ? document.recommendationIds
                          : [],
                      summary:
                          typeof document.summary === "string"
                              ? document.summary
                              : "Review legado sem resumo original.",
                      sourceLabels: Array.isArray(document.sourceLabels)
                          ? document.sourceLabels
                          : [],
                      limitations: Array.isArray(document.limitations)
                          ? document.limitations
                          : ["Review legado migrado; proveniência limitada."],
                      generatedAt: document.updatedAt ?? document.createdAt ?? now,
                  },
            humanOverride: normalizeSensitiveField(
                "aiconsultationreviews",
                document,
                "humanOverride",
                logicalHumanOverride,
            ),
        };
        if (document.publicInsight !== null && document.publicInsight !== undefined) {
            update.publicInsight = normalizeSensitiveField(
                "aiconsultationreviews",
                document,
                "publicInsight",
                publicInsight,
            );
        }
        if (document.internalNote !== null && document.internalNote !== undefined) {
            update.internalNote = normalizeSensitiveField(
                "aiconsultationreviews",
                document,
                "internalNote",
                internalNote,
            );
        }

        const result = await reviewCollection.updateOne(
            { _id: document._id, userId: document.userId },
            { $set: update },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Migração 006 perdeu ownership de review");
        }
        reviewsMigrated += result.modifiedCount;
    }

    return {
        duplicateReviewsMerged,
        recommendationsMigrated,
        reviewsMigrated,
    };
}

/** Garante os índices dos contratos machine/human. */
async function finalize({ db }) {
    let indexesCreated = 0;
    let indexesReplaced = 0;
    for (const [name, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
        const collection = db.collection(name);
        let current = await listIndexes(collection);
        for (const required of requiredIndexes) {
            const compatible = current.find(
                (index) => sameIndexKey(index.key, required.key) && hasRequiredOptions(index, required),
            );
            if (compatible) continue;
            const conflicts = current.filter(
                (index) =>
                    index.name !== "_id_" &&
                    (index.name === required.options.name || sameIndexKey(index.key, required.key)),
            );
            for (const conflict of conflicts) {
                await collection.dropIndex(conflict.name);
                indexesReplaced += 1;
            }
            await collection.createIndex(required.key, required.options);
            indexesCreated += 1;
            current = await listIndexes(collection);
        }
    }
    return { indexesCreated, indexesReplaced };
}

/** Confirma split, deduplicação e índices sem devolver conteúdo. */
async function validate({ db }) {
    const remaining = await analyze(db);
    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 006 deixou snapshots machine/human incompletos");
    }
    return remaining;
}

export const migration006AiMachineHumanSplit = Object.freeze({
    version: "006_ai_machine_human_split",
    description: "Separa snapshots de máquina e decisões humanas sem inferência insegura",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
