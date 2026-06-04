import { describe, expect, it } from "vitest";
import {
    slugify,
    validateCategoryIds,
    validateCategoryInput,
} from "../src/validators/category.validator.js";

describe("BK-MF0-08 / RF08 - categorias", () => {
    it("cria slug estavel", () => {
        expect(slugify("Protetor Solar")).toBe("protetor-solar");
    });

    it("valida categoria", () => {
        const input = validateCategoryInput({ name: "Limpeza" });

        expect(input.slug).toBe("limpeza");
    });

    it("rejeita categoryIds invalidos", () => {
        expect(() => validateCategoryIds({ categoryIds: ["abc"] })).toThrow(
            "categoryIds contem IDs invalidos",
        );
    });
});