/**
 * Migração 016: generaliza previews para visualizações cosméticas v3 e cifra
 * snapshots que anteriormente estavam apenas escondidos por `select:false`.
 */
import {
    decryptJsonForMigration,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../utils/encryption.util.js";
import { getSensitiveFieldEncryptionContext } from "../utils/contextual-encrypted-field.util.js";
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

const COLLECTION = "makeupsimulations";
const SENSITIVE_FIELDS = Object.freeze([
    "simulationSpec",
    "recommendationSnapshot",
    "feedback",
    "omittedEffects",
]);

function context(document, field) {
    return getSensitiveFieldEncryptionContext({
        collection: COLLECTION,
        owner: document.userId,
        field,
    });
}

function hasOwner(document) {
    return /^[a-f0-9]{24}$/iu.test(String(document?.userId ?? ""));
}

function needsEncryption(document, field) {
    const value = document[field];
    if (value === null || value === undefined) return false;
    if (!isContextualEncryptedPayload(value)) return true;
    try {
        decryptJsonForMigration(value, context(document, field));
        return false;
    } catch {
        return true;
    }
}

async function analyze(db, session = undefined) {
    const options = session ? { session } : {};
    const documents = await db
        .collection(COLLECTION)
        .find(
            { schemaVersion: { $gte: 2 } },
            {
                ...options,
                projection: Object.fromEntries(
                    ["userId", "schemaVersion", "visualizationKind", ...SENSITIVE_FIELDS]
                        .map((field) => [field, 1]),
                ),
            },
        )
        .toArray();
    let fieldsNeedingEncryption = 0;
    let invalidOwners = 0;
    for (const document of documents) {
        if (!hasOwner(document)) {
            invalidOwners += 1;
            continue;
        }
        fieldsNeedingEncryption += SENSITIVE_FIELDS.filter((field) =>
            needsEncryption(document, field),
        ).length;
    }
    return {
        catalog: await captureCatalogInvariant(db, session),
        documents: documents.length,
        documentsNeedingV3: documents.filter(
            ({ schemaVersion, visualizationKind }) =>
                schemaVersion !== 3 || !visualizationKind,
        ).length,
        fieldsNeedingEncryption,
        invalidOwners,
    };
}

async function up({ db, session }) {
    const before = await captureCatalogInvariant(db, session);
    const documents = await db
        .collection(COLLECTION)
        .find({ schemaVersion: { $gte: 2 } }, { session })
        .toArray();
    let encryptedFields = 0;
    let migratedDocuments = 0;

    for (const document of documents) {
        if (!hasOwner(document)) {
            throw new Error("Migração 016 encontrou visualização sem owner válido");
        }
        const set = {
            schemaVersion: 3,
            visualizationKind:
                document.visualizationKind ?? "legacy_makeup",
            intensity: document.intensity ?? "balanced",
            effectCodes: Array.isArray(document.effectCodes)
                ? document.effectCodes
                : [],
        };
        for (const field of SENSITIVE_FIELDS) {
            const value = document[field];
            if (value === null || value === undefined) continue;
            if (!needsEncryption(document, field)) continue;
            const logical = decryptJsonForMigration(value, context(document, field));
            set[field] = encryptJsonWithContext(logical, context(document, field));
            encryptedFields += 1;
        }
        const result = await db.collection(COLLECTION).updateOne(
            { _id: document._id, userId: document.userId },
            { $set: set },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Migração 016 perdeu CAS numa visualização");
        }
        migratedDocuments += result.modifiedCount;
    }
    const after = await captureCatalogInvariant(db, session);
    assertCatalogInvariantEqual(before, after);
    return { migratedDocuments, encryptedFields, catalogPreserved: true };
}

async function finalize({ db }) {
    await db.collection(COLLECTION).createIndex(
        { visualizationKind: 1, userId: 1, createdAt: -1 },
        { name: "visualizationKind_1_userId_1_createdAt_-1" },
    );
    return { indexesReconciled: 1 };
}

async function validate({ db }) {
    const inspection = await analyze(db);
    if (
        inspection.documentsNeedingV3 > 0 ||
        inspection.fieldsNeedingEncryption > 0 ||
        inspection.invalidOwners > 0
    ) {
        throw new Error("Migração 016 deixou visualizações fora do contrato v3");
    }
    return inspection;
}

export const migration016CosmeticVisualizationV3 = Object.freeze({
    version: "016_cosmetic_visualization_v3",
    description:
        "Generaliza previews cosméticos, cifra snapshots e preserva outputs legacy",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});

