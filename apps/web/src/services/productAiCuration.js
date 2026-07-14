/** Contratos de UI e transporte da curadoria IA do catálogo. */
import { apiRequest } from "./apiClient.js";

export const PRODUCT_CONCERNS = Object.freeze([
    ["acne_imperfections", "Acne e imperfeições"],
    ["hydration_barrier", "Hidratação e barreira"],
    ["oil_control", "Controlo de oleosidade"],
    ["sensitivity_redness", "Sensibilidade e vermelhidão"],
    ["spots_tone_luminosity", "Manchas, tom e luminosidade"],
    ["sun_protection", "Proteção solar"],
    ["makeup", "Maquilhagem"],
]);

export const ROUTINE_STEPS = Object.freeze([
    ["cleanse", "Limpeza"],
    ["tone_exfoliate", "Tónico ou esfoliação"],
    ["treat", "Cuidado específico"],
    ["moisturize", "Hidratação"],
    ["protect", "Proteção"],
    ["prime", "Preparação de maquilhagem"],
    ["set", "Fixação de maquilhagem"],
    ["complexion", "Pele e base"],
    ["cheeks", "Rosto e maçãs"],
    ["eyes", "Olhos"],
    ["brows", "Sobrancelhas"],
    ["lips", "Lábios"],
]);

export const MAKEUP_FUNCTIONS = Object.freeze([
    ["primer", "Primer"], ["skin_tint", "Skin tint"], ["foundation", "Base"],
    ["color_corrector", "Corretor de cor"], ["concealer", "Corretor"],
    ["setting_powder", "Pó fixador"], ["blush", "Blush"],
    ["bronzer", "Bronzer"], ["contour", "Contorno"],
    ["highlighter", "Iluminador"], ["eyeshadow", "Sombra"],
    ["eyeliner", "Eyeliner"], ["mascara", "Máscara de pestanas"],
    ["brow_product", "Produto de sobrancelhas"], ["lip_liner", "Lápis de lábios"],
    ["lipstick", "Batom"], ["lip_gloss", "Gloss ou óleo labial"],
    ["setting_spray", "Spray fixador"],
]);

export const MAKEUP_REGIONS = Object.freeze([
    ["complexion", "Pele do rosto"], ["cheeks", "Bochechas"],
    ["eyes", "Olhos"], ["brows", "Sobrancelhas"], ["lips", "Lábios"],
]);

export const MAKEUP_APPLICATION_AREAS = Object.freeze([
    ["full_complexion", "Complexion completa"], ["under_eyes", "Olheiras"],
    ["blemishes", "Imperfeições localizadas"], ["t_zone", "Zona T"],
    ["cheek_apples", "Maçãs do rosto"], ["cheekbones", "Maçãs altas"],
    ["jawline", "Linha do maxilar"], ["temples", "Têmporas"],
    ["eyelids", "Pálpebras"], ["lash_line", "Linha das pestanas"],
    ["lashes", "Pestanas"], ["brows", "Sobrancelhas"],
    ["lip_contour", "Contorno dos lábios"], ["lips", "Lábios"],
]);

export const MAKEUP_STYLES = Object.freeze([
    ["natural_everyday", "Natural quotidiano"], ["soft_classic", "Clássico suave"],
    ["soft_glam", "Soft glam"], ["gala_evening", "Gala ou noite"],
    ["modern_editorial", "Moderno editorial"],
]);

export const MAKEUP_WEAR_PROFILES = Object.freeze([
    ["comfort", "Conforto"], ["longwear", "Longa duração"],
    ["oil_control", "Controlo de oleosidade"], ["hydrating", "Hidratante"],
    ["photo_ready", "Preparada para fotografia"],
]);

export const TEXTURES = Object.freeze([
    ["", "Não indicado"],
    ["gel", "Gel"],
    ["foam", "Espuma"],
    ["oil", "Óleo"],
    ["water", "Água"],
    ["serum", "Sérum"],
    ["cream", "Creme"],
    ["gel_cream", "Gel-creme"],
    ["fluid", "Fluido"],
    ["balm", "Bálsamo"],
    ["powder", "Pó"],
    ["liquid", "Líquido"],
    ["other", "Outra"],
]);

export const FINISHES = Object.freeze([
    ["", "Não indicado"],
    ["natural", "Natural"],
    ["matte", "Mate"],
    ["luminous", "Luminoso"],
    ["satin", "Acetinado"],
    ["dewy", "Viçoso"],
    ["other", "Outro"],
]);

export const COVERAGES = Object.freeze([
    ["", "Não indicada"],
    ["none", "Sem cobertura"],
    ["sheer", "Transparente"],
    ["light", "Leve"],
    ["medium", "Média"],
    ["full", "Alta"],
]);

export const UNDERTONES = Object.freeze([
    ["", "Não indicado"],
    ["neutral", "Neutro"],
    ["warm", "Quente"],
    ["cool", "Frio"],
    ["olive", "Oliva"],
    ["universal", "Universal"],
]);

/** Constrói a query administrativa sem enviar filtros vazios. */
function buildAdminProductsQuery(filters) {
    const search = new URLSearchParams({
        page: String(filters.page ?? 1),
        pageSize: String(filters.pageSize ?? 20),
        aiEligibility: filters.aiEligibility ?? "all",
        stock: filters.stock ?? "all",
    });
    if (filters.search?.trim()) search.set("search", filters.search.trim());
    return search.toString();
}

/**
 * Lista uma página de produtos completos para gestão administrativa.
 *
 * @param {{page?: number, pageSize?: number, search?: string, aiEligibility?: string, stock?: string}} [filters={}] - Pesquisa validada remotamente.
 * @param {{signal?: AbortSignal}} [options={}] - Cancelamento do pedido atual.
 * @returns {Promise<{products: object[], pagination: {page: number, pageSize: number, total: number, totalPages: number}}>} Página normalizada.
 */
export async function listProductsForAiCuration(
    filters = {},
    { signal } = {},
) {
    const data = await apiRequest(
        `/admin/products?${buildAdminProductsQuery(filters)}`,
        { signal },
    );
    return {
        products: Array.isArray(data?.products) ? data.products : [],
        pagination: {
            page: Number(data?.pagination?.page ?? filters.page ?? 1),
            pageSize: Number(
                data?.pagination?.pageSize ?? filters.pageSize ?? 20,
            ),
            total: Number(data?.pagination?.total ?? 0),
            totalPages: Number(data?.pagination?.totalPages ?? 0),
        },
    };
}

/** Guarda apenas a metadata IA do produto selecionado. */
export async function saveProductAiCuration(productId, metadata, { signal } = {}) {
    const data = await apiRequest(
        `/admin/products/${encodeURIComponent(productId)}/ai-metadata`,
        {
            method: "PATCH",
            body: JSON.stringify(metadata),
            signal,
        },
    );
    return data?.product ?? null;
}

/** Cria uma chave comercial estável sem mostrar um campo técnico ao admin. */
function createVariantKey(label, index, used) {
    const base = String(label ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || `variante-${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
        candidate = `${base.slice(0, 54)}-${suffix}`;
        suffix += 1;
    }
    used.add(candidate);
    return candidate;
}

/** Converte o produto selecionado no estado editável do formulário. */
export function productToAiCurationForm(product) {
    return {
        aiEligible: product?.aiEligible === true,
        concernTags: Array.isArray(product?.concernTags)
            ? product.concernTags
            : [],
        routineSteps: Array.isArray(product?.routineSteps)
            ? product.routineSteps
            : [],
        inciText: (product?.inciIngredients ?? []).join("\n"),
        texture: product?.attributes?.texture ?? "",
        finish: product?.attributes?.finish ?? "",
        coverage: product?.attributes?.coverage ?? "",
        fragranceFree:
            typeof product?.attributes?.fragranceFree === "boolean"
                ? String(product.attributes.fragranceFree)
                : "",
        spf:
            product?.attributes?.spf === null ||
            product?.attributes?.spf === undefined
                ? ""
                : String(product.attributes.spf),
        uvaRating: product?.attributes?.uvaRating ?? "",
        waterResistantMinutes:
            product?.attributes?.waterResistantMinutes === null ||
            product?.attributes?.waterResistantMinutes === undefined
                ? ""
                : String(product.attributes.waterResistantMinutes),
        makeupFunctions: product?.makeup?.functions ?? [],
        makeupRegions: product?.makeup?.regions ?? [],
        makeupApplicationAreas: product?.makeup?.applicationAreas ?? [],
        makeupStyleTags: product?.makeup?.styleTags ?? [],
        makeupWearProfiles: product?.makeup?.wearProfiles ?? [],
        variants: (product?.variants ?? []).map((variant) => ({
            variantId: variant.variantId,
            label: variant.label ?? "",
            colorHex: variant.colorHex ?? "",
            undertone: variant.undertone ?? "",
            finish: variant.finish ?? "",
            coverage: variant.coverage ?? "",
            imageUrl: variant.imageUrl ?? "",
            priceEuros:
                variant.priceCents === null || variant.priceCents === undefined
                    ? ""
                    : (variant.priceCents / 100).toFixed(2),
            stock: String(variant.stock ?? 0),
        })),
    };
}

/** Produz o payload validado novamente pelo backend. */
export function buildAiCurationPayload(form) {
    const usedVariantKeys = new Set();
    return {
        aiEligible: form.aiEligible === true,
        concernTags: [...new Set(form.concernTags)],
        routineSteps: [...new Set(form.routineSteps)],
        inciIngredients: String(form.inciText ?? "")
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
        attributes: {
            texture: form.texture || null,
            finish: form.finish || null,
            coverage: form.coverage || null,
            fragranceFree:
                form.fragranceFree === ""
                    ? null
                    : form.fragranceFree === "true",
            spf: form.spf === "" ? null : Number(form.spf),
            uvaRating: form.uvaRating || null,
            waterResistantMinutes:
                form.waterResistantMinutes === ""
                    ? null
                    : Number(form.waterResistantMinutes),
        },
        makeup: {
            functions: [...new Set(form.makeupFunctions)],
            regions: [...new Set(form.makeupRegions)],
            applicationAreas: [...new Set(form.makeupApplicationAreas)],
            styleTags: [...new Set(form.makeupStyleTags)],
            wearProfiles: [...new Set(form.makeupWearProfiles)],
        },
        variants: form.variants.map((variant, index) => {
            const existingKey = String(variant.variantId ?? "").trim();
            const variantId =
                existingKey && !usedVariantKeys.has(existingKey)
                    ? existingKey
                    : createVariantKey(variant.label, index, usedVariantKeys);
            usedVariantKeys.add(variantId);
            return {
                variantId,
                label: variant.label.trim(),
                colorHex: variant.colorHex.trim() || null,
                undertone: variant.undertone || null,
                finish: variant.finish || null,
                coverage: variant.coverage || null,
                imageUrl: variant.imageUrl.trim() || null,
                priceCents:
                    variant.priceEuros === ""
                        ? null
                        : Math.round(Number(variant.priceEuros) * 100),
                stock: Number(variant.stock),
            };
        }),
    };
}
