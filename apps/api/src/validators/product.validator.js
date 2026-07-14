/**
 * Validador de produtos do BK-MF0-07.
 *
 * O objetivo e proteger a rota admin de produtos contra payloads incompletos,
 * precos/stock invalidos e claims medicos que nao pertencem ao escopo cosmetico
 * documentado da MF0.
 */
import { AppError } from "../middlewares/error.middleware.js";
import {
    PRODUCT_CONCERN_TAGS,
    PRODUCT_MAKEUP_APPLICATION_AREAS,
    PRODUCT_MAKEUP_FUNCTIONS,
    PRODUCT_MAKEUP_REGIONS,
    PRODUCT_MAKEUP_STYLE_TAGS,
    PRODUCT_MAKEUP_WEAR_PROFILES,
    PRODUCT_ROUTINE_STEPS,
    SKIN_TYPES,
} from "../constants/domain.constants.js";

const BLOCKED_CLAIM_WORDS = [
    "cura",
    "curar",
    "tratamento medico",
    "tratamento clinico",
    "elimina acne",
    "remove rugas",
    "doenca",
    "medicamento",
];

const PRODUCT_TEXTURES = new Set([
    "gel",
    "foam",
    "oil",
    "water",
    "serum",
    "cream",
    "gel_cream",
    "fluid",
    "balm",
    "powder",
    "liquid",
    "other",
]);
const PRODUCT_FINISHES = new Set([
    "natural",
    "matte",
    "luminous",
    "satin",
    "dewy",
    "other",
]);
const PRODUCT_COVERAGES = new Set([
    "none",
    "sheer",
    "light",
    "medium",
    "full",
]);
const PRODUCT_UNDERTONES = new Set([
    "neutral",
    "warm",
    "cool",
    "olive",
    "universal",
]);
const PRODUCT_UVA_RATINGS = new Set([
    "none",
    "broad_spectrum",
    "pa+++",
    "pa++++",
]);

/**
 * Normaliza texto simples.
 *
 * @function normalizeText
 * @param {unknown} value - Valor recebido do cliente.
 * @returns {string} Texto limpo e com espacos internos normalizados.
 */
function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Normaliza uma lista de strings.
 *
 * @function normalizeList
 * @param {unknown} value - Valor esperado como array.
 * @returns {string[]} Lista normalizada, em minusculas e sem duplicados.
 */
function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return [
        ...new Set(
            value
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

/** Normaliza variantes opcionais sem aceitar stock/preço fracionário. */
function normalizeVariants(value, errors) {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > 40) {
        errors.variants = "Variantes devem ser uma lista com no máximo 40 itens";
        return [];
    }

    const variants = value.map((variant, index) => {
        const normalized = {
            variantId: normalizeText(variant?.variantId).toLowerCase(),
            label: normalizeText(variant?.label),
            colorHex: normalizeText(variant?.colorHex).toUpperCase() || null,
            undertone: normalizeText(variant?.undertone).toLowerCase() || null,
            finish: normalizeText(variant?.finish).toLowerCase() || null,
            coverage: normalizeText(variant?.coverage).toLowerCase() || null,
            imageUrl: normalizeText(variant?.imageUrl) || null,
            priceCents:
                variant?.priceCents === undefined || variant?.priceCents === null
                    ? null
                    : Number(variant.priceCents),
            stock: Number(variant?.stock),
        };

        if (
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.variantId) ||
            normalized.variantId.length > 64 ||
            normalized.label.length < 1 ||
            normalized.label.length > 80 ||
            !Number.isInteger(normalized.stock) ||
            normalized.stock < 0 ||
            (normalized.priceCents !== null &&
                (!Number.isInteger(normalized.priceCents) ||
                    normalized.priceCents < 0)) ||
            (normalized.colorHex !== null &&
                !/^#[0-9A-F]{6}$/.test(normalized.colorHex)) ||
            (normalized.undertone !== null &&
                !PRODUCT_UNDERTONES.has(normalized.undertone)) ||
            (normalized.finish !== null &&
                !PRODUCT_FINISHES.has(normalized.finish)) ||
            (normalized.coverage !== null &&
                !PRODUCT_COVERAGES.has(normalized.coverage))
        ) {
            errors.variants = `Variante ${index + 1} inválida`;
        }

        if (normalized.imageUrl) {
            try {
                const parsedUrl = new URL(normalized.imageUrl);
                if (!new Set(["http:", "https:"]).has(parsedUrl.protocol)) {
                    errors.variants = `Imagem da variante ${index + 1} inválida`;
                }
            } catch {
                errors.variants = `Imagem da variante ${index + 1} inválida`;
            }
        }

        return normalized;
    });

    if (new Set(variants.map(({ variantId }) => variantId)).size !== variants.length) {
        errors.variants = "IDs de variante não podem repetir-se";
    }

    return variants;
}

/** Normaliza atributos estruturados usados na filtragem do catálogo. */
function normalizeProductAttributes(value = {}) {
    const nullableText = (field) =>
        normalizeText(value?.[field]).toLowerCase() || null;

    return {
        texture: nullableText("texture"),
        finish: nullableText("finish"),
        coverage: nullableText("coverage"),
        fragranceFree:
            typeof value?.fragranceFree === "boolean"
                ? value.fragranceFree
                : null,
        spf:
            value?.spf === undefined || value?.spf === null
                ? null
                : Number(value.spf),
        uvaRating: nullableText("uvaRating"),
        waterResistantMinutes:
            value?.waterResistantMinutes === undefined ||
            value?.waterResistantMinutes === null
                ? null
                : Number(value.waterResistantMinutes),
    };
}

/** Valida os enums estruturados que o schema também restringe. */
function validateStructuredAttributes(attributes, errors) {
    const nullableAllowed = (value, allowed) =>
        value === null || allowed.has(value);

    if (
        !nullableAllowed(attributes.texture, PRODUCT_TEXTURES) ||
        !nullableAllowed(attributes.finish, PRODUCT_FINISHES) ||
        !nullableAllowed(attributes.coverage, PRODUCT_COVERAGES) ||
        !nullableAllowed(attributes.uvaRating, PRODUCT_UVA_RATINGS)
    ) {
        errors.attributes = "Atributos cosméticos estruturados inválidos";
    }
}

/** Normaliza e valida a semântica visual explícita de maquilhagem. */
function normalizeMakeupMetadata(value = {}, errors) {
    const makeup = {
        functions: normalizeList(value?.functions),
        regions: normalizeList(value?.regions),
        applicationAreas: normalizeList(value?.applicationAreas),
        styleTags: normalizeList(value?.styleTags),
        wearProfiles: normalizeList(value?.wearProfiles),
    };
    const fields = [
        ["functions", PRODUCT_MAKEUP_FUNCTIONS],
        ["regions", PRODUCT_MAKEUP_REGIONS],
        ["applicationAreas", PRODUCT_MAKEUP_APPLICATION_AREAS],
        ["styleTags", PRODUCT_MAKEUP_STYLE_TAGS],
        ["wearProfiles", PRODUCT_MAKEUP_WEAR_PROFILES],
    ];
    if (
        fields.some(([field, allowed]) =>
            makeup[field].some((entry) => !allowed.includes(entry)),
        )
    ) {
        errors.makeup = "Metadata estruturada de maquilhagem inválida";
    }
    if (makeup.functions.length > 0 && makeup.regions.length === 0) {
        errors.makeup = "Funções de maquilhagem exigem pelo menos uma região";
    }
    return makeup;
}

/**
 * Valida e normaliza o URL da imagem do produto.
 *
 * @function assertControlledImageUrl
 * @param {unknown} value - Valor recebido em `imageUrl`.
 * @param {Record<string, string>} errors - Objeto de erros a preencher.
 * @returns {string} URL normalizado ou string vazia em caso de erro.
 */
function assertControlledImageUrl(value, errors) {
    try {
        const url = new URL(String(value ?? "").trim());
        if (!["http:", "https:"].includes(url.protocol)) {
            errors.imageUrl = "Imagem deve ser URL http/https";
        }
        return url.toString();
    } catch {
        errors.imageUrl = "Imagem deve ser URL valido";
        return "";
    }
}

/**
 * Deteta claims medicos bloqueados no texto do produto.
 *
 * @function hasBlockedClaims
 * @param {string} description - Descricao normalizada do produto.
 * @returns {boolean} Verdadeiro quando a descricao contem claim bloqueado.
 */
function hasBlockedClaims(description) {
    const normalized = description.toLowerCase();
    return BLOCKED_CLAIM_WORDS.some((word) => normalized.includes(word));
}

/**
 * Valida o payload de criacao de produto.
 *
 * @function validateProductInput
 * @param {Record<string, unknown>} body - Corpo do pedido admin.
 * @returns {{name: string, brandName: string, description: string, ingredientNames: string[], skinTypes: string[], imageUrl: string, priceCents: number, stock: number}} Produto normalizado.
 * @throws {AppError} Quando algum campo quebra o contrato do RF07.
 */
export function validateProductInput(body) {
    const errors = {};
    const input = {
        name: normalizeText(body.name),
        brandName: normalizeText(body.brandName),
        description: normalizeText(body.description),
        ingredientNames: normalizeList(body.ingredientNames),
        skinTypes: normalizeList(body.skinTypes),
        imageUrl: "",
        priceCents: Number(body.priceCents),
        stock: Number(body.stock),
        schemaVersion: 3,
        aiEligible: body.aiEligible === true,
        concernTags: normalizeList(body.concernTags),
        routineSteps: normalizeList(body.routineSteps),
        inciIngredients: normalizeList(
            body.inciIngredients ?? body.ingredientNames,
        ),
        attributes: normalizeProductAttributes(body.attributes),
        makeup: normalizeMakeupMetadata(body.makeup, errors),
        variants: normalizeVariants(body.variants, errors),
    };

    input.imageUrl = assertControlledImageUrl(body.imageUrl, errors);
    validateStructuredAttributes(input.attributes, errors);

    if (input.name.length < 2 || input.name.length > 120) {
        errors.name = "Nome deve ter entre 2 e 120 caracteres";
    }

    if (input.brandName.length < 2 || input.brandName.length > 80) {
        errors.brandName = "Marca deve ter entre 2 e 80 caracteres";
    }

    if (input.description.length < 20 || input.description.length > 1000) {
        errors.description = "Descrição deve ter entre 20 e 1000 caracteres";
    }

    if (hasBlockedClaims(input.description)) {
        errors.description =
            "Descrição não pode conter claims clínicos ou médicos não documentados";
    }

    if (input.ingredientNames.length === 0) {
        errors.ingredientNames = "Indica pelo menos um ingrediente";
    }

    if (
        input.skinTypes.length === 0 ||
        input.skinTypes.some((type) => !SKIN_TYPES.includes(type))
    ) {
        errors.skinTypes = `Tipos de pele devem ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
        errors.priceCents =
            "Preço deve ser inteiro em cêntimos e maior ou igual a zero";
    }

    if (!Number.isInteger(input.stock) || input.stock < 0) {
        errors.stock = "Stock deve ser inteiro maior ou igual a zero";
    }

    if (
        input.concernTags.some(
            (tag) => !PRODUCT_CONCERN_TAGS.includes(tag),
        )
    ) {
        errors.concernTags = "Objetivos cosméticos do produto inválidos";
    }

    if (
        input.routineSteps.some(
            (step) => !PRODUCT_ROUTINE_STEPS.includes(step),
        )
    ) {
        errors.routineSteps = "Passos de rotina do produto inválidos";
    }

    if (
        input.attributes.spf !== null &&
        (!Number.isInteger(input.attributes.spf) ||
            input.attributes.spf < 0 ||
            input.attributes.spf > 100)
    ) {
        errors.attributes = "FPS estruturado inválido";
    }

    if (
        input.attributes.waterResistantMinutes !== null &&
        ![0, 40, 80].includes(input.attributes.waterResistantMinutes)
    ) {
        errors.attributes = "Resistência à água inválida";
    }

    const variantStock = input.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
    );
    if (input.variants.length > 0 && variantStock !== input.stock) {
        errors.variants = "A soma do stock das variantes deve igualar o stock do produto";
    }

    if (
        input.aiEligible &&
        (input.concernTags.length === 0 ||
            input.routineSteps.length === 0 ||
            input.inciIngredients.length === 0)
    ) {
        errors.aiEligible =
            "Produtos elegíveis para IA exigem objetivos, passos de rotina e INCI";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Produto invalido", errors);
    }

    return input;
}

/**
 * Valida a curadoria IA de um produto existente sem permitir que este endpoint
 * altere nome, preço ou stock agregado. O stock atual vem da base de dados e
 * não do pedido do browser.
 *
 * @param {Record<string, unknown>} body - Metadata submetida pelo admin.
 * @param {number} productStock - Stock agregado confirmado na persistência.
 * @returns {object} Metadata normalizada pronta para persistência.
 */
export function validateProductAiMetadataInput(body, productStock) {
    const errors = {};
    const input = {
        schemaVersion: 3,
        aiEligible: body?.aiEligible === true,
        concernTags: normalizeList(body?.concernTags),
        routineSteps: normalizeList(body?.routineSteps),
        inciIngredients: normalizeList(body?.inciIngredients),
        attributes: normalizeProductAttributes(body?.attributes),
        makeup: normalizeMakeupMetadata(body?.makeup, errors),
        variants: normalizeVariants(body?.variants, errors),
    };

    validateStructuredAttributes(input.attributes, errors);
    if (
        input.concernTags.some(
            (tag) => !PRODUCT_CONCERN_TAGS.includes(tag),
        )
    ) {
        errors.concernTags = "Objetivos cosméticos do produto inválidos";
    }
    if (
        input.routineSteps.some(
            (step) => !PRODUCT_ROUTINE_STEPS.includes(step),
        )
    ) {
        errors.routineSteps = "Passos de rotina do produto inválidos";
    }
    if (
        input.attributes.spf !== null &&
        (!Number.isInteger(input.attributes.spf) ||
            input.attributes.spf < 0 ||
            input.attributes.spf > 100)
    ) {
        errors.attributes = "FPS estruturado inválido";
    }
    if (
        input.attributes.waterResistantMinutes !== null &&
        ![0, 40, 80].includes(input.attributes.waterResistantMinutes)
    ) {
        errors.attributes = "Resistência à água inválida";
    }

    const confirmedStock = Number(productStock);
    const variantStock = input.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
    );
    if (
        !Number.isInteger(confirmedStock) ||
        confirmedStock < 0 ||
        (input.variants.length > 0 && variantStock !== confirmedStock)
    ) {
        errors.variants =
            "A soma do stock das variantes deve igualar o stock atual do produto";
    }
    if (
        input.aiEligible &&
        (input.concernTags.length === 0 ||
            input.routineSteps.length === 0 ||
            input.inciIngredients.length === 0)
    ) {
        errors.aiEligible =
            "Produtos elegíveis para IA exigem objetivos, passos de rotina e INCI";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Metadata IA do produto inválida", errors);
    }
    return input;
}
