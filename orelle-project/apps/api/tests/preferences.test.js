import { describe, expect, it } from "vitest";
import { validatePreferencesInput } from "../src/validators/preferences.validator.js";

describe("BK-MF0-06 / RF06 - preferencias", () => {
    it("normaliza marcas favoritas", () => {
        const input = validatePreferencesInput({
            favoriteBrandNames: [" Orelle ", "Orelle", "The Ordinary"],
            favoriteProductIds: [],
        });

        expect(input.favoriteBrandNames).toEqual(["Orelle", "The Ordinary"]);
    });

    it("bloqueia produtos favoritos antes de existir catalogo", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: ["66c000000000000000000001"],
            }),
        ).toThrow("Preferencias invalidas");
    });

    it("limita excesso de marcas", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: Array.from(
                    { length: 11 },
                    (_, index) => `Marca ${index}`,
                ),
            }),
        ).toThrow("Preferencias invalidas");
    });
});