/** Contratos puros da curadoria IA administrativa. */
import assert from "node:assert/strict";
import test from "node:test";
import {
    buildAiCurationPayload,
    MAKEUP_FUNCTIONS,
    PRODUCT_CONCERNS,
    productToAiCurationForm,
    ROUTINE_STEPS,
} from "../src/services/productAiCuration.js";

test("curadoria cobre sete objetivos e todos os passos versionados", () => {
    assert.equal(PRODUCT_CONCERNS.length, 7);
    assert.equal(ROUTINE_STEPS.length, 12);
    assert.equal(MAKEUP_FUNCTIONS.length, 18);
});

test("formulário preserva variantes existentes e gera chaves sem campo técnico", () => {
    const form = productToAiCurationForm({
        aiEligible: true,
        concernTags: ["makeup"],
        routineSteps: ["complexion"],
        inciIngredients: ["aqua", "mica"],
        attributes: { finish: "natural" },
        makeup: {
            functions: ["foundation"],
            regions: ["complexion"],
            applicationAreas: ["full_complexion"],
            styleTags: ["soft_classic"],
            wearProfiles: ["longwear"],
        },
        variants: [
            {
                variantId: "claro-neutro",
                label: "Claro neutro",
                stock: 4,
            },
        ],
    });
    form.variants.push({
        variantId: "",
        label: "Médio quente",
        colorHex: "#A0725C",
        undertone: "warm",
        finish: "natural",
        coverage: "medium",
        imageUrl: "",
        priceEuros: "19.90",
        stock: "6",
    });

    const payload = buildAiCurationPayload(form);
    assert.equal(payload.variants[0].variantId, "claro-neutro");
    assert.equal(payload.variants[1].variantId, "medio-quente");
    assert.equal(payload.variants[1].priceCents, 1990);
    assert.deepEqual(payload.inciIngredients, ["aqua", "mica"]);
    assert.deepEqual(payload.makeup.functions, ["foundation"]);
});
