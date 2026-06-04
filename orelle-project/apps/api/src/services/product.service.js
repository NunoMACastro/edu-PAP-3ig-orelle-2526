import { Product } from "../models/product.model.js";

// 1. A tua função original (para a administração/criação de produtos)
function toProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
        createdBy: product.createdBy.toString(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

// 2. A nova função de resposta pública (para o catálogo - esconde createdBy e timestamps)
function toPublicProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

function escapeRegexText(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 3. A tua função original de criar produtos (continua intacta)
export async function createProduct(input, adminUserId) {
    const product = await Product.create({
        ...input,
        createdBy: adminUserId,
    });

    return toProductResponse(product);
}

// 4. A nova função de listagem que o Controller estava desesperadamente a procurar!
export async function listCatalogProducts(filters) {
    const query = {};

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    if (filters.brandName) {
        const escapedBrandName = escapeRegexText(filters.brandName);
        query.brandName = new RegExp(escapedBrandName, "i");
    }

    if (filters.skinType) {
        query.skinTypes = filters.skinType;
    }

    if (filters.categoryId) {
        query.categoryIds = filters.categoryId;
    }

    if (
        filters.minPriceCents !== undefined ||
        filters.maxPriceCents !== undefined
    ) {
        query.priceCents = {};
        if (filters.minPriceCents !== undefined) {
            query.priceCents.$gte = filters.minPriceCents;
        }
        if (filters.maxPriceCents !== undefined) {
            query.priceCents.$lte = filters.maxPriceCents;
        }
    }

    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(40);

    return products.map(toPublicProductResponse);
}