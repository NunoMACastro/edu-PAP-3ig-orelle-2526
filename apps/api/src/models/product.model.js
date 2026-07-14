/**
 * Modelo de produto da Orélle.
 *
 * O BK-MF0-07 cria o catalogo administravel. O BK-MF0-08 acrescenta
 * `categoryIds` para permitir associar categorias aos produtos.
 */
import mongoose from "mongoose";
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

const { Schema, model } = mongoose;

const PRODUCT_TEXTURES = Object.freeze([
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
const PRODUCT_FINISHES = Object.freeze([
    "natural",
    "matte",
    "luminous",
    "satin",
    "dewy",
    "other",
]);
const PRODUCT_COVERAGES = Object.freeze([
    "none",
    "sheer",
    "light",
    "medium",
    "full",
]);
const PRODUCT_UNDERTONES = Object.freeze([
    "neutral",
    "warm",
    "cool",
    "olive",
    "universal",
]);

/**
 * Identificador comercial estável de uma variante dentro de um produto.
 * Não é um ObjectId e nunca incorpora nome, email ou outro dado pessoal.
 */
const productVariantSchema = new Schema(
    {
        variantId: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 64,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
        label: { type: String, required: true, trim: true, maxlength: 80 },
        colorHex: {
            type: String,
            default: null,
            uppercase: true,
            match: /^#[0-9A-F]{6}$/,
        },
        undertone: {
            type: String,
            enum: [...PRODUCT_UNDERTONES, null],
            default: null,
        },
        finish: {
            type: String,
            enum: [...PRODUCT_FINISHES, null],
            default: null,
        },
        coverage: {
            type: String,
            enum: [...PRODUCT_COVERAGES, null],
            default: null,
        },
        imageUrl: { type: String, default: null, trim: true },
        priceCents: { type: Number, default: null, min: 0 },
        stock: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

/**
 * Impede variantes ambíguas no mesmo produto. A validação é complementar ao
 * CAS do carrinho/checkout, que usa sempre `productId + variantId`.
 */
function hasUniqueVariantIds(variants) {
    if (!Array.isArray(variants)) return false;
    const ids = variants.map((variant) => variant?.variantId);
    return ids.length === new Set(ids).size;
}

/**
 * Confirma que o produto tem pelo menos um ingrediente declarado.
 *
 * @function hasAtLeastOneIngredient
 * @param {unknown} items - Valor recebido pelo validador Mongoose.
 * @returns {boolean} True quando o valor é um array não vazio.
 */
function hasAtLeastOneIngredient(items) {
    return Array.isArray(items) && items.length > 0;
}

/**
 * Schema MongoDB do produto.
 *
 * Os nomes dos campos seguem o contrato dos BKs: nome, descricao,
 * ingredientes, tipo de pele indicado, imagem, preco e stock.
 */
const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        brandName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        ingredientNames: {
            type: [String],
            required: true,
            validate: {
                validator: hasAtLeastOneIngredient,
                message: "Produto deve ter pelo menos um ingrediente",
            },
        },
        skinTypes: {
            type: [String],
            required: true,
            enum: SKIN_TYPES,
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        priceCents: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        categoryIds: {
            type: [Schema.Types.ObjectId],
            ref: "Category",
            default: [],
        },
        schemaVersion: {
            type: Number,
            min: 1,
            default: 3,
        },
        aiEligible: {
            type: Boolean,
            default: false,
            index: true,
        },
        concernTags: {
            type: [String],
            enum: PRODUCT_CONCERN_TAGS,
            default: [],
        },
        routineSteps: {
            type: [String],
            enum: PRODUCT_ROUTINE_STEPS,
            default: [],
        },
        inciIngredients: {
            type: [String],
            default: [],
        },
        attributes: {
            texture: {
                type: String,
                enum: [...PRODUCT_TEXTURES, null],
                default: null,
            },
            finish: {
                type: String,
                enum: [...PRODUCT_FINISHES, null],
                default: null,
            },
            coverage: {
                type: String,
                enum: [...PRODUCT_COVERAGES, null],
                default: null,
            },
            fragranceFree: { type: Boolean, default: null },
            spf: { type: Number, min: 0, max: 100, default: null },
            uvaRating: {
                type: String,
                enum: ["none", "broad_spectrum", "pa+++", "pa++++", null],
                default: null,
            },
            waterResistantMinutes: {
                type: Number,
                enum: [0, 40, 80, null],
                default: null,
            },
        },
        makeup: {
            functions: {
                type: [String],
                enum: PRODUCT_MAKEUP_FUNCTIONS,
                default: [],
            },
            regions: {
                type: [String],
                enum: PRODUCT_MAKEUP_REGIONS,
                default: [],
            },
            applicationAreas: {
                type: [String],
                enum: PRODUCT_MAKEUP_APPLICATION_AREAS,
                default: [],
            },
            styleTags: {
                type: [String],
                enum: PRODUCT_MAKEUP_STYLE_TAGS,
                default: [],
            },
            wearProfiles: {
                type: [String],
                enum: PRODUCT_MAKEUP_WEAR_PROFILES,
                default: [],
            },
        },
        variants: {
            type: [productVariantSchema],
            default: [],
            validate: {
                validator: hasUniqueVariantIds,
                message: "Variantes do produto têm identificadores repetidos",
            },
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            required() {
                return !this.creatorErasedAt;
            },
        },
        creatorErasedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

productSchema.pre("validate", function validateAggregateVariantStock(next) {
    if ((this.variants?.length ?? 0) > 0) {
        const variantStock = this.variants.reduce(
            (sum, variant) => sum + variant.stock,
            0,
        );
        if (variantStock !== this.stock) {
            this.invalidate(
                "stock",
                "Stock agregado deve igualar a soma das variantes",
            );
        }
    }
    next();
});

// Indice textual preparado para o BK-MF1-01 reutilizar na pesquisa.
productSchema.index({ name: "text", brandName: "text", description: "text" });
productSchema.index({ aiEligible: 1, concernTags: 1, stock: -1 });

/**
 * Modelo Mongoose de produtos.
 *
 * @type {import("mongoose").Model}
 */
export const Product = model("Product", productSchema);
