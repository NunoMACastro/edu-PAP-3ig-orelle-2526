/** Invariante transversal que impede migrações de apagar/resetar catálogo. */
import { createHash } from "node:crypto";

export async function captureCatalogInvariant(
    db,
    session = undefined,
    { includeCommercial = false } = {},
) {
    const products = await db
        .collection("products")
        .find({}, session ? { session } : {})
        .project(
            includeCommercial
                ? { _id: 1, name: 1, priceCents: 1, stock: 1, variants: 1 }
                : { _id: 1, stock: 1 },
        )
        .sort({ _id: 1 })
        .toArray();
    const commercialSnapshot = includeCommercial ? products.map((product) => ({
        id: product._id.toString(),
        name: product.name ?? null,
        priceCents: product.priceCents ?? null,
        stock: product.stock ?? null,
        variants: (product.variants ?? []).map((variant) => ({
            variantId: variant.variantId ?? null,
            label: variant.label ?? null,
            colorHex: variant.colorHex ?? null,
            finish: variant.finish ?? null,
            coverage: variant.coverage ?? null,
            priceCents: variant.priceCents ?? null,
            stock: variant.stock ?? null,
        })),
    })) : null;
    return {
        count: products.length,
        idsHash: createHash("sha256")
            .update(products.map(({ _id }) => _id.toString()).join("|"))
            .digest("hex"),
        ...(includeCommercial
            ? {
                  commercialHash: createHash("sha256")
                      .update(JSON.stringify(commercialSnapshot))
                      .digest("hex"),
              }
            : {}),
        stockTotal: products.reduce(
            (sum, product) => sum + Number(product.stock ?? 0),
            0,
        ),
    };
}

export function assertCatalogInvariantEqual(before, after) {
    if (
        before.count !== after.count ||
        before.idsHash !== after.idsHash ||
        ((before.commercialHash !== undefined ||
            after.commercialHash !== undefined) &&
            before.commercialHash !== after.commercialHash) ||
        before.stockTotal !== after.stockTotal
    ) {
        throw new Error(
            before.commercialHash !== undefined || after.commercialHash !== undefined
                ? "Migração tentou alterar IDs, nomes, preços, variantes ou stock do catálogo"
                : "Migração tentou alterar IDs, contagem ou stock do catálogo",
        );
    }
}
