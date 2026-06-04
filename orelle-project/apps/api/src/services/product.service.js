import { Product } from "../models/product.model.js";


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


export async function createProduct(input, adminUserId) {
    const product = await Product.create({
        ...input,
        createdBy: adminUserId,
    });

    return toProductResponse(product);
}


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

import { AppError } from "../middlewares/error.middleware.js";

function toProductDetailResponse(product) {
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
        reviewSummary: {
            averageRating: 0,
            totalReviews: 0,
        },
        relatedProducts: [],
    };
}

export async function getCatalogProductDetails(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return toProductDetailResponse(product);
}