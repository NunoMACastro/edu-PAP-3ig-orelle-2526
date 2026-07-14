/**
 * Migração 009: write barriers, unicidade tardia e bytes faciais AES-GCM v2.
 *
 * DML/deduplicação corre numa transação. A recifra de ficheiros é retomável:
 * o novo ciphertext é publicado num path determinístico, a troca de metadata e
 * o outbox do path antigo confirmam na mesma transação e só depois os bytes
 * legacy são removidos. Uma interrupção deixa sempre o documento a apontar
 * para um ficheiro decifrável e a ausência do registo força replay.
 */
import { createHash, randomUUID } from "node:crypto";
import {
    mkdir,
    readFile,
    rename,
    stat,
    unlink,
    writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
    decryptBuffer,
    decryptBufferWithContext,
    decryptJsonForMigration,
    encryptBufferWithContext,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../utils/encryption.util.js";
import { buildFacePhotoEncryptionContext } from "../services/face-secure-storage.service.js";

const FACE_PHOTO_COLLECTION = "facephotos";
const USER_COLLECTION = "users";
const CONSENT_COLLECTION = "faceconsents";
const PRIVACY_REQUEST_COLLECTION = "biometricdatarequests";
const REPORT_COLLECTION = "facereports";
const REPORT_UNLOCK_COLLECTION = "reportunlocks";
const GUIDED_SESSION_COLLECTION = "aiconsultationsessions";
const FILE_JOB_COLLECTION = "filedeletionjobs";
const FILE_JOB_SOURCE = "migration_009_face_photo";
const BLOCK_REASONS = Object.freeze([
    "consent_revoked",
    "privacy_request",
    "account_deleted",
]);
const BLOCKING_PRIVACY_STATUSES = Object.freeze([
    "pending",
    "processing",
    "failed",
]);
const PRIVACY_REASON_FIELDS = Object.freeze(["reason", "decisionReason"]);
const TRANSACTION_OPTIONS = Object.freeze({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
});
const REQUIRED_INDEXES = Object.freeze([
    Object.freeze({
        collection: REPORT_COLLECTION,
        key: Object.freeze({ userId: 1, analysisId: 1 }),
        options: Object.freeze({
            unique: true,
            name: "userId_1_analysisId_1",
        }),
    }),
    Object.freeze({
        collection: GUIDED_SESSION_COLLECTION,
        key: Object.freeze({ userId: 1, status: 1 }),
        options: Object.freeze({
            unique: true,
            partialFilterExpression: Object.freeze({ status: "draft" }),
            name: "one_guided_draft_per_user",
        }),
    }),
]);

function sameValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function sameIndexKey(left = {}, right = {}) {
    return sameValue(Object.entries(left), Object.entries(right));
}

function hasRequiredIndexOptions(index, required) {
    return (
        Boolean(index?.unique) === Boolean(required.options.unique) &&
        sameValue(
            index?.partialFilterExpression ?? null,
            required.options.partialFilterExpression ?? null,
        )
    );
}

async function listIndexes(collection) {
    try {
        return await collection.listIndexes().toArray();
    } catch (error) {
        if (error?.code === 26 || error?.codeName === "NamespaceNotFound") {
            return [];
        }
        throw error;
    }
}

async function analyzeIndexes(db) {
    let missingIndexes = 0;
    let mismatchedIndexes = 0;
    for (const required of REQUIRED_INDEXES) {
        const indexes = await listIndexes(db.collection(required.collection));
        const sameKey = indexes.find((index) =>
            sameIndexKey(index.key, required.key),
        );
        if (!sameKey) missingIndexes += 1;
        else if (!hasRequiredIndexOptions(sameKey, required)) {
            mismatchedIndexes += 1;
        }
    }
    return { missingIndexes, mismatchedIndexes };
}

async function ensureIndexes(db) {
    let indexesCreated = 0;
    let indexesReplaced = 0;
    for (const required of REQUIRED_INDEXES) {
        const collection = db.collection(required.collection);
        const indexes = await listIndexes(collection);
        const sameKey = indexes.find((index) =>
            sameIndexKey(index.key, required.key),
        );
        if (sameKey && !hasRequiredIndexOptions(sameKey, required)) {
            await collection.dropIndex(sameKey.name);
            indexesReplaced += 1;
        }
        if (!sameKey || !hasRequiredIndexOptions(sameKey, required)) {
            await collection.createIndex(required.key, required.options);
            indexesCreated += 1;
        }
    }
    return { indexesCreated, indexesReplaced };
}

async function findDuplicateGroups(
    collection,
    groupId,
    match = {},
    session = undefined,
) {
    return collection
        .aggregate(
            [
                { $match: match },
                {
                    $group: {
                        _id: groupId,
                        ids: { $push: "$_id" },
                        count: { $sum: 1 },
                    },
                },
                { $match: { count: { $gt: 1 } } },
            ],
            session ? { session } : {},
        )
        .toArray();
}

async function deduplicateFaceReports(db, session) {
    const reports = db.collection(REPORT_COLLECTION);
    const unlocks = db.collection(REPORT_UNLOCK_COLLECTION);
    const groups = await findDuplicateGroups(
        reports,
        { userId: "$userId", analysisId: "$analysisId" },
        {
            userId: { $type: "objectId" },
            analysisId: { $type: "objectId" },
        },
        session,
    );
    let duplicateReportsRemoved = 0;
    let unlockReferencesMoved = 0;

    for (const group of groups) {
        const candidates = await reports
            .find(
                { _id: { $in: group.ids } },
                {
                    session,
                    projection: { updatedAt: 1, createdAt: 1 },
                },
            )
            .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
            .toArray();
        const [survivor, ...duplicates] = candidates;
        const duplicateIds = duplicates.map(({ _id }) => _id);
        const relatedUnlocks = await unlocks
            .find(
                { reportId: { $in: candidates.map(({ _id }) => _id) } },
                { session, projection: { reportId: 1 } },
            )
            .toArray();
        if (relatedUnlocks.length > 1) {
            throw new Error(
                "Migração 009 encontrou relatórios duplicados com múltiplos unlocks",
            );
        }
        if (
            relatedUnlocks.length === 1 &&
            String(relatedUnlocks[0].reportId) !== String(survivor._id)
        ) {
            await unlocks.updateOne(
                { _id: relatedUnlocks[0]._id },
                { $set: { reportId: survivor._id } },
                { session },
            );
            unlockReferencesMoved += 1;
        }
        const deletion = await reports.deleteMany(
            { _id: { $in: duplicateIds } },
            { session },
        );
        duplicateReportsRemoved += deletion.deletedCount ?? 0;
    }

    return { duplicateReportsRemoved, unlockReferencesMoved };
}

async function deduplicateGuidedDrafts(db, session) {
    const sessions = db.collection(GUIDED_SESSION_COLLECTION);
    const groups = await findDuplicateGroups(
        sessions,
        { userId: "$userId", status: "$status" },
        { userId: { $type: "objectId" }, status: "draft" },
        session,
    );
    let duplicateDraftsRemoved = 0;
    for (const group of groups) {
        const candidates = await sessions
            .find(
                { _id: { $in: group.ids } },
                {
                    session,
                    projection: { updatedAt: 1, createdAt: 1 },
                },
            )
            .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
            .toArray();
        const duplicateIds = candidates.slice(1).map(({ _id }) => _id);
        const deletion = await sessions.deleteMany(
            { _id: { $in: duplicateIds } },
            { session },
        );
        duplicateDraftsRemoved += deletion.deletedCount ?? 0;
    }
    return { duplicateDraftsRemoved };
}

async function normalizeUserBarriers(db, session, now) {
    const users = db.collection(USER_COLLECTION);
    const options = { session };
    const generation = await users.updateMany(
        {},
        [
            {
                $set: {
                    faceDataGeneration: {
                        $cond: [
                            { $isNumber: "$faceDataGeneration" },
                            {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ["$faceDataGeneration", 0] },
                                            {
                                                $eq: [
                                                    {
                                                        $mod: [
                                                            "$faceDataGeneration",
                                                            1,
                                                        ],
                                                    },
                                                    0,
                                                ],
                                            },
                                        ],
                                    },
                                    "$faceDataGeneration",
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
        ],
        options,
    );
    await users.updateMany(
        {
            faceProcessingBlockReason: {
                $nin: [...BLOCK_REASONS, null],
            },
        },
        {
            $set: {
                faceProcessingBlockReason: null,
                faceProcessingBlockedAt: null,
            },
        },
        options,
    );
    await users.updateMany(
        {
            $or: [
                { faceProcessingBlockReason: null },
                { faceProcessingBlockReason: { $exists: false } },
            ],
        },
        {
            $set: {
                faceProcessingBlockReason: null,
                faceProcessingBlockedAt: null,
            },
        },
        options,
    );
    await users.updateMany(
        {
            faceProcessingBlockReason: { $in: BLOCK_REASONS },
            faceProcessingBlockedAt: { $not: { $type: "date" } },
        },
        { $set: { faceProcessingBlockedAt: now } },
        options,
    );
    await users.updateMany(
        { accountStatus: { $ne: "deleted" }, faceProcessingBlockReason: "account_deleted" },
        {
            $set: {
                faceProcessingBlockReason: null,
                faceProcessingBlockedAt: null,
            },
        },
        options,
    );
    const deleted = await users.updateMany(
        { accountStatus: "deleted" },
        [
            {
                $set: {
                    isActive: false,
                    faceProcessingBlockReason: "account_deleted",
                    faceProcessingBlockedAt: {
                        $cond: [
                            { $eq: [{ $type: "$deletedAt" }, "date"] },
                            "$deletedAt",
                            now,
                        ],
                    },
                },
            },
        ],
        options,
    );

    const revokedConsents = await db
        .collection(CONSENT_COLLECTION)
        .find(
            { revokedAt: { $type: "date" }, userId: { $type: "objectId" } },
            { session, projection: { userId: 1, revokedAt: 1 } },
        )
        .toArray();
    for (const consent of revokedConsents) {
        await users.updateOne(
            { _id: consent.userId, accountStatus: { $ne: "deleted" } },
            {
                $set: {
                    faceProcessingBlockReason: "consent_revoked",
                    faceProcessingBlockedAt: consent.revokedAt,
                },
            },
            options,
        );
    }

    const blockingRequests = await db
        .collection(PRIVACY_REQUEST_COLLECTION)
        .find(
            {
                requesterId: { $type: "objectId" },
                resources: "photos",
                status: { $in: BLOCKING_PRIVACY_STATUSES },
            },
            { session, projection: { requesterId: 1, createdAt: 1 } },
        )
        .toArray();
    const requestByUser = new Map();
    for (const request of blockingRequests) {
        const key = String(request.requesterId);
        if (!requestByUser.has(key)) requestByUser.set(key, request);
    }
    for (const request of requestByUser.values()) {
        await users.updateOne(
            { _id: request.requesterId, accountStatus: { $ne: "deleted" } },
            {
                $set: {
                    faceProcessingBlockReason: "privacy_request",
                    faceProcessingBlockedAt:
                        request.createdAt instanceof Date
                            ? request.createdAt
                            : now,
                },
            },
            options,
        );
    }

    return {
        userGenerationsNormalized: generation.modifiedCount ?? 0,
        deletedAccountsBlocked: deleted.modifiedCount ?? 0,
        revokedConsentBarriers: revokedConsents.length,
        privacyRequestBarriers: requestByUser.size,
    };
}

function getPrivacyReasonContext(request, field) {
    return {
        collection: PRIVACY_REQUEST_COLLECTION,
        owner: request.requesterId,
        field,
    };
}

async function analyzePrivacyRequestReasons(db, session = undefined) {
    const requests = await db
        .collection(PRIVACY_REQUEST_COLLECTION)
        .find(
            {},
            {
                ...(session ? { session } : {}),
                projection: {
                    requesterId: 1,
                    reason: 1,
                    decisionReason: 1,
                },
            },
        )
        .toArray();
    let privacyReasonFieldsNeedingEncryption = 0;
    let invalidPrivacyReasonOwners = 0;
    for (const request of requests) {
        if (!/^[a-f0-9]{24}$/i.test(String(request.requesterId ?? ""))) {
            invalidPrivacyReasonOwners += 1;
            continue;
        }
        for (const field of PRIVACY_REASON_FIELDS) {
            if (!isContextualEncryptedPayload(request[field])) {
                privacyReasonFieldsNeedingEncryption += 1;
            }
        }
    }
    return {
        privacyReasonFieldsNeedingEncryption,
        invalidPrivacyReasonOwners,
    };
}

async function migratePrivacyRequestReasons(db, session) {
    const requests = await db
        .collection(PRIVACY_REQUEST_COLLECTION)
        .find(
            {},
            {
                session,
                projection: {
                    requesterId: 1,
                    reason: 1,
                    decisionReason: 1,
                },
            },
        )
        .toArray();
    let privacyReasonFieldsEncrypted = 0;
    for (const request of requests) {
        if (!/^[a-f0-9]{24}$/i.test(String(request.requesterId ?? ""))) {
            throw new Error("Migração 009 encontrou pedido sem owner válido");
        }
        const update = {};
        for (const field of PRIVACY_REASON_FIELDS) {
            const context = getPrivacyReasonContext(request, field);
            const currentValue = request[field] ?? "";
            const logicalValue = decryptJsonForMigration(currentValue, context);
            if (typeof logicalValue !== "string") {
                throw new Error("Migração 009 encontrou motivo de privacidade inválido");
            }
            update[field] = encryptJsonWithContext(logicalValue, context);
            if (!isContextualEncryptedPayload(currentValue)) {
                privacyReasonFieldsEncrypted += 1;
            }
        }
        await db.collection(PRIVACY_REQUEST_COLLECTION).updateOne(
            { _id: request._id, requesterId: request.requesterId },
            { $set: update },
            { session },
        );
    }
    return { privacyReasonFieldsEncrypted };
}

function buildCleanupDeduplicationKey(photo, storageKey) {
    return createHash("sha256")
        .update(FILE_JOB_SOURCE)
        .update("\0")
        .update(String(photo._id))
        .update("\0")
        .update(storageKey)
        .digest("hex");
}

function getDbClient(db) {
    const client = db?.client ?? db?.s?.client;
    if (!client || typeof client.startSession !== "function") {
        throw new Error("Migração 009 exige MongoClient transacional");
    }
    return client;
}

function buildPhotoPayload(photo, ciphertext) {
    return {
        encrypted: true,
        algorithm: photo.encryption?.algorithm,
        keyVersion: photo.encryption?.keyVersion,
        aadHash: photo.encryption?.aadHash,
        iv: photo.encryption?.iv,
        authTag: photo.encryption?.authTag,
        ciphertext: ciphertext.toString("base64"),
    };
}

function getPhotoContext(photo) {
    return buildFacePhotoEncryptionContext({
        userId: photo.userId,
        photoId: photo._id,
        kind: photo.kind,
    });
}

async function recipherLegacyPhoto(db, photo) {
    if (
        !photo?.storageKey ||
        !photo?.encryption?.algorithm ||
        !photo?.encryption?.iv ||
        !photo?.encryption?.authTag
    ) {
        throw new Error("Migração 009 encontrou fotografia legacy incompleta");
    }
    const oldCiphertext = await readFile(photo.storageKey);
    const oldPayload = buildPhotoPayload(photo, oldCiphertext);
    const context = getPhotoContext(photo);

    if (isContextualEncryptedPayload(oldPayload)) {
        decryptBufferWithContext(oldPayload, context);
        return false;
    }

    const plainBytes = decryptBuffer(oldPayload);
    const encrypted = encryptBufferWithContext(plainBytes, context);
    const newStorageKey = `${photo.storageKey}.v2-${String(photo._id)}.enc`;
    const temporaryPath = `${newStorageKey}.tmp-${randomUUID()}`;
    await mkdir(path.dirname(newStorageKey), { recursive: true, mode: 0o700 });
    await writeFile(
        temporaryPath,
        Buffer.from(encrypted.ciphertext, "base64"),
        { mode: 0o600 },
    );
    await rename(temporaryPath, newStorageKey);

    const encryption = {
        algorithm: encrypted.algorithm,
        keyVersion: encrypted.keyVersion,
        aadHash: encrypted.aadHash,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
    };
    const deduplicationKey = buildCleanupDeduplicationKey(
        photo,
        photo.storageKey,
    );
    const session = getDbClient(db).startSession();
    let committed = false;
    try {
        await session.withTransaction(async () => {
            const update = await db.collection(FACE_PHOTO_COLLECTION).updateOne(
                {
                    _id: photo._id,
                    userId: photo.userId,
                    kind: photo.kind,
                    storageKey: photo.storageKey,
                    "encryption.iv": photo.encryption.iv,
                    "encryption.authTag": photo.encryption.authTag,
                    "encryption.keyVersion": { $ne: 2 },
                },
                {
                    $set: {
                        storageKey: newStorageKey,
                        encryption,
                        originalName: `${photo.kind}.webp`,
                    },
                },
                { session },
            );
            if (update.matchedCount !== 1) {
                throw new Error("Migração 009 perdeu CAS da fotografia legacy");
            }
            await db.collection(FILE_JOB_COLLECTION).updateOne(
                { deduplicationKey },
                {
                    $setOnInsert: {
                        deduplicationKey,
                        sourceType: FILE_JOB_SOURCE,
                        sourceId: String(photo._id),
                        ownerId: photo.userId,
                        storageKey: photo.storageKey,
                        status: "pending",
                        attempts: 0,
                        lease: { token: null, expiresAt: null },
                        lastError: "",
                        lastAttemptAt: null,
                        completedAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                },
                { upsert: true, session },
            );
        }, TRANSACTION_OPTIONS);
        committed = true;
    } finally {
        await session.endSession();
        if (!committed) await unlink(newStorageKey).catch(() => undefined);
    }
    return true;
}

async function processLegacyFileJobs(db) {
    const jobs = await db
        .collection(FILE_JOB_COLLECTION)
        .find({ sourceType: FILE_JOB_SOURCE, status: { $ne: "completed" } })
        .toArray();
    let legacyFilesRemoved = 0;
    for (const job of jobs) {
        if (!job.storageKey) {
            throw new Error("Migração 009 encontrou cleanup sem path");
        }
        await unlink(job.storageKey).catch((error) => {
            if (error?.code !== "ENOENT") throw error;
        });
        try {
            await stat(job.storageKey);
            throw new Error("Migração 009 não removeu ciphertext legacy");
        } catch (error) {
            if (error?.code !== "ENOENT") throw error;
        }
        await db.collection(FILE_JOB_COLLECTION).updateOne(
            { _id: job._id, status: { $ne: "completed" } },
            {
                $set: {
                    status: "completed",
                    completedAt: new Date(),
                    lastError: "",
                    "lease.expiresAt": null,
                    updatedAt: new Date(),
                },
                $inc: { attempts: 1 },
                $unset: {
                    ownerId: "",
                    storageKey: "",
                    "lease.token": "",
                },
            },
        );
        legacyFilesRemoved += 1;
    }
    return legacyFilesRemoved;
}

async function migrateFacePhotoFiles(db) {
    const photos = await db
        .collection(FACE_PHOTO_COLLECTION)
        .find({})
        .project({
            userId: 1,
            kind: 1,
            storageKey: 1,
            encryption: 1,
            originalName: 1,
        })
        .toArray();
    let facePhotoFilesReciphered = 0;
    let facePhotoNamesMinimized = 0;
    for (const photo of photos) {
        if (await recipherLegacyPhoto(db, photo)) {
            facePhotoFilesReciphered += 1;
        } else if (photo.originalName !== `${photo.kind}.webp`) {
            const result = await db.collection(FACE_PHOTO_COLLECTION).updateOne(
                { _id: photo._id, originalName: photo.originalName },
                { $set: { originalName: `${photo.kind}.webp` } },
            );
            facePhotoNamesMinimized += result.modifiedCount ?? 0;
        }
    }
    const legacyFilesRemoved = await processLegacyFileJobs(db);
    return {
        facePhotoFilesReciphered,
        facePhotoNamesMinimized,
        legacyFilesRemoved,
    };
}

async function countDuplicateDocuments(db) {
    const reportGroups = await findDuplicateGroups(
        db.collection(REPORT_COLLECTION),
        { userId: "$userId", analysisId: "$analysisId" },
        {
            userId: { $type: "objectId" },
            analysisId: { $type: "objectId" },
        },
    );
    const draftGroups = await findDuplicateGroups(
        db.collection(GUIDED_SESSION_COLLECTION),
        { userId: "$userId", status: "$status" },
        { userId: { $type: "objectId" }, status: "draft" },
    );
    return {
        duplicateFaceReports: reportGroups.reduce(
            (total, group) => total + group.count - 1,
            0,
        ),
        duplicateGuidedDrafts: draftGroups.reduce(
            (total, group) => total + group.count - 1,
            0,
        ),
    };
}

async function analyze(db) {
    const users = db.collection(USER_COLLECTION);
    const photos = db.collection(FACE_PHOTO_COLLECTION);
    const [
        barrierUsers,
        legacyFacePhotoFiles,
        duplicateCounts,
        indexes,
        privacyReasons,
    ] =
        await Promise.all([
            users.countDocuments({
                $or: [
                    { faceDataGeneration: { $not: { $type: "number" } } },
                    { faceDataGeneration: { $lt: 0 } },
                    {
                        faceProcessingBlockReason: {
                            $nin: [...BLOCK_REASONS, null],
                        },
                    },
                    {
                        accountStatus: "deleted",
                        faceProcessingBlockReason: { $ne: "account_deleted" },
                    },
                ],
            }),
            photos.countDocuments({
                $or: [
                    { "encryption.keyVersion": { $ne: 2 } },
                    { "encryption.aadHash": { $not: { $type: "string" } } },
                ],
            }),
            countDuplicateDocuments(db),
            analyzeIndexes(db),
            analyzePrivacyRequestReasons(db),
        ]);
    return {
        barrierUsers,
        legacyFacePhotoFiles,
        ...duplicateCounts,
        ...indexes,
        ...privacyReasons,
    };
}

async function up({ db, session, now }) {
    return {
        ...(await normalizeUserBarriers(db, session, now)),
        ...(await migratePrivacyRequestReasons(db, session)),
        ...(await deduplicateFaceReports(db, session)),
        ...(await deduplicateGuidedDrafts(db, session)),
    };
}

async function finalize({ db }) {
    return {
        ...(await migrateFacePhotoFiles(db)),
        ...(await ensureIndexes(db)),
    };
}

async function validatePhotoFiles(db) {
    const photos = await db
        .collection(FACE_PHOTO_COLLECTION)
        .find({})
        .project({ userId: 1, kind: 1, storageKey: 1, encryption: 1, originalName: 1 })
        .toArray();
    for (const photo of photos) {
        if (
            photo.encryption?.keyVersion !== 2 ||
            typeof photo.encryption?.aadHash !== "string" ||
            photo.originalName !== `${photo.kind}.webp`
        ) {
            throw new Error("Migração 009 deixou fotografia fora do contrato v2");
        }
        const ciphertext = await readFile(photo.storageKey);
        decryptBufferWithContext(
            buildPhotoPayload(photo, ciphertext),
            getPhotoContext(photo),
        );
    }
    return photos.length;
}

async function validate({ db }) {
    const users = await db
        .collection(USER_COLLECTION)
        .find({})
        .project({
            accountStatus: 1,
            faceDataGeneration: 1,
            faceProcessingBlockedAt: 1,
            faceProcessingBlockReason: 1,
        })
        .toArray();
    for (const user of users) {
        const generationIsValid =
            Number.isInteger(user.faceDataGeneration) &&
            user.faceDataGeneration >= 0;
        const reasonIsValid =
            user.faceProcessingBlockReason === null ||
            BLOCK_REASONS.includes(user.faceProcessingBlockReason);
        const timestampIsValid =
            user.faceProcessingBlockedAt === null ||
            user.faceProcessingBlockedAt instanceof Date;
        const deletedIsTerminal =
            user.accountStatus !== "deleted" ||
            (user.faceProcessingBlockReason === "account_deleted" &&
                user.faceProcessingBlockedAt instanceof Date);
        if (
            !generationIsValid ||
            !reasonIsValid ||
            !timestampIsValid ||
            !deletedIsTerminal
        ) {
            throw new Error("Migração 009 deixou write barrier inválida");
        }
    }

    const duplicateCounts = await countDuplicateDocuments(db);
    const indexes = await analyzeIndexes(db);
    if (
        duplicateCounts.duplicateFaceReports !== 0 ||
        duplicateCounts.duplicateGuidedDrafts !== 0 ||
        indexes.missingIndexes !== 0 ||
        indexes.mismatchedIndexes !== 0
    ) {
        throw new Error("Migração 009 não consolidou unicidade/indexes");
    }
    const pendingCleanup = await db.collection(FILE_JOB_COLLECTION).countDocuments({
        sourceType: FILE_JOB_SOURCE,
        status: { $ne: "completed" },
    });
    if (pendingCleanup !== 0) {
        throw new Error("Migração 009 deixou cleanup físico pendente");
    }

    const privacyRequests = await db
        .collection(PRIVACY_REQUEST_COLLECTION)
        .find({})
        .project({ requesterId: 1, reason: 1, decisionReason: 1 })
        .toArray();
    for (const request of privacyRequests) {
        for (const field of PRIVACY_REASON_FIELDS) {
            if (!isContextualEncryptedPayload(request[field])) {
                throw new Error("Migração 009 deixou motivo de privacidade em claro");
            }
            const logicalValue = decryptJsonForMigration(
                request[field],
                getPrivacyReasonContext(request, field),
            );
            if (typeof logicalValue !== "string") {
                throw new Error("Migração 009 deixou motivo de privacidade inválido");
            }
        }
    }

    return {
        usersValidated: users.length,
        privacyRequestsValidated: privacyRequests.length,
        facePhotoFilesValidated: await validatePhotoFiles(db),
        duplicateFaceReports: 0,
        duplicateGuidedDrafts: 0,
        pendingCleanup: 0,
        requiredIndexes: REQUIRED_INDEXES.length,
    };
}

export const migration009PrivacyBarriersAndFaceFileEncryption = Object.freeze({
    version: "009_privacy_barriers_and_face_file_encryption",
    description:
        "Lineariza dados faciais, recifra bytes com AAD e consolida unicidade",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
