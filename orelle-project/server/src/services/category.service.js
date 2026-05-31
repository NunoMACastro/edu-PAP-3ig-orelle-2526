import { AppError } from "../middlewares/error.middleware.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

function toCategoryResponse(category) {
    return {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
    };
}

function toProductCategoryResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

export async function createCategory(input) {
    const category = await Category.create(input);
    return toCategoryResponse(category);
}

export async function seedCategory(input) {
    const category = await Category.findOneAndUpdate(
        { slug: input.slug },
        { $setOnInsert: input },
        { upsert: true, new: true },
    );

    return toCategoryResponse(category);
}

export async function assignCategoriesToProduct(productId, categoryIds) {
    const found = await Category.countDocuments({ _id: { $in: categoryIds } });

    if (found !== categoryIds.length) {
        throw new AppError(400, "Uma ou mais categorias nao existem");
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { categoryIds } },
        { new: true, runValidators: true },
    );

    if (!product) {
        throw new AppError(404, "Produto nao encontrado");
    }

    return toProductCategoryResponse(product);
}