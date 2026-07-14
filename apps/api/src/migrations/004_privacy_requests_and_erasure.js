/**
 * Migração 004: torna recuperáveis os pedidos de privacidade antigos, fixa o
 * estado terminal das contas eliminadas e sincroniza a revogação de provider.
 * DML é idempotente; índices são finalizados fora da transação MongoDB.
 */

const RECOVERABLE_ERROR =
    "Pedido legado sem prova de eliminação física; requer reprocessamento.";

const REQUIRED_INDEXES = Object.freeze({
    biometricdatarequests: Object.freeze([
        Object.freeze({ key: { status: 1, createdAt: -1 }, options: { name: "status_1_createdAt_-1" } }),
        Object.freeze({ key: { requesterId: 1, status: 1 }, options: { name: "requesterId_1_status_1" } }),
        Object.freeze({ key: { status: 1, "lease.expiresAt": 1 }, options: { name: "status_1_lease.expiresAt_1" } }),
    ]),
    filedeletionjobs: Object.freeze([
        Object.freeze({ key: { deduplicationKey: 1 }, options: { name: "deduplicationKey_1", unique: true } }),
        Object.freeze({ key: { sourceType: 1, sourceId: 1, status: 1 }, options: { name: "sourceType_1_sourceId_1_status_1" } }),
        Object.freeze({ key: { status: 1, "lease.expiresAt": 1 }, options: { name: "status_1_lease.expiresAt_1" } }),
    ]),
    faceconsents: Object.freeze([
        Object.freeze({ key: { userId: 1 }, options: { name: "userId_1", unique: true } }),
    ]),
    users: Object.freeze([
        Object.freeze({ key: { accountStatus: 1 }, options: { name: "accountStatus_1" } }),
    ]),
});

const REQUEST_DEFAULTS_FILTER = {
    $or: [
        { scope: { $ne: "biometric" } },
        { attempts: { $not: { $type: "number" } } },
        { decisionError: { $not: { $type: "string" } } },
        { lease: { $not: { $type: "object" } } },
    ],
};

const UNVERIFIED_COMPLETED_FILTER = {
    status: "completed",
    erasureVerifiedAt: { $not: { $type: "date" } },
};

/** Lista índices sem criar implicitamente uma coleção ausente. */
async function listIndexes(collection) {
    try {
        return await collection.listIndexes().toArray();
    } catch (error) {
        if (error?.code === 26 || error?.codeName === "NamespaceNotFound") return [];
        throw error;
    }
}

/** Compara chaves preservando a ordem dos campos compostos. */
function sameIndexKey(current = {}, expected = {}) {
    return JSON.stringify(Object.entries(current)) === JSON.stringify(Object.entries(expected));
}

/** Confirma as opções funcionais relevantes do índice. */
function hasRequiredOptions(current, required) {
    return (
        Boolean(current.unique) === Boolean(required.options.unique) &&
        current.expireAfterSeconds === undefined
    );
}

/** Resume índices canónicos ausentes ou incompatíveis. */
async function analyzeIndexes(db) {
    let missingIndexes = 0;
    let mismatchedIndexes = 0;

    for (const [collectionName, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
        const current = await listIndexes(db.collection(collectionName));
        for (const required of requiredIndexes) {
            const sameKey = current.find((index) => sameIndexKey(index.key, required.key));
            if (!sameKey) missingIndexes += 1;
            else if (!hasRequiredOptions(sameKey, required)) mismatchedIndexes += 1;
        }
    }

    return { missingIndexes, mismatchedIndexes };
}

/** Recolhe apenas contagens sanitizadas para status/dry-run. */
async function analyze(db, session = undefined, now = new Date()) {
    const options = session ? { session } : {};
    const requests = db.collection("biometricdatarequests");
    const [
        requestsMissingDefaults,
        unverifiedCompletedRequests,
        staleProcessingRequests,
        terminalUsersNeedingNormalization,
        providerRevocationsNeedingSync,
        completedJobsWithSensitiveMetadata,
        indexState,
    ] = await Promise.all([
        requests.countDocuments(REQUEST_DEFAULTS_FILTER, options),
        requests.countDocuments(UNVERIFIED_COMPLETED_FILTER, options),
        requests.countDocuments(
            {
                status: "processing",
                $or: [
                    { "lease.expiresAt": { $not: { $type: "date" } } },
                    { "lease.expiresAt": { $lte: now } },
                ],
            },
            options,
        ),
        db.collection("users").countDocuments(
            {
                $or: [
                    { accountStatus: { $nin: ["active", "suspended", "deleted"] } },
                    { accountStatus: "deleted", isActive: { $ne: false } },
                    { accountStatus: "deleted", deletedAt: { $not: { $type: "date" } } },
                ],
            },
            options,
        ),
        db.collection("faceconsents").countDocuments(
            {
                revokedAt: { $type: "date" },
                externalProviderConsent: { $type: "object" },
                "externalProviderConsent.revokedAt": { $not: { $type: "date" } },
            },
            options,
        ),
        db.collection("filedeletionjobs").countDocuments(
            {
                status: "completed",
                $or: [
                    { ownerId: { $exists: true } },
                    { storageKey: { $exists: true } },
                    { "lease.token": { $exists: true } },
                ],
            },
            options,
        ),
        session ? { missingIndexes: 0, mismatchedIndexes: 0 } : analyzeIndexes(db),
    ]);

    return {
        requestsMissingDefaults,
        unverifiedCompletedRequests,
        staleProcessingRequests,
        terminalUsersNeedingNormalization,
        providerRevocationsNeedingSync,
        completedJobsWithSensitiveMetadata,
        ...indexState,
    };
}

/** Normaliza estados sem concluir eliminações nem reativar contas. */
async function up({ db, session, now }) {
    const requests = db.collection("biometricdatarequests");
    const defaults = await requests.updateMany(
        REQUEST_DEFAULTS_FILTER,
        [
            {
                $set: {
                    scope: "biometric",
                    attempts: {
                        $cond: [
                            { $and: [{ $isNumber: "$attempts" }, { $gte: ["$attempts", 0] }] },
                            { $floor: "$attempts" },
                            0,
                        ],
                    },
                    decisionError: {
                        $cond: [{ $eq: [{ $type: "$decisionError" }, "string"] }, "$decisionError", ""],
                    },
                    lease: {
                        token: {
                            $cond: [{ $eq: [{ $type: "$lease.token" }, "string"] }, "$lease.token", null],
                        },
                        expiresAt: {
                            $cond: [{ $eq: [{ $type: "$lease.expiresAt" }, "date"] }, "$lease.expiresAt", null],
                        },
                    },
                },
            },
        ],
        { session },
    );
    const unverified = await requests.updateMany(
        UNVERIFIED_COMPLETED_FILTER,
        {
            $set: {
                status: "failed",
                completedAt: null,
                erasureVerifiedAt: null,
                decisionError: RECOVERABLE_ERROR,
                "lease.token": null,
                "lease.expiresAt": null,
            },
        },
        { session },
    );
    const stale = await requests.updateMany(
        {
            status: "processing",
            $or: [
                { "lease.expiresAt": { $not: { $type: "date" } } },
                { "lease.expiresAt": { $lte: now } },
            ],
        },
        {
            $set: {
                status: "failed",
                decisionError: RECOVERABLE_ERROR,
                "lease.token": null,
                "lease.expiresAt": null,
            },
        },
        { session },
    );

    const normalizedUsers = await db.collection("users").updateMany(
        { accountStatus: { $nin: ["active", "suspended", "deleted"] } },
        [
            {
                $set: {
                    accountStatus: {
                        $cond: [
                            { $eq: [{ $type: "$deletedAt" }, "date"] },
                            "deleted",
                            { $cond: [{ $eq: ["$isActive", false] }, "suspended", "active"] },
                        ],
                    },
                },
            },
        ],
        { session },
    );
    const terminalUsers = await db.collection("users").updateMany(
        { accountStatus: "deleted" },
        [
            {
                $set: {
                    isActive: false,
                    deletedAt: {
                        $cond: [{ $eq: [{ $type: "$deletedAt" }, "date"] }, "$deletedAt", now],
                    },
                },
            },
        ],
        { session },
    );
    const providerRevocations = await db.collection("faceconsents").updateMany(
        {
            revokedAt: { $type: "date" },
            externalProviderConsent: { $type: "object" },
            "externalProviderConsent.revokedAt": { $not: { $type: "date" } },
        },
        [{ $set: { "externalProviderConsent.revokedAt": "$revokedAt" } }],
        { session },
    );
    const sanitizedJobs = await db.collection("filedeletionjobs").updateMany(
        { status: "completed" },
        {
            $unset: {
                ownerId: "",
                storageKey: "",
                "lease.token": "",
            },
            $set: { "lease.expiresAt": null },
        },
        { session },
    );

    return {
        requestDefaultsNormalized: defaults.modifiedCount,
        unverifiedRequestsMadeRetryable: unverified.modifiedCount,
        staleRequestsMadeRetryable: stale.modifiedCount,
        usersNormalized: normalizedUsers.modifiedCount,
        terminalUsersFixed: terminalUsers.modifiedCount,
        providerRevocationsSynchronized: providerRevocations.modifiedCount,
        completedJobsSanitized: sanitizedJobs.modifiedCount,
    };
}

/** Cria/substitui apenas os índices canónicos incompatíveis. */
async function finalize({ db }) {
    let indexesCreated = 0;
    let indexesReplaced = 0;

    for (const [collectionName, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
        const collection = db.collection(collectionName);
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

/** Confirma que não permanecem estados inseguros nem índices incompletos. */
async function validate({ db }) {
    const remaining = await analyze(db);
    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 004 deixou privacidade ou erasure incompletos");
    }
    return remaining;
}

export const migration004PrivacyRequestsAndErasure = Object.freeze({
    version: "004_privacy_requests_and_erasure",
    description: "Recupera pedidos legados e fixa estados terminais de privacidade",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
