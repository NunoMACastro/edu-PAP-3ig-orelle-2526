import { describe, expect, it } from "vitest";
import { validateProductInput } from "../src/validators/product.validator.js";

describe("BK-MF0-07 / RF07 - produtos", () => {
    it("aceita produto valido", () => {
        const input = validateProductInput({
            name: "Gel de Limpeza Suave",
            brandName: "Orelle",
            description:
                "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
            ingredientNames: ["agua", "glicerina"],
            skinTypes: ["mista"],
            imageUrl: "https://images.orelle.local/gel.png",
            priceCents: 1290,
            stock: 10,
        });

        expect(input.priceCents).toBe(1290);
    });

    it("rejeita preco negativo", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description:
                    "Descricao cosmetica sem claims medicos para teste.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: -1,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });

    it("rejeita claim medico", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description: "Este produto cura acne e remove rugas.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: 1000,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });
});