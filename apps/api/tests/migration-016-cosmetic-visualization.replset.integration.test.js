/** Integração da migração 016 com cifra contextual e catálogo imutável. */
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MIGRATIONS } from "../src/migrations/index.js";
import {
    calculateMigrationChecksum,
    dryRunMigrations,
    runMigrations,
} from "../src/migrations/migration-runner.js";
import { captureCatalogInvariant } from "../src/migrations/catalog-invariant.js";
import {
    decryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../src/utils/encryption.util.js";
import { getSensitiveFieldEncryptionContext } from "../src/utils/contextual-encrypted-field.util.js";

const DATABASE_NAME = "orelle_migration_016_test";
const MIGRATION = MIGRATIONS.find(
    ({ version }) => version === "016_cosmetic_visualization_v3",
);
let replicaSet;
let client;
let db;

function context(userId, field) {
    return getSensitiveFieldEncryptionContext({
        collection: "makeupsimulations",
        owner: userId,
        field,
    });
}

async function seed() {
    const userId = new ObjectId();
    const simulationId = new ObjectId();
    const productId = new ObjectId();
    const createdAt = new Date("2026-07-13T10:00:00.000Z");
    await db.collection("products").insertOne({
        _id: productId,
        name: "Produto preservado",
        priceCents: 1_999,
        stock: 4,
        variants: [
            { variantId: "rose", priceCents: 1_999, stock: 4 },
        ],
        createdAt,
        updatedAt: createdAt,
    });
    await db.collection("makeupsimulations").insertOne({
        _id: simulationId,
        schemaVersion: 2,
        userId,
        reportId: new ObjectId(),
        facePhotoId: new ObjectId(),
        consentId: new ObjectId(),
        status: "completed",
        simulationSpec: {
            enabled: true,
            regions: ["lips"],
            preserve: ["identity"],
        },
        recommendationSnapshot: [
            { productId: productId.toString(), variantId: "rose" },
        ],
        omittedEffects: ["legacy_omission"],
        feedback: { value: "fiel", reasons: [] },
        outputStorageKey: "/private/legacy-output.webp.enc",
        outputMimeType: "image/webp",
        outputSizeBytes: 1_234,
        expiresAt: new Date("2026-07-20T10:00:00.000Z"),
        generativeConsent: {
            noticeVersion: "generative-makeup-preview-v1",
            acceptedAt: createdAt,
            revokedAt: null,
        },
        createdAt,
        updatedAt: createdAt,
    });
    return { userId, simulationId };
}

describe("016_cosmetic_visualization_v3", () => {
    beforeAll(async () => {
        expect(MIGRATION).toBeTruthy();
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("Migração 016 recusou URI não efémera");
        }
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
    }, 120_000);

    afterEach(async () => {
        await db.dropDatabase();
    });

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("tem checksum estável e dry-run sem qualquer escrita", async () => {
        await seed();
        const before = await db.collection("makeupsimulations").find({}).toArray();
        const checksum = await calculateMigrationChecksum(MIGRATION);
        const dryRun = await dryRunMigrations({ db, migrations: [MIGRATION] });
        const after = await db.collection("makeupsimulations").find({}).toArray();

        expect(checksum).toMatch(/^[a-f0-9]{64}$/u);
        expect(dryRun).toEqual([
            expect.objectContaining({
                version: MIGRATION.version,
                state: "pending",
                analysis: expect.objectContaining({
                    documents: 1,
                    documentsNeedingV3: 1,
                    fieldsNeedingEncryption: 4,
                    invalidOwners: 0,
                }),
            }),
        ]);
        expect(after).toEqual(before);
    });

    it("aplica, valida, preserva output/catálogo e repete sem alterações", async () => {
        const { userId, simulationId } = await seed();
        const catalogBefore = await captureCatalogInvariant(db);
        const applied = await runMigrations({
            client,
            db,
            migrations: [MIGRATION],
            ownerId: "migration-016-apply",
        });
        expect(applied).toEqual([
            expect.objectContaining({
                version: MIGRATION.version,
                state: "applied",
                changes: expect.objectContaining({
                    migratedDocuments: 1,
                    encryptedFields: 4,
                    catalogPreserved: true,
                }),
                validation: expect.objectContaining({
                    documentsNeedingV3: 0,
                    fieldsNeedingEncryption: 0,
                }),
            }),
        ]);
        const migrated = await db
            .collection("makeupsimulations")
            .findOne({ _id: simulationId });
        expect(migrated).toMatchObject({
            schemaVersion: 3,
            visualizationKind: "legacy_makeup",
            intensity: "balanced",
            effectCodes: [],
            outputStorageKey: "/private/legacy-output.webp.enc",
            outputMimeType: "image/webp",
            outputSizeBytes: 1_234,
        });
        for (const field of [
            "simulationSpec",
            "recommendationSnapshot",
            "omittedEffects",
            "feedback",
        ]) {
            expect(isContextualEncryptedPayload(migrated[field])).toBe(true);
        }
        expect(
            decryptJsonWithContext(
                migrated.simulationSpec,
                context(userId, "simulationSpec"),
            ),
        ).toMatchObject({ enabled: true, regions: ["lips"] });
        expect(await captureCatalogInvariant(db)).toEqual(catalogBefore);

        const snapshot = await db
            .collection("makeupsimulations")
            .findOne({ _id: simulationId });
        const replay = await runMigrations({
            client,
            db,
            migrations: [MIGRATION],
            ownerId: "migration-016-replay",
        });
        expect(replay).toEqual([
            { version: MIGRATION.version, state: "skipped" },
        ]);
        expect(
            await db.collection("makeupsimulations").findOne({ _id: simulationId }),
        ).toEqual(snapshot);
    });
});
