import {
    assignCategoriesToProduct,
    createCategory,
} from "../services/category.service.js";
import {
    validateCategoryIds,
    validateCategoryInput,
} from "../validators/category.validator.js";

export async function createCategoryController(req, res, next) {
    try {
        const input = validateCategoryInput(req.body);
        const category = await createCategory(input);

        return res.status(201).json({ category });
    } catch (err) {
        return next(err);
    }
}

export async function assignProductCategoriesController(req, res, next) {
    try {
        const categoryIds = validateCategoryIds(req.body);
        const product = await assignCategoriesToProduct(
            req.params.productId,
            categoryIds,
        );

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}