import { createProduct } from "../services/product.service.js";
import { validateProductInput } from "../validators/product.validator.js";

export async function createProductController(req, res, next) {
    try {
        const input = validateProductInput(req.body);
        const product = await createProduct(input, req.user.id);

        return res.status(201).json({ product });
    } catch (err) {
        return next(err);
    }
}