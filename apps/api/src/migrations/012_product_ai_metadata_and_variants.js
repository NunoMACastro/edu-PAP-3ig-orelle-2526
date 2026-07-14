/** Migração 012: metadata IA/variantes sem apagar produtos nem repor stock. */
import {
    CATALOG_PRODUCTS,
    buildCuratedAiMetadata,
} from "../scripts/seed-products.js";
import {
    assertCatalogInvariantEqual,
    captureCatalogInvariant,
} from "./catalog-invariant.js";

const seedsByName = new Map(CATALOG_PRODUCTS.map((seed) => [seed.name, seed]));

async function analyze(db) {
    return {
        catalog: await captureCatalogInvariant(db),
        pending: await db.collection("products").countDocuments({
            $or: [{ schemaVersion: { $ne: 2 } }, { aiEligible: { $exists: false } }],
        }),
    };
}

async function up({ db, session }) {
    const before = await captureCatalogInvariant(db, session);
    const products = await db
        .collection("products")
        .find({}, { session })
        .project({ name: 1, stock: 1, variants: 1 })
        .toArray();
    let curated = 0;
    let initialized = 0;
    for (const product of products) {
        const seed = seedsByName.get(product.name);
        const metadata = seed
            ? buildCuratedAiMetadata(
                  seed,
                  Number(product.stock ?? 0),
                  product.variants ?? [],
              )
            : {
                  schemaVersion: 2,
                  aiEligible: false,
                  concernTags: [],
                  routineSteps: [],
                  inciIngredients: [],
                  attributes: {},
                  variants: product.variants ?? [],
              };
        const result = await db.collection("products").updateOne(
            { _id: product._id, stock: product.stock },
            { $set: metadata },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Migração 012 perdeu CAS de stock do produto");
        }
        if (seed) curated += result.modifiedCount;
        else initialized += result.modifiedCount;
    }
    const after = await captureCatalogInvariant(db, session);
    assertCatalogInvariantEqual(before, after);
    return { curated, initialized, catalogPreserved: true };
}

async function validate({ db, session = undefined }) {
    const invalid = await db.collection("products").countDocuments(
        {
            $or: [
                { schemaVersion: { $ne: 2 } },
                { aiEligible: { $exists: false } },
                { concernTags: { $not: { $type: "array" } } },
                { variants: { $not: { $type: "array" } } },
            ],
        },
        session ? { session } : {},
    );
    if (invalid !== 0) throw new Error("Migração 012 deixou produtos incompletos");
    return { invalid, catalog: await captureCatalogInvariant(db, session) };
}

export const migration012ProductAiMetadataAndVariants = Object.freeze({
    version: "012_product_ai_metadata_and_variants",
    description: "Adiciona metadata IA e variantes preservando o catálogo",
    analyze,
    up,
    validate,
});
