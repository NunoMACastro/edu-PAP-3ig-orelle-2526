/**
 * Regras comerciais centralizadas para variantes de catálogo.
 *
 * O identificador de uma linha é sempre `productId + variantId`. Produtos
 * legados continuam a aceitar `variantId=null`; produtos com variantes
 * publicadas exigem uma escolha explícita em novas operações.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { normalizeVariantId } from "../utils/product-variant.util.js";

export { normalizeVariantId } from "../utils/product-variant.util.js";

/** Procura a variante escolhida e aplica o contrato de compatibilidade. */
export function resolveProductVariant(
    product,
    variantId,
    { allowLegacyWithoutVariant = false } = {},
) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const normalizedVariantId = normalizeVariantId(variantId);

    if (variants.length === 0) {
        if (normalizedVariantId) {
            throw new AppError(404, "Variante não encontrada");
        }
        return null;
    }

    if (!normalizedVariantId) {
        if (allowLegacyWithoutVariant) return null;
        throw new AppError(400, "Escolhe uma variante do produto");
    }

    const variant = variants.find(
        (candidate) => candidate.variantId === normalizedVariantId,
    );
    if (!variant) throw new AppError(404, "Variante não encontrada");
    return variant;
}

/** Preço efetivo da linha, sempre resolvido no backend. */
export function resolveVariantPriceCents(product, variant) {
    return Number.isInteger(variant?.priceCents)
        ? variant.priceCents
        : product.priceCents;
}

/** Stock efetivo da linha. */
export function resolveVariantStock(product, variant) {
    return variant ? variant.stock : product.stock;
}

/** Snapshot imutável e minimizado da variante escolhida. */
export function buildVariantSnapshot(variant) {
    if (!variant) return null;

    return {
        variantId: variant.variantId,
        label: variant.label,
        colorHex: variant.colorHex ?? null,
        undertone: variant.undertone ?? null,
        finish: variant.finish ?? null,
        coverage: variant.coverage ?? null,
        imageUrl: variant.imageUrl ?? null,
    };
}

/** Chave estável usada em assinaturas, carrinho e idempotência. */
export function buildProductVariantKey(productId, variantId = null) {
    return `${productId?.toString?.() ?? productId}:${variantId ?? "base"}`;
}
