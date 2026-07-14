/**
 * Prova persistente da migration 009 num replica set e filesystem efémeros.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";
import { migration009PrivacyBarriersAndFaceFileEncryption } from "../src/migrations/009_privacy_barriers_and_face_file_encryption.js";
import {
    dryRunMigrations,
    MIGRATION_COLLECTION,
    MIGRATION_LOCK_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";
import {
    decryptBufferWithContext,
    decryptJsonWithContext,
    encryptBuffer,
} from "../src/utils/encryption.util.js";
import { buildFacePhotoEncryptionContext } from "../src/services/face-secure-storage.service.js";

const DATABASE_NAME = "orelle_migration_009_test";
let replicaSet;
let client;
let db;
let storageDirectory;

const migration = Object.freeze({
    ...migration009PrivacyBarriersAndFaceFileEncryption,
    sourcePath: fileURLToPath(
        new URL(
            "../src/migrations/009_privacy_barriers_and_face_file_encryption.js",
            import.meta.url,
        ),
    ),
});

function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("Migration 009 recusou URI não efémera");
    }
}

async function seedLegacyPhoto({ userId, label, persistFile = true }) {
    const photoId = new ObjectId();
    const storageKey = path.join(storageDirectory, `${label}.webp.enc`);
    const plainBytes = Buffer.from(`private-face-bytes-${label}`);
    const encrypted = encryptBuffer(plainBytes);
    if (persistFile) {
        await writeFile(storageKey, Buffer.from(encrypted.ciphertext, "base64"), {
            mode: 0o600,
        });
    }
    await db.collection("facephotos").insertOne({
        _id: photoId,
        userId,
        kind: "frontal",
        storageKey,
        encryption: {
            algorithm: encrypted.algorithm,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
        },
        originalName: `${label}-identifying-name.png`,
        mimeType: "image/webp",
        sizeBytes: plainBytes.length,
        consentId: new ObjectId(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return { photoId, storageKey, plainBytes, encrypted };
}

async function seedCanonicalScenario() {
    const normalUserId = new ObjectId();
    const revokedUserId = new ObjectId();
    const privacyUserId = new ObjectId();
    const deletedUserId = new ObjectId();
    await db.collection("users").insertMany([
        { _id: normalUserId, accountStatus: "active", isActive: true },
        { _id: revokedUserId, accountStatus: "active", isActive: true },
        { _id: privacyUserId, accountStatus: "active", isActive: true },
        {
            _id: deletedUserId,
            accountStatus: "deleted",
            isActive: true,
            deletedAt: new Date("2026-07-01T10:00:00.000Z"),
        },
    ]);
    const revokedAt = new Date("2026-07-02T10:00:00.000Z");
    await db.collection("faceconsents").insertOne({
        _id: new ObjectId(),
        userId: revokedUserId,
        revokedAt,
    });
    await db.collection("biometricdatarequests").insertOne({
        _id: new ObjectId(),
        requesterId: privacyUserId,
        resources: ["photos"],
        status: "failed",
        reason: "motivo pessoal legacy",
        decisionReason: "nota administrativa legacy",
        createdAt: new Date("2026-07-03T10:00:00.000Z"),
    });

    const reportOwnerId = new ObjectId();
    const analysisId = new ObjectId();
    const olderReportId = new ObjectId();
    const newerReportId = new ObjectId();
    await db.collection("facereports").insertMany([
        {
            _id: olderReportId,
            userId: reportOwnerId,
            analysisId,
            createdAt: new Date("2026-06-01T10:00:00.000Z"),
            updatedAt: new Date("2026-06-01T10:00:00.000Z"),
        },
        {
            _id: newerReportId,
            userId: reportOwnerId,
            analysisId,
            createdAt: new Date("2026-06-02T10:00:00.000Z"),
            updatedAt: new Date("2026-06-02T10:00:00.000Z"),
        },
    ]);
    await db.collection("reportunlocks").insertOne({
        _id: new ObjectId(),
        reportId: olderReportId,
        userId: reportOwnerId,
        analysisId,
    });

    const guidedUserId = new ObjectId();
    await db.collection("aiconsultationsessions").insertMany([
        {
            _id: new ObjectId(),
            userId: guidedUserId,
            status: "draft",
            updatedAt: new Date("2026-06-01T10:00:00.000Z"),
        },
        {
            _id: new ObjectId(),
            userId: guidedUserId,
            status: "draft",
            updatedAt: new Date("2026-06-02T10:00:00.000Z"),
        },
    ]);
    const photo = await seedLegacyPhoto({
        userId: normalUserId,
        label: "canonical",
    });
    return {
        normalUserId,
        revokedUserId,
        privacyUserId,
        deletedUserId,
        revokedAt,
        newerReportId,
        guidedUserId,
        photo,
    };
}

describe("migration 009 - barriers e ficheiros faciais", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralUri(uri);
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), "orelle-migration-009-"),
        );
    }, 120_000);

    afterEach(async () => {
        await db.dropDatabase();
        await rm(storageDirectory, { recursive: true, force: true });
        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), "orelle-migration-009-"),
        );
    });

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
        await rm(storageDirectory, { recursive: true, force: true });
    }, 60_000);

    it("faz dry-run, recifra, consolida e reproduz sem nova escrita", async () => {
        const fixture = await seedCanonicalScenario();
        const dryRun = await dryRunMigrations({ db, migrations: [migration] });
        expect(dryRun).toEqual([
            expect.objectContaining({
                version: migration.version,
                state: "pending",
                analysis: expect.objectContaining({
                    legacyFacePhotoFiles: 1,
                    duplicateFaceReports: 1,
                    duplicateGuidedDrafts: 1,
                    privacyReasonFieldsNeedingEncryption: 2,
                }),
            }),
        ]);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
        await expect(readFile(fixture.photo.storageKey)).resolves.toBeInstanceOf(
            Buffer,
        );

        const [applied] = await runMigrations({
            client,
            db,
            migrations: [migration],
        });
        expect(applied).toMatchObject({
            version: migration.version,
            state: "applied",
            changes: expect.objectContaining({
                duplicateReportsRemoved: 1,
                duplicateDraftsRemoved: 1,
                unlockReferencesMoved: 1,
                facePhotoFilesReciphered: 1,
                legacyFilesRemoved: 1,
            }),
        });

        const normalUser = await db.collection("users").findOne({
            _id: fixture.normalUserId,
        });
        const revokedUser = await db.collection("users").findOne({
            _id: fixture.revokedUserId,
        });
        const privacyUser = await db.collection("users").findOne({
            _id: fixture.privacyUserId,
        });
        const deletedUser = await db.collection("users").findOne({
            _id: fixture.deletedUserId,
        });
        expect(normalUser).toMatchObject({
            faceDataGeneration: 0,
            faceProcessingBlockedAt: null,
            faceProcessingBlockReason: null,
        });
        expect(revokedUser.faceProcessingBlockReason).toBe("consent_revoked");
        expect(revokedUser.faceProcessingBlockedAt).toEqual(fixture.revokedAt);
        expect(privacyUser.faceProcessingBlockReason).toBe("privacy_request");
        expect(deletedUser).toMatchObject({
            isActive: false,
            faceProcessingBlockReason: "account_deleted",
        });
        const encryptedRequest = await db
            .collection("biometricdatarequests")
            .findOne({ requesterId: fixture.privacyUserId });
        expect(JSON.stringify(encryptedRequest)).not.toContain(
            "motivo pessoal legacy",
        );
        expect(JSON.stringify(encryptedRequest)).not.toContain(
            "nota administrativa legacy",
        );
        expect(
            decryptJsonWithContext(encryptedRequest.reason, {
                collection: "biometricdatarequests",
                owner: fixture.privacyUserId,
                field: "reason",
            }),
        ).toBe("motivo pessoal legacy");
        expect(
            decryptJsonWithContext(encryptedRequest.decisionReason, {
                collection: "biometricdatarequests",
                owner: fixture.privacyUserId,
                field: "decisionReason",
            }),
        ).toBe("nota administrativa legacy");

        expect(
            await db.collection("facereports").countDocuments({
                userId: fixture.newerReportId,
            }),
        ).toBe(0);
        expect(await db.collection("facereports").countDocuments({})).toBe(1);
        expect(
            (await db.collection("reportunlocks").findOne({})).reportId,
        ).toEqual(fixture.newerReportId);
        expect(
            await db.collection("aiconsultationsessions").countDocuments({
                userId: fixture.guidedUserId,
                status: "draft",
            }),
        ).toBe(1);

        const migratedPhoto = await db.collection("facephotos").findOne({
            _id: fixture.photo.photoId,
        });
        expect(migratedPhoto.encryption).toMatchObject({
            keyVersion: 2,
            aadHash: expect.any(String),
        });
        expect(migratedPhoto.originalName).toBe("frontal.webp");
        expect(migratedPhoto.storageKey).not.toBe(fixture.photo.storageKey);
        await expect(readFile(fixture.photo.storageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        const ciphertext = await readFile(migratedPhoto.storageKey);
        const bytes = decryptBufferWithContext(
            {
                encrypted: true,
                ...migratedPhoto.encryption,
                ciphertext: ciphertext.toString("base64"),
            },
            buildFacePhotoEncryptionContext({
                userId: migratedPhoto.userId,
                photoId: migratedPhoto._id,
                kind: migratedPhoto.kind,
            }),
        );
        expect(bytes).toEqual(fixture.photo.plainBytes);
        expect(
            await db.collection("filedeletionjobs").countDocuments({
                sourceType: "migration_009_face_photo",
                status: "completed",
                ownerId: { $exists: false },
                storageKey: { $exists: false },
            }),
        ).toBe(1);

        const [replay] = await runMigrations({
            client,
            db,
            migrations: [migration],
        });
        expect(replay).toMatchObject({
            version: migration.version,
            state: "skipped",
        });
        expect(await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments()).toBe(0);
    }, 30_000);

    it("não regista a versão quando falta o ficheiro e retoma depois", async () => {
        const userId = new ObjectId();
        await db.collection("users").insertOne({
            _id: userId,
            accountStatus: "active",
            isActive: true,
        });
        const fixture = await seedLegacyPhoto({
            userId,
            label: "resume",
            persistFile: false,
        });

        await expect(
            runMigrations({ client, db, migrations: [migration] }),
        ).rejects.toMatchObject({ code: "ENOENT" });
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
        expect(await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments()).toBe(0);
        expect((await db.collection("users").findOne({ _id: userId })).faceDataGeneration).toBe(0);

        await writeFile(
            fixture.storageKey,
            Buffer.from(fixture.encrypted.ciphertext, "base64"),
            { mode: 0o600 },
        );
        const [retried] = await runMigrations({
            client,
            db,
            migrations: [migration],
        });
        expect(retried.state).toBe("applied");
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(1);
        const migrated = await db.collection("facephotos").findOne({
            _id: fixture.photoId,
        });
        expect(migrated.encryption.keyVersion).toBe(2);
    }, 30_000);
});
