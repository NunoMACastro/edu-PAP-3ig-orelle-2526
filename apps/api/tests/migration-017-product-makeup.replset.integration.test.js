/** Integração da migração 017 com metadata explícita e catálogo comercial imutável. */
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

const DATABASE_NAME = "orelle_migration_017_test";
const MIGRATION = MIGRATIONS.find(
    ({ version }) => version === "017_product_makeup_semantics_v3",
);
let replicaSet;
let client;
let db;

async function seed() {
    const createdAt = new Date("2026-07-14T10:00:00.000Z");
    const foundationId = new ObjectId();
    const lipstickId = new ObjectId();
    await db.collection("products").insertMany([
        {
            _id: foundationId,
            name: "Base cujo nome não pode ser inferido",
            priceCents: 2_499,
            stock: 3,
            variants: [
                {
                    variantId: "neutral",
                    label: "Neutral",
                    colorHex: "#B88768",
                    finish: "natural",
                    coverage: "medium",
                    priceCents: 2_499,
                    stock: 3,
                },
            ],
            createdAt,
            updatedAt: createdAt,
        },
        {
            _id: lipstickId,
            schemaVersion: 2,
            name: "Batom com função já curada",
            priceCents: 1_399,
            stock: 2,
            variants: [
                {
                    variantId: "rose",
                    label: "Rose",
                    colorHex: "#A94F65",
                    finish: "satin",
                    coverage: "medium",
                    priceCents: 1_399,
                    stock: 2,
                },
            ],
            makeup: { functions: ["lipstick"] },
            createdAt,
            updatedAt: createdAt,
        },
    ]);
    return { foundationId, lipstickId };
}

describe("017_product_makeup_semantics_v3", () => {
    beforeAll(async () => {
        expect(MIGRATION).toBeTruthy();
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("Migração 017 recusou URI não efémera");
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

    it("tem checksum estável e dry-run sem escritas", async () => {
        await seed();
        const before = await db.collection("products").find({}).toArray();
        expect(await calculateMigrationChecksum(MIGRATION)).toMatch(
            /^[a-f0-9]{64}$/u,
        );
        expect(
            await dryRunMigrations({ db, migrations: [MIGRATION] }),
        ).toEqual([
            expect.objectContaining({
                version: MIGRATION.version,
                state: "pending",
                analysis: expect.objectContaining({
                    documents: 2,
                    documentsNeedingV3: 2,
                }),
            }),
        ]);
        expect(await db.collection("products").find({}).toArray()).toEqual(before);
    });

    it("aplica sem inferir funções nem alterar preços, variantes ou stock", async () => {
        const { foundationId, lipstickId } = await seed();
        const catalogBefore = await captureCatalogInvariant(db, undefined, {
            includeCommercial: true,
        });
        const applied = await runMigrations({
            client,
            db,
            migrations: [MIGRATION],
            ownerId: "migration-017-apply",
        });
        expect(applied).toEqual([
            expect.objectContaining({
                version: MIGRATION.version,
                state: "applied",
                changes: expect.objectContaining({
                    migratedDocuments: 2,
                    catalogPreserved: true,
                }),
                validation: expect.objectContaining({
                    documentsNeedingV3: 0,
                }),
            }),
        ]);

        const foundation = await db.collection("products").findOne({
            _id: foundationId,
        });
        const lipstick = await db.collection("products").findOne({ _id: lipstickId });
        expect(foundation).toMatchObject({
            schemaVersion: 3,
            makeup: {
                functions: [],
                regions: [],
                applicationAreas: [],
                styleTags: [],
                wearProfiles: [],
            },
        });
        expect(lipstick).toMatchObject({
            schemaVersion: 3,
            makeup: {
                functions: ["lipstick"],
                regions: [],
                applicationAreas: [],
                styleTags: [],
                wearProfiles: [],
            },
        });
        expect(
            await captureCatalogInvariant(db, undefined, {
                includeCommercial: true,
            }),
        ).toEqual(catalogBefore);

        const snapshot = await db.collection("products").find({}).toArray();
        expect(
            await runMigrations({
                client,
                db,
                migrations: [MIGRATION],
                ownerId: "migration-017-replay",
            }),
        ).toEqual([{ version: MIGRATION.version, state: "skipped" }]);
        expect(await db.collection("products").find({}).toArray()).toEqual(snapshot);
    });
});
