/**
 * Integração real do backup académico/local sobre um MongoDB replica set
 * efémero. A suite cria exclusivamente URIs loopback próprias e nunca lê a
 * configuração ou o `.env` da aplicação.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    BACKUP_FORMAT,
    DEFAULT_PRIVATE_DATA_ROOT,
    DEFAULT_RESTORE_STORAGE_ROOT,
    createBackupSnapshot,
    listSnapshotIds,
    normalizeIndexes,
    readVerifiedBackupSnapshot,
    resolveBackupRoot,
    restoreBackupSnapshot,
    sha256,
    verifyBackupSnapshot,
} from "../scripts/backup-local.core.mjs";

const { Binary, Decimal128, EJSON, Int32, Long, ObjectId } =
    mongoose.mongo.BSON;
const SOURCE_DATABASE = "orelle_g7_backup_source";
const RESTORE_DATABASE = `${SOURCE_DATABASE}_restore`;
const BACKUP_ROOT = resolveBackupRoot(
    `storage/private/backups-replset-test-${randomUUID()}`,
);
const PRIVATE_SOURCE_ROOT = path.join(
    DEFAULT_PRIVATE_DATA_ROOT,
    `backup-source-test-${randomUUID()}`,
);
const PRIVATE_RESTORE_ROOT = path.join(
    DEFAULT_RESTORE_STORAGE_ROOT,
    `backup-restore-test-${randomUUID()}`,
);
const FACE_STORAGE_KEY = path.join(
    PRIVATE_SOURCE_ROOT,
    "facial-photos",
    "front.webp.enc",
);
const MAKEUP_STORAGE_KEY = path.join(
    PRIVATE_SOURCE_ROOT,
    "makeup-simulations",
    "preview.webp.enc",
);
const FACE_PRIVATE_BYTES = Buffer.from("encrypted-face-photo-fixture");
const MAKEUP_PRIVATE_BYTES = Buffer.from("encrypted-makeup-output-fixture");
const ENCRYPTION_KEY = Buffer.alloc(32, 0x47);
const SNAPSHOT_TIME = new Date("2026-07-10T00:00:00.000Z");
const AI_COLLECTION_NAMES = Object.freeze([
    "aiconsultationauditlogs",
    "aiconsultationreviews",
    "aiconsultationsessions",
    "aijobs",
    "faceanalyses",
    "facephotos",
    "facereports",
    "makeupsimulations",
    "makeupsimulationquotas",
    "productrecommendations",
    "reportphotogrants",
    "reportunlocks",
]);

let replicaSet;
let client;
let sourceDb;

/**
 * Produz Extended JSON não relaxado, igual ao formato autenticado pelo core.
 *
 * @param {unknown} value - BSON ou estrutura JavaScript a serializar.
 * @returns {string} Extended JSON determinístico para os dados ordenados.
 */
function canonicalEjson(value) {
    return EJSON.stringify(value, { relaxed: false });
}

/**
 * Devolve documentos e índices em ordem estável para comparação sem perda de
 * tipos BSON.
 *
 * @param {import("mongodb").Db} db - Base MongoDB a inspecionar.
 * @param {string} collectionName - Coleção alvo.
 * @returns {Promise<{documents: object[], indexes: object[]}>} Estado canónico.
 */
async function readCollectionState(db, collectionName) {
    const collection = db.collection(collectionName);
    return {
        documents: await collection.find({}).sort({ _id: 1 }).toArray(),
        indexes: normalizeIndexes(await collection.indexes()),
    };
}

/**
 * Confirma que uma base eliminada já não figura no catálogo do servidor.
 *
 * @param {string} databaseName - Nome exato da base.
 * @returns {Promise<boolean>} `true` quando a base existe.
 */
async function databaseExists(databaseName) {
    const result = await client.db("admin").admin().listDatabases({
        nameOnly: true,
    });
    return result.databases.some(({ name }) => name === databaseName);
}

/**
 * Cria dados que exercitam os tipos BSON e os índices reproduzíveis exigidos
 * pelo formato de backup.
 *
 * @returns {Promise<void>}
 */
async function seedSourceDatabase() {
    const profiles = sourceDb.collection("profiles");
    await profiles.insertMany([
        {
            _id: new ObjectId("66c000000000000000000801"),
            email: "backup-one@orelle.test",
            active: true,
            createdAt: new Date("2026-07-09T18:00:00.000Z"),
            expiresAt: new Date("2036-07-09T18:00:00.000Z"),
            score: Decimal128.fromString("98.7500"),
            visits: Long.fromString("9007199254740993"),
            revision: new Int32(3),
            encryptedFixture: new Binary(Buffer.from([0x00, 0x7f, 0xff])),
            nested: { labels: ["normal", "sensível"], nullable: null },
        },
        {
            _id: new ObjectId("66c000000000000000000802"),
            email: "backup-two@orelle.test",
            active: false,
            createdAt: new Date("2026-07-09T19:00:00.000Z"),
            expiresAt: new Date("2036-07-09T19:00:00.000Z"),
            score: Decimal128.fromString("0.125"),
            visits: Long.fromNumber(2),
            revision: new Int32(4),
            encryptedFixture: new Binary(Buffer.from("orelle", "utf8")),
            nested: { labels: [], nullable: null },
        },
    ]);
    await profiles.createIndexes([
        {
            key: { email: 1 },
            name: "email_unique",
            unique: true,
        },
        {
            key: { expiresAt: 1 },
            name: "expires_at_ttl",
            expireAfterSeconds: 0,
        },
        {
            key: { active: 1, createdAt: -1 },
            name: "active_profiles_partial",
            partialFilterExpression: { active: true },
        },
    ]);

    const emptyAudit = await sourceDb.createCollection("empty_audit");
    await emptyAudit.createIndex(
        { recordedAt: -1 },
        { name: "recorded_at_desc" },
    );

    const ownerId = new ObjectId("66c000000000000000000901");
    const reportId = new ObjectId("66c000000000000000000902");
    const reviewId = new ObjectId("66c000000000000000000903");
    const aiFixtures = {
        aiconsultationauditlogs: {
            actorId: new ObjectId("66c000000000000000000904"),
            reviewId,
            action: "detail",
            occurredAt: new Date("2026-07-10T09:00:00.000Z"),
        },
        aiconsultationreviews: {
            userId: ownerId,
            reportId,
            status: "approved",
            summary: { encrypted: true, ciphertext: "review-ciphertext-sentinel" },
        },
        aiconsultationsessions: {
            userId: ownerId,
            reportId,
            flowState: "unlocked",
            conversation: {
                encrypted: true,
                ciphertext: "session-ciphertext-sentinel",
            },
        },
        aijobs: {
            userId: ownerId,
            type: "generate_report",
            status: "completed",
            terminalAt: new Date("2026-07-10T09:00:00.000Z"),
        },
        faceanalyses: {
            userId: ownerId,
            mode: "openai",
            findings: {
                encrypted: true,
                ciphertext: "analysis-ciphertext-sentinel",
            },
        },
        facephotos: {
            userId: ownerId,
            kind: "frontal",
            status: "active",
            storageKey: FACE_STORAGE_KEY,
        },
        facereports: {
            userId: ownerId,
            reportId,
            lifecycleStatus: "unlocked",
            machineResult: {
                encrypted: true,
                ciphertext: "report-ciphertext-sentinel",
            },
        },
        makeupsimulations: {
            userId: ownerId,
            reportId,
            status: "completed",
            outputStorageKey: MAKEUP_STORAGE_KEY,
            outputEncryption: {
                algorithm: "aes-256-gcm",
                keyVersion: 2,
                authTag: "private-auth-tag",
            },
            expiresAt: new Date("2026-07-17T09:00:00.000Z"),
        },
        makeupsimulationquotas: {
            userId: ownerId,
            reservations: [
                {
                    simulationId: new ObjectId("66c000000000000000000905"),
                    createdAt: new Date("2026-07-10T09:00:00.000Z"),
                },
            ],
        },
        productrecommendations: {
            userId: ownerId,
            reportId,
            productSnapshot: {
                encrypted: true,
                ciphertext: "recommendation-ciphertext-sentinel",
            },
        },
        reportphotogrants: {
            clientUserId: ownerId,
            reportId,
            reviewId,
            status: "active",
            expiresAt: new Date("2026-07-17T09:00:00.000Z"),
        },
        reportunlocks: {
            userId: ownerId,
            reportId,
            status: "unlocked",
            depositCents: 250,
            simulatedPayment: { status: "simulated_paid" },
        },
    };

    for (const collectionName of AI_COLLECTION_NAMES) {
        const collection = sourceDb.collection(collectionName);
        await collection.insertOne(aiFixtures[collectionName]);
        let ownershipKey = { userId: 1, reportId: 1 };
        if (collectionName === "reportphotogrants") {
            ownershipKey = { clientUserId: 1, reportId: 1 };
        } else if (collectionName === "aiconsultationauditlogs") {
            ownershipKey = { reviewId: 1, occurredAt: -1 };
        } else if (collectionName === "makeupsimulationquotas") {
            ownershipKey = { userId: 1 };
        }
        await collection.createIndex(ownershipKey, {
            name: `${collectionName}_ownership_test`,
            ...(collectionName === "makeupsimulationquotas"
                ? { unique: true }
                : {}),
        });
    }
    await mkdir(path.dirname(FACE_STORAGE_KEY), { recursive: true, mode: 0o700 });
    await mkdir(path.dirname(MAKEUP_STORAGE_KEY), {
        recursive: true,
        mode: 0o700,
    });
    await Promise.all([
        writeFile(FACE_STORAGE_KEY, FACE_PRIVATE_BYTES, { mode: 0o600 }),
        writeFile(MAKEUP_STORAGE_KEY, MAKEUP_PRIVATE_BYTES, { mode: 0o600 }),
    ]);
}

describe("backup local com MongoMemoryReplSet", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: {
                count: 1,
                storageEngine: "wiredTiger",
            },
        });

        client = new mongoose.mongo.MongoClient(
            replicaSet.getUri(SOURCE_DATABASE),
        );
        await client.connect();
        sourceDb = client.db(SOURCE_DATABASE);
        await mkdir(PRIVATE_SOURCE_ROOT, { recursive: true, mode: 0o700 });
        await seedSourceDatabase();
    }, 180_000);

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
        await rm(BACKUP_ROOT, { recursive: true, force: true });
        await rm(PRIVATE_SOURCE_ROOT, { recursive: true, force: true });
        await rm(PRIVATE_RESTORE_ROOT, { recursive: true, force: true });
    }, 60_000);

    it("cria, restaura e verifica documentos, índices e checksums com cleanup isolado", async () => {
        const sourceProfilesBefore = await readCollectionState(
            sourceDb,
            "profiles",
        );
        const manifest = await createBackupSnapshot({
            db: sourceDb,
            backupRoot: BACKUP_ROOT,
            privateStorageRoot: PRIVATE_SOURCE_ROOT,
            encryptionKey: ENCRYPTION_KEY,
            now: SNAPSHOT_TIME,
        });
        const snapshotDirectory = path.join(
            BACKUP_ROOT,
            manifest.snapshotId,
        );
        const verifiedSnapshot = await readVerifiedBackupSnapshot({
            snapshotDirectory,
            encryptionKey: ENCRYPTION_KEY,
        });

        expect(manifest).toMatchObject({
            format: BACKUP_FORMAT,
            sourceDatabase: SOURCE_DATABASE,
        });
        expect(manifest.collections.map(({ name }) => name)).toEqual(
            [...AI_COLLECTION_NAMES, "empty_audit", "profiles"].sort(),
        );
        expect(manifest.privateFiles).toHaveLength(2);
        const manifestText = await readFile(
            path.join(snapshotDirectory, "manifest.json"),
            "utf8",
        );
        expect(manifestText).not.toContain(FACE_STORAGE_KEY);
        expect(manifestText).not.toContain(MAKEUP_STORAGE_KEY);
        expect(manifestText).not.toContain("front.webp.enc");
        expect(manifestText).not.toContain("preview.webp.enc");

        for (const entry of manifest.collections) {
            const encryptedFile = await readFile(
                path.join(snapshotDirectory, entry.fileName),
            );
            const payload = verifiedSnapshot.payloads.find(
                ({ collectionName }) => collectionName === entry.name,
            );

            expect(sha256(encryptedFile)).toBe(entry.encryptedSha256);
            expect(
                sha256(Buffer.from(canonicalEjson(payload), "utf8")),
            ).toBe(entry.plaintextSha256);
            expect(encryptedFile.toString("utf8")).not.toContain(
                "backup-one@orelle.test",
            );
            expect(encryptedFile.toString("utf8")).not.toContain(
                "ciphertext-sentinel",
            );
            expect(encryptedFile.toString("utf8")).not.toContain(
                MAKEUP_STORAGE_KEY,
            );
        }
        for (const entry of manifest.privateFiles) {
            const encryptedFile = await readFile(
                path.join(snapshotDirectory, entry.fileName),
            );
            expect(sha256(encryptedFile)).toBe(entry.encryptedSha256);
            expect(encryptedFile.toString("utf8")).not.toContain(
                PRIVATE_SOURCE_ROOT,
            );
            expect(encryptedFile.toString("utf8")).not.toContain(
                FACE_PRIVATE_BYTES.toString("utf8"),
            );
            expect(encryptedFile.toString("utf8")).not.toContain(
                MAKEUP_PRIVATE_BYTES.toString("utf8"),
            );
        }
        expect(
            verifiedSnapshot.privateFiles.map(({ bytes }) => bytes).sort(Buffer.compare),
        ).toEqual([FACE_PRIVATE_BYTES, MAKEUP_PRIVATE_BYTES].sort(Buffer.compare));

        for (const collectionName of AI_COLLECTION_NAMES) {
            const payload = verifiedSnapshot.payloads.find(
                ({ collectionName: name }) => name === collectionName,
            );
            expect(payload.documents).toHaveLength(1);
            expect(payload.indexes).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: `${collectionName}_ownership_test`,
                    }),
                ]),
            );
        }

        const snapshotProfiles = verifiedSnapshot.payloads.find(
            ({ collectionName }) => collectionName === "profiles",
        );
        expect(snapshotProfiles.documents[0]).toMatchObject({
            _id: expect.any(ObjectId),
            createdAt: expect.any(Date),
            score: expect.any(Decimal128),
            visits: expect.any(Long),
            revision: expect.any(Int32),
            encryptedFixture: expect.any(Binary),
        });
        const indexesByName = new Map(
            snapshotProfiles.indexes.map((index) => [index.name, index]),
        );
        expect(indexesByName.get("email_unique")).toMatchObject({
            name: "email_unique",
            unique: true,
        });
        const ttlIndex = indexesByName.get("expires_at_ttl");
        expect(ttlIndex).toMatchObject({ name: "expires_at_ttl" });
        expect(Number(ttlIndex.expireAfterSeconds)).toBe(0);
        expect(indexesByName.get("active_profiles_partial")).toMatchObject({
            name: "active_profiles_partial",
            partialFilterExpression: { active: true },
        });

        await expect(
            restoreBackupSnapshot({
                db: sourceDb,
                snapshotDirectory,
                encryptionKey: ENCRYPTION_KEY,
            }),
        ).rejects.toThrow("_restore");
        expect(await readCollectionState(sourceDb, "profiles")).toEqual(
            sourceProfilesBefore,
        );

        const restoreDb = client.db(RESTORE_DATABASE);
        const restored = await restoreBackupSnapshot({
            db: restoreDb,
            snapshotDirectory,
            encryptionKey: ENCRYPTION_KEY,
            restoreStorageRoot: PRIVATE_RESTORE_ROOT,
        });
        expect(restored.targetDatabase).toBe(RESTORE_DATABASE);
        expect(await readCollectionState(restoreDb, "profiles")).toEqual(
            sourceProfilesBefore,
        );
        for (const collectionName of AI_COLLECTION_NAMES.filter(
            (name) => !["facephotos", "makeupsimulations"].includes(name),
        )) {
            expect(await readCollectionState(restoreDb, collectionName)).toEqual(
                await readCollectionState(sourceDb, collectionName),
            );
        }
        const [restoredPhoto, restoredSimulation] = await Promise.all([
            restoreDb.collection("facephotos").findOne({}),
            restoreDb.collection("makeupsimulations").findOne({}),
        ]);
        expect(restoredPhoto.storageKey).toBe(
            path.join(PRIVATE_RESTORE_ROOT, "facial-photos", "front.webp.enc"),
        );
        expect(restoredSimulation.outputStorageKey).toBe(
            path.join(
                PRIVATE_RESTORE_ROOT,
                "makeup-simulations",
                "preview.webp.enc",
            ),
        );
        await expect(readFile(restoredPhoto.storageKey)).resolves.toEqual(
            FACE_PRIVATE_BYTES,
        );
        await expect(
            readFile(restoredSimulation.outputStorageKey),
        ).resolves.toEqual(MAKEUP_PRIVATE_BYTES);
        expect(await databaseExists(SOURCE_DATABASE)).toBe(true);
        expect(await databaseExists(RESTORE_DATABASE)).toBe(true);

        const verification = await verifyBackupSnapshot({
            restoreDb,
            snapshotDirectory,
            encryptionKey: ENCRYPTION_KEY,
            restoreStorageRoot: PRIVATE_RESTORE_ROOT,
            cleanup: true,
        });

        expect(verification.status).toBe("verified");
        expect(verification.privateFiles).toEqual({ count: 2, match: true });
        expect(verification.comparisons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "profiles",
                    documentCount: 2,
                    documentsMatch: true,
                    indexesMatch: true,
                }),
                expect.objectContaining({
                    name: "empty_audit",
                    documentCount: 0,
                    documentsMatch: true,
                    indexesMatch: true,
                }),
                ...AI_COLLECTION_NAMES.map((name) =>
                    expect.objectContaining({
                        name,
                        documentCount: 1,
                        documentsMatch: true,
                        indexesMatch: true,
                    }),
                ),
            ]),
        );
        expect(await databaseExists(RESTORE_DATABASE)).toBe(false);
        expect(await databaseExists(SOURCE_DATABASE)).toBe(true);
        await expect(readFile(restoredPhoto.storageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        expect(await readCollectionState(sourceDb, "profiles")).toEqual(
            sourceProfilesBefore,
        );
    }, 120_000);

    it("mantém um único ponto temporal sob escritas concorrentes", async () => {
        const first = sourceDb.collection("consistency_a");
        const second = sourceDb.collection("consistency_b");
        await first.insertOne({ _id: "shared", revision: 1 });
        await second.insertOne({ _id: "shared", revision: 1 });
        let concurrentWriteCompleted = false;

        const manifest = await createBackupSnapshot({
            db: sourceDb,
            backupRoot: BACKUP_ROOT,
            privateStorageRoot: PRIVATE_SOURCE_ROOT,
            encryptionKey: ENCRYPTION_KEY,
            now: new Date("2026-07-10T01:00:00.000Z"),
            afterCollectionRead: async ({ collectionName }) => {
                if (
                    collectionName !== "consistency_a" ||
                    concurrentWriteCompleted
                ) {
                    return;
                }
                await Promise.all([
                    first.updateOne(
                        { _id: "shared" },
                        { $set: { revision: 2 } },
                    ),
                    second.updateOne(
                        { _id: "shared" },
                        { $set: { revision: 2 } },
                    ),
                ]);
                concurrentWriteCompleted = true;
            },
        });
        const verified = await readVerifiedBackupSnapshot({
            snapshotDirectory: path.join(BACKUP_ROOT, manifest.snapshotId),
            encryptionKey: ENCRYPTION_KEY,
        });
        const snapshotFirst = verified.payloads.find(
            ({ collectionName }) => collectionName === "consistency_a",
        );
        const snapshotSecond = verified.payloads.find(
            ({ collectionName }) => collectionName === "consistency_b",
        );

        expect(concurrentWriteCompleted).toBe(true);
        expect(Number(snapshotFirst.documents[0].revision)).toBe(1);
        expect(Number(snapshotSecond.documents[0].revision)).toBe(1);
        expect(Number((await first.findOne({ _id: "shared" })).revision)).toBe(2);
        expect(Number((await second.findOne({ _id: "shared" })).revision)).toBe(2);
    }, 120_000);

    it("recusa um ciphertext privado adulterado antes do restore", async () => {
        const manifest = await createBackupSnapshot({
            db: sourceDb,
            backupRoot: BACKUP_ROOT,
            privateStorageRoot: PRIVATE_SOURCE_ROOT,
            encryptionKey: ENCRYPTION_KEY,
            now: new Date("2026-07-10T01:30:00.000Z"),
        });
        const snapshotDirectory = path.join(BACKUP_ROOT, manifest.snapshotId);
        const target = path.join(
            snapshotDirectory,
            manifest.privateFiles[0].fileName,
        );
        const ciphertext = await readFile(target);
        ciphertext[ciphertext.length - 2] ^= 0x01;
        await writeFile(target, ciphertext);

        await expect(
            readVerifiedBackupSnapshot({
                snapshotDirectory,
                encryptionKey: ENCRYPTION_KEY,
            }),
        ).rejects.toThrow("Checksum cifrado inválido para ficheiro privado");
    }, 120_000);

    it("falha e limpa staging quando os índices mudam durante o snapshot", async () => {
        const completeBefore = await listSnapshotIds(BACKUP_ROOT);
        await expect(
            createBackupSnapshot({
                db: sourceDb,
                backupRoot: BACKUP_ROOT,
                privateStorageRoot: PRIVATE_SOURCE_ROOT,
                encryptionKey: ENCRYPTION_KEY,
                now: new Date("2026-07-10T02:00:00.000Z"),
                afterSnapshotRead: async () => {
                    await sourceDb
                        .collection("profiles")
                        .createIndex(
                            { revision: 1 },
                            { name: "revision_concurrent" },
                        );
                },
            }),
        ).rejects.toThrow("Coleções ou índices mudaram");

        expect(await listSnapshotIds(BACKUP_ROOT)).toEqual(completeBefore);
        expect(
            (await readdir(BACKUP_ROOT)).filter((name) =>
                name.startsWith(".orelle-backup-staging-"),
            ),
        ).toEqual([]);
    }, 120_000);
});
