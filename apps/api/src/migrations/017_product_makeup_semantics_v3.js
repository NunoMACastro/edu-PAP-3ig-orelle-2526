/**
 * Migração 017: prepara produtos existentes para a metadata semântica de
 * maquilhagem v3 sem inferir funções a partir do nome ou alterar catálogo,
 * preços, variantes ou stock. A curadoria concreta continua explícita no
 * painel administrativo ou nas seeds de desenvolvimento.
 */
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

const COLLECTION = "products";
const EMPTY_MAKEUP_METADATA = Object.freeze({
    functions: Object.freeze([]),
    regions: Object.freeze([]),
    applicationAreas: Object.freeze([]),
    styleTags: Object.freeze([]),
    wearProfiles: Object.freeze([]),
});

function needsV3(document) {
    return (
        Number(document?.schemaVersion ?? 1) < 3 ||
        !document?.makeup ||
        ["functions", "regions", "applicationAreas", "styleTags", "wearProfiles"]
            .some((field) => !Array.isArray(document.makeup?.[field]))
    );
}

async function analyze(db, session = undefined) {
    const options = session ? { session } : {};
    const documents = await db
        .collection(COLLECTION)
        .find({}, { ...options, projection: { schemaVersion: 1, makeup: 1 } })
        .toArray();
    return {
        catalog: await captureCatalogInvariant(db, session, {
            includeCommercial: true,
        }),
        documents: documents.length,
        documentsNeedingV3: documents.filter(needsV3).length,
    };
}

async function up({ db, session }) {
    const before = await captureCatalogInvariant(db, session, {
        includeCommercial: true,
    });
    const documents = await db
        .collection(COLLECTION)
        .find({}, { session, projection: { schemaVersion: 1, makeup: 1 } })
        .toArray();
    let migratedDocuments = 0;

    for (const document of documents) {
        if (!needsV3(document)) continue;
        const current = document.makeup ?? {};
        const makeup = Object.fromEntries(
            Object.entries(EMPTY_MAKEUP_METADATA).map(([field, fallback]) => [
                field,
                Array.isArray(current[field]) ? current[field] : [...fallback],
            ]),
        );
        const result = await db.collection(COLLECTION).updateOne(
            {
                _id: document._id,
                ...(document.schemaVersion === undefined
                    ? { schemaVersion: { $exists: false } }
                    : { schemaVersion: document.schemaVersion }),
            },
            { $set: { schemaVersion: 3, makeup } },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Migração 017 perdeu CAS num produto");
        }
        migratedDocuments += result.modifiedCount;
    }

    const after = await captureCatalogInvariant(db, session, {
        includeCommercial: true,
    });
    assertCatalogInvariantEqual(before, after);
    return { migratedDocuments, catalogPreserved: true };
}

async function finalize() {
    return { indexesReconciled: 0 };
}

async function validate({ db }) {
    const inspection = await analyze(db);
    if (inspection.documentsNeedingV3 > 0) {
        throw new Error("Migração 017 deixou produtos fora do contrato v3");
    }
    return inspection;
}

export const migration017ProductMakeupSemanticsV3 = Object.freeze({
    version: "017_product_makeup_semantics_v3",
    description:
        "Prepara metadata semântica de maquilhagem sem inferência nem alterações comerciais",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
