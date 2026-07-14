/** Migração 011: sessão v2, jobs duráveis, idempotência e índices. */
const SESSIONS = "aiconsultationsessions";
const JOBS = "aijobs";
const ANALYSES = "faceanalyses";
const PHOTOS = "facephotos";

const REQUIRED_INDEXES = Object.freeze([
    {
        collection: SESSIONS,
        key: { userId: 1, isOpen: 1 },
        options: {
            unique: true,
            partialFilterExpression: { isOpen: true },
            name: "one_open_ai_consultation_per_user",
        },
    },
    {
        collection: JOBS,
        key: { deduplicationKey: 1 },
        options: { unique: true, name: "deduplicationKey_1" },
    },
    {
        collection: JOBS,
        key: { status: 1, availableAt: 1, "lease.expiresAt": 1, type: 1 },
        options: { name: "status_1_availableAt_1_lease.expiresAt_1_type_1" },
    },
    {
        collection: JOBS,
        key: { terminalAt: 1 },
        options: {
            expireAfterSeconds: 30 * 24 * 60 * 60,
            name: "ttl_terminal_ai_jobs_30d",
        },
    },
    {
        collection: ANALYSES,
        key: { userId: 1, inputFingerprint: 1 },
        options: {
            unique: true,
            partialFilterExpression: {
                schemaVersion: 2,
                inputFingerprint: { $type: "string" },
            },
            name: "uniq_v2_face_analysis_input",
        },
    },
]);

async function listIndexes(db, collection) {
    try {
        return await db.collection(collection).listIndexes().toArray();
    } catch (error) {
        if (error?.code === 26 || error?.codeName === "NamespaceNotFound") return [];
        throw error;
    }
}

function sameKey(left = {}, right = {}) {
    return JSON.stringify(Object.entries(left)) === JSON.stringify(Object.entries(right));
}

async function missingIndexCount(db) {
    let missing = 0;
    for (const required of REQUIRED_INDEXES) {
        const indexes = await listIndexes(db, required.collection);
        const found = indexes.find((index) => sameKey(index.key, required.key));
        if (!found) missing += 1;
    }
    return missing;
}

export const migration011GoalConsultationAndAiJobs = Object.freeze({
    version: "011_goal_consultation_and_ai_jobs",
    description: "Arquiva sessões guiadas v1 e instala consulta OpenAI/jobs v2",
    executionMode: "transaction_then_finalize",

    async analyze(db) {
        return {
            openLegacySessions: await db.collection(SESSIONS).countDocuments({
                schemaVersion: { $ne: 2 },
                status: { $in: ["draft", "submitted"] },
            }),
            photosWithoutQuality: await db.collection(PHOTOS).countDocuments({
                quality: { $exists: false },
                status: "active",
            }),
            missingIndexes: await missingIndexCount(db),
        };
    },

    async up({ db, session, now }) {
        const archived = await db.collection(SESSIONS).updateMany(
            {
                schemaVersion: { $ne: 2 },
                status: { $in: ["draft", "submitted"] },
            },
            {
                $set: {
                    schemaVersion: 1,
                    status: "legacy_archived",
                    flowState: "legacy_archived",
                    isOpen: false,
                    legacyArchivedAt: now,
                },
            },
            { session },
        );
        const photosMarkedForReupload = await db.collection(PHOTOS).updateMany(
            { quality: { $exists: false }, status: "active" },
            {
                $set: {
                    quality: {
                        profileVersion: "legacy-unmeasured",
                        status: "fail",
                        failures: ["legacy_quality_unknown"],
                        warnings: [],
                        metrics: {
                            lumaMean: 0,
                            darkClippedRatio: 0,
                            lightClippedRatio: 0,
                            blurVariance: 0,
                        },
                    },
                },
            },
            { session },
        );
        return {
            legacySessionsArchived: archived.modifiedCount,
            photosMarkedForReupload: photosMarkedForReupload.modifiedCount,
        };
    },

    async finalize({ db }) {
        let indexesCreated = 0;
        for (const required of REQUIRED_INDEXES) {
            const indexes = await listIndexes(db, required.collection);
            const same = indexes.find((index) => sameKey(index.key, required.key));
            if (same && same.name !== required.options.name) {
                await db.collection(required.collection).dropIndex(same.name);
            }
            if (!same || same.name !== required.options.name) {
                await db
                    .collection(required.collection)
                    .createIndex(required.key, required.options);
                indexesCreated += 1;
            }
        }
        return { indexesCreated };
    },

    async validate({ db }) {
        const [openLegacySessions, activeUnknownQuality, missingIndexes] =
            await Promise.all([
                db.collection(SESSIONS).countDocuments({
                    schemaVersion: { $ne: 2 },
                    isOpen: true,
                }),
                db.collection(PHOTOS).countDocuments({
                    quality: { $exists: false },
                    status: "active",
                }),
                missingIndexCount(db),
            ]);
        if (openLegacySessions || activeUnknownQuality || missingIndexes) {
            throw new Error("Migração 011 não satisfez as pós-condições");
        }
        return { openLegacySessions, activeUnknownQuality, missingIndexes };
    },
});
