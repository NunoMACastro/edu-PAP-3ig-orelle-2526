/**
 * Prova replica-set da migração 008 para dados sensíveis derivados.
 *
 * O teste usa exclusivamente MongoDB efémero loopback, inspeciona as coleções
 * cruas e nunca imprime owners, conteúdo cifrado ou chaves.
 */
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migration008SensitiveDerivativesEncryption } from "../src/migrations/008_sensitive_derivatives_encryption.js";
import {
    dryRunMigrations,
    MIGRATION_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";
import {
    decryptJsonWithContext,
    encryptJson,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../src/utils/encryption.util.js";
import { SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS } from "../src/utils/contextual-encrypted-field.util.js";

const DATABASE_NAME = "orelle_sensitive_derivatives_test";
const PRIVATE_MARKER = "derived-private-marker";
const migration008 = Object.freeze({
    ...migration008SensitiveDerivativesEncryption,
    sourcePath: fileURLToPath(
        new URL(
            "../src/migrations/008_sensitive_derivatives_encryption.js",
            import.meta.url,
        ),
    ),
});

let replicaSet;
let client;
let db;
let ownerId;
let recommendationId;
let sanitizedRecommendationId;
let sanitizedReviewId;

/** Lê apenas as coleções pertencentes ao contrato 008. */
async function readRawDump(targetDb) {
    const dump = {};
    for (const spec of SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS) {
        dump[spec.collection] = await targetDb
            .collection(spec.collection)
            .find({})
            .toArray();
    }
    return dump;
}

/** Semeia um documento por coleção com os dezasseis campos do contrato. */
async function seedLegacyDerivatives(targetDb) {
    ownerId = new ObjectId();
    recommendationId = new ObjectId();
    sanitizedRecommendationId = new ObjectId();
    sanitizedReviewId = new ObjectId();
    const reviewerId = new ObjectId();
    const common = {
        userId: ownerId,
        createdAt: new Date("2026-07-10T12:00:00.000Z"),
        updatedAt: new Date("2026-07-10T12:00:00.000Z"),
    };

    await targetDb.collection("faceanalyses").insertOne({
        ...common,
        sources: [`source:${PRIVATE_MARKER}`],
        limitations: encryptJson([`legacy:${PRIVATE_MARKER}`]),
    });
    await targetDb.collection("productrecommendations").insertOne({
        _id: recommendationId,
        ...common,
        reasonCodes: [`reason:${PRIVATE_MARKER}`],
        explanation: `Explanation ${PRIVATE_MARKER}`,
        sourceSignals: [`skinType:${PRIVATE_MARKER}`],
        limitations: [`restriction:${PRIVATE_MARKER}`],
        machineResult: {
            score: 0.8,
            explanation: `Machine ${PRIVATE_MARKER}`,
            sourceSignals: [`skinType:${PRIVATE_MARKER}`],
            generatedAt: new Date("2026-07-10T12:00:00.000Z"),
        },
    });
    await targetDb.collection("productrecommendations").insertOne({
        _id: sanitizedRecommendationId,
        ...common,
        humanOverride: encryptJsonWithContext(
            {
                decision: "approved",
                reviewerId,
                reviewId: new ObjectId(),
                reviewedAt: new Date("2026-07-10T12:00:00.000Z"),
            },
            {
                collection: "productrecommendations",
                owner: ownerId,
                field: "humanOverride",
            },
        ),
    });
    await targetDb.collection("aiconsultationreviews").insertOne({
        ...common,
        summary: `Summary ${PRIVATE_MARKER}`,
        sourceLabels: [`label:${PRIVATE_MARKER}`],
        limitations: [`limitation:${PRIVATE_MARKER}`],
        machineResult: {
            summary: `Review machine ${PRIVATE_MARKER}`,
            generatedAt: new Date("2026-07-10T12:00:00.000Z"),
        },
    });
    await targetDb.collection("aiconsultationreviews").insertOne({
        _id: sanitizedReviewId,
        ...common,
        humanOverride: encryptJsonWithContext(
            {
                decision: "approved",
                reviewerId,
                reviewId: new ObjectId(),
                reviewedAt: new Date("2026-07-10T12:00:00.000Z"),
            },
            {
                collection: "aiconsultationreviews",
                owner: ownerId,
                field: "humanOverride",
            },
        ),
    });
    await targetDb.collection("recommendationreviews").insertOne({
        clientUserId: ownerId,
        recommendationId,
        consultantId: new ObjectId(),
        status: "adjusted",
        note: `Note ${PRIVATE_MARKER}`,
        adjustedExplanation: `Adjusted ${PRIVATE_MARKER}`,
        createdAt: new Date("2026-07-10T12:01:00.000Z"),
        updatedAt: new Date("2026-07-10T12:01:00.000Z"),
    });
    await targetDb.collection("skincomparisons").insertOne({
        ...common,
        metricDeltas: [
            {
                metric: "Oleosidade",
                baselineValue: PRIVATE_MARKER,
                followUpValue: "moderada",
                changeLabel: `Changed ${PRIVATE_MARKER}`,
            },
        ],
        summary: `Comparison ${PRIVATE_MARKER}`,
        limitations: [`comparison:${PRIVATE_MARKER}`],
    });
}

describe("migration 008 sensitive derivatives encryption", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI da migration 008 não é loopback efémera");
        }
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
        await seedLegacyDerivatives(db);
    }, 120_000);

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("faz dry-run sanitizado sem escrever", async () => {
        const before = await readRawDump(db);
        const dryRun = await dryRunMigrations({
            db,
            migrations: [migration008],
        });

        expect(dryRun[0]).toMatchObject({
            state: "pending",
            analysis: {
                documentsNeedingEncryption: 5,
                fieldsNeedingEncryption: 16,
                plaintextFields: 15,
                legacyV1Fields: 1,
                invalidOwnerDocuments: 0,
                invalidEncryptedFields: 0,
                reviewsNeedingOverride: 1,
                orphanReviews: 0,
                ownershipMismatchReviews: 0,
                humanOverridesNeedingSanitization: 2,
                invalidHumanOverrideOwners: 0,
                invalidHumanOverrides: 0,
            },
        });
        expect(await readRawDump(db)).toEqual(before);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
    });

    it("cifra todos os derivados, autentica AAD e faz replay idempotente", async () => {
        const result = await runMigrations({
            client,
            db,
            migrations: [migration008],
            ownerId: "sensitive-derivatives-owner",
        });
        expect(result[0]).toMatchObject({
            state: "applied",
            changes: {
                documentsUpdated: 5,
                fieldsEncrypted: 16,
                legacyOverridesBackfilled: 1,
                humanOverridesSanitized: 2,
            },
        });

        const dump = await readRawDump(db);
        expect(JSON.stringify(dump)).not.toContain(PRIVATE_MARKER);
        for (const spec of SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS) {
            for (const document of dump[spec.collection]) {
                for (const field of spec.fields) {
                    if (document[field] === null || document[field] === undefined) continue;
                    expect(isContextualEncryptedPayload(document[field])).toBe(true);
                    expect(() =>
                        decryptJsonWithContext(document[field], {
                            collection: spec.collection,
                            owner: document[spec.ownerField],
                            field,
                        }),
                    ).not.toThrow();
                }
            }
        }

        const rawRecommendation = dump.productrecommendations.find(
            ({ _id }) => _id.equals(recommendationId),
        );
        expect(isContextualEncryptedPayload(rawRecommendation.humanOverride)).toBe(
            true,
        );
        expect(
            decryptJsonWithContext(rawRecommendation.humanOverride, {
                collection: "productrecommendations",
                owner: ownerId,
                field: "humanOverride",
            }),
        ).toMatchObject({
            decision: "adjusted",
            note: `Note ${PRIVATE_MARKER}`,
            adjustedExplanation: `Adjusted ${PRIVATE_MARKER}`,
        });
        expect(() =>
            decryptJsonWithContext(rawRecommendation.sourceSignals, {
                collection: "productrecommendations",
                owner: ownerId,
                field: "limitations",
            }),
        ).toThrow("Conteúdo contextual encriptado inválido");

        for (const [collection, documentId] of [
            ["productrecommendations", sanitizedRecommendationId],
            ["aiconsultationreviews", sanitizedReviewId],
        ]) {
            const document = dump[collection].find(({ _id }) =>
                _id.equals(documentId),
            );
            const logicalOverride = decryptJsonWithContext(
                document.humanOverride,
                {
                    collection,
                    owner: ownerId,
                    field: "humanOverride",
                },
            );
            expect(logicalOverride).toMatchObject({
                decision: "approved",
                reviewId: expect.any(String),
                reviewedAt: expect.any(Date),
            });
            expect(logicalOverride).not.toHaveProperty("reviewerId");
        }
        expect(() =>
            decryptJsonWithContext(rawRecommendation.sourceSignals, {
                collection: "productrecommendations",
                owner: new ObjectId(),
                field: "sourceSignals",
            }),
        ).toThrow("Conteúdo contextual encriptado inválido");

        await expect(
            runMigrations({
                client,
                db,
                migrations: [migration008],
                ownerId: "sensitive-derivatives-replay",
            }),
        ).resolves.toEqual([
            { version: migration008.version, state: "skipped" },
        ]);
    });
});
