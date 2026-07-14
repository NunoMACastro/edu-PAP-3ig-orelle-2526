/**
 * Prova real da migração 005 num MongoDB replica set efémero loopback.
 * O dump cru é inspecionado para garantir ausência de plaintext sensível.
 */
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migration005SensitiveEncryptionV2 } from "../src/migrations/005_sensitive_encryption_v2.js";
import { migration006AiMachineHumanSplit } from "../src/migrations/006_ai_machine_human_split.js";
import {
    decryptJsonWithContext,
    encryptJson,
    isContextualEncryptedPayload,
} from "../src/utils/encryption.util.js";
import { SENSITIVE_FIELD_ENCRYPTION_SPECS } from "../src/utils/contextual-encrypted-field.util.js";
import {
    dryRunMigrations,
    MIGRATION_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";

const DATABASE_NAME = "orelle_sensitive_encryption_test";
const MARKERS = Object.freeze([
    "fixture-finding-private",
    "fixture-allergy-private",
    "fixture-guided-private",
    "fixture-note-private",
    "fixture-override-private",
    "fixture-history-private",
]);
const migration005 = Object.freeze({
    ...migration005SensitiveEncryptionV2,
    sourcePath: fileURLToPath(
        new URL("../src/migrations/005_sensitive_encryption_v2.js", import.meta.url),
    ),
});
const migration006 = Object.freeze({
    ...migration006AiMachineHumanSplit,
    sourcePath: fileURLToPath(
        new URL("../src/migrations/006_ai_machine_human_split.js", import.meta.url),
    ),
});

let replicaSet;
let client;
let db;
let owner;

function assertNoSensitivePlaintext(value) {
    const serialized = JSON.stringify(value);
    for (const marker of MARKERS) expect(serialized).not.toContain(marker);
}

async function seedAllSensitiveCollections(targetDb) {
    owner = new ObjectId();
    const common = { userId: owner, createdAt: new Date(), updatedAt: new Date() };
    await targetDb.collection("faceanalyses").insertOne({
        ...common,
        findings: { skinType: { label: MARKERS[0], confidence: 0.8 } },
    });
    await targetDb.collection("facereports").insertOne({
        ...common,
        cosmeticSummary: encryptJson({ summary: MARKERS[0] }),
        routineSuggestions: [{ reason: MARKERS[0] }],
        sources: [MARKERS[0]],
        limitations: [MARKERS[0]],
    });
    await targetDb.collection("profiles").insertOne({
        ...common,
        allergies: [MARKERS[1]],
        avoidIngredients: [MARKERS[1]],
        lightMedicalRestrictions: [MARKERS[1]],
    });
    await targetDb.collection("aiconsultationsessions").insertOne({
        ...common,
        answers: [{ questionId: "notes", type: "text", value: MARKERS[2] }],
    });
    await targetDb.collection("productrecommendations").insertOne({
        ...common,
        consultantNote: MARKERS[3],
        humanOverride: { decision: "adjusted", note: MARKERS[4] },
    });
    await targetDb.collection("aiconsultationreviews").insertOne({
        ...common,
        publicInsight: { note: MARKERS[3], publishedAt: new Date() },
        internalNote: MARKERS[3],
        humanOverride: { decision: "approved", internalNote: MARKERS[4] },
    });
    await targetDb.collection("aiinteractionhistories").insertOne({
        ...common,
        sessionId: new ObjectId(),
        eventType: "consultation_submitted",
        purpose: "Contexto cosmético minimizado.",
        safeSummary: encryptJson(MARKERS[5]),
        safeSignals: [{ key: "main_goal", label: "Objetivo", value: MARKERS[5] }],
        source: "guided_consultation",
    });
}

async function readSensitiveDump(targetDb) {
    const dump = {};
    for (const spec of SENSITIVE_FIELD_ENCRYPTION_SPECS) {
        dump[spec.collection] = await targetDb.collection(spec.collection).find({}).toArray();
    }
    return dump;
}

describe("migration 005 sensitive encryption v2", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI da migration 005 não é loopback efémera");
        }
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
        await seedAllSensitiveCollections(db);
    }, 120_000);

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("faz dry-run sanitizado sem qualquer escrita", async () => {
        const before = await readSensitiveDump(db);
        const dryRun = await dryRunMigrations({ db, migrations: [migration005] });

        expect(dryRun[0]).toMatchObject({
            state: "pending",
            analysis: {
                documentsNeedingEncryption: 7,
                fieldsNeedingEncryption: 16,
                plaintextFields: 14,
                legacyV1Fields: 2,
                invalidOwnerDocuments: 0,
                invalidEncryptedFields: 0,
            },
        });
        expect(await readSensitiveDump(db)).toEqual(before);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
    });

    it("converte plaintext/v1, autentica AAD e é idempotente", async () => {
        const result = await runMigrations({
            client,
            db,
            migrations: [migration005],
            ownerId: "sensitive-v2-owner",
        });
        expect(result[0]).toMatchObject({
            state: "applied",
            changes: { documentsUpdated: 7, fieldsEncrypted: 16 },
        });

        const dump = await readSensitiveDump(db);
        assertNoSensitivePlaintext(dump);
        for (const spec of SENSITIVE_FIELD_ENCRYPTION_SPECS) {
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

        expect(
            await runMigrations({
                client,
                db,
                migrations: [migration005],
                ownerId: "sensitive-v2-replay",
            }),
        ).toEqual([{ version: migration005.version, state: "skipped" }]);
    });

    it("prova a ordem 005 seguida de 006 sem reintroduzir plaintext", async () => {
        const orderedDb = client.db(`${DATABASE_NAME}_ordered`);
        const userId = new ObjectId();
        const reviewerId = new ObjectId();
        const recommendationId = new ObjectId();
        const consultationSessionId = new ObjectId();
        const now = new Date();
        await orderedDb.collection("productrecommendations").insertOne({
            _id: recommendationId,
            userId,
            analysisId: new ObjectId(),
            reportId: new ObjectId(),
            productId: new ObjectId(),
            score: 0.8,
            reasonCodes: ["skin_type_match"],
            explanation: "Legacy recommendation explanation.",
            sourceSignals: ["skinType:mista"],
            limitations: ["Academic fixture."],
            consultantNote: MARKERS[3],
            status: "adjusted",
            createdAt: now,
            updatedAt: now,
        });
        await orderedDb.collection("aiconsultationreviews").insertOne({
            userId,
            consultationSessionId,
            recommendationIds: [recommendationId],
            status: "approved",
            summary: "Legacy review summary long enough.",
            sourceLabels: [],
            limitations: [],
            publicInsight: { note: MARKERS[3], publishedAt: now },
            internalNote: MARKERS[3],
            reviewedBy: reviewerId,
            reviewedAt: now,
            auditTrail: [
                {
                    actorId: reviewerId,
                    actorRole: "consultor",
                    action: "approved",
                    occurredAt: now,
                },
            ],
            createdAt: now,
            updatedAt: now,
        });

        await runMigrations({
            client,
            db: orderedDb,
            migrations: [migration005, migration006],
            ownerId: "ordered-sensitive-ai-owner",
        });
        const orderedDump = await readSensitiveDump(orderedDb);
        assertNoSensitivePlaintext(orderedDump);
        await expect(
            migration005SensitiveEncryptionV2.validate({ db: orderedDb }),
        ).resolves.toMatchObject({
            fieldsNeedingEncryption: 0,
            invalidEncryptedFields: 0,
        });
    });
});
