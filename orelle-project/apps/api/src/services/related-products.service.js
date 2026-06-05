import { AppError } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";

function toRelatedProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        skinTypes: product.skinTypes,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

export async function listRelatedCatalogProducts(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    const criteria = [
        product.categoryIds.length > 0
            ? { categoryIds: { $in: product.categoryIds } }
            : null,
        product.skinTypes.length > 0
            ? { skinTypes: { $in: product.skinTypes } }
            : null,
        product.brandName
            ? { brandName: product.brandName }
            : null,
    ].filter(Boolean);

    if (criteria.length === 0) {
        return [];
    }

    const related = await Product.find({
        _id: { $ne: product._id },
        stock: { $gt: 0 },
        $or: criteria,
    })
        .sort({ stock: -1, createdAt: -1 })
        .limit(8);

    return related.map(toRelatedProductResponse);
}