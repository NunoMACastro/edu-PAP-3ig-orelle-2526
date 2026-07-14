/**
 * Contratos de segurança dos scripts de seed locais.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
    assertDevelopmentSeedsAllowed,
    isDevelopmentSeedEnvironment,
} from "../src/scripts/seed-safety.js";
import {
    CATALOG_PRODUCTS,
    buildCuratedAiMetadata,
    buildProductImageGenerationManifest,
} from "../src/scripts/seed-products.js";
import {
    PRODUCT_CONCERN_TAGS,
    SKIN_TYPES,
} from "../src/constants/domain.constants.js";
import { selectBalancedCatalogCandidates } from "../src/services/consultation-report.service.js";
import { validateProductInput } from "../src/validators/product.validator.js";

const SEED_SCRIPT_PATHS = [
    "src/scripts/seed-admin.js",
    "src/scripts/seed-categories.js",
    "src/scripts/seed-client-data.js",
    "src/scripts/seed-local.js",
    "src/scripts/seed-products.js",
    "src/scripts/seed-users.js",
];

describe("segurança das seeds académicas", () => {
    it("autoriza apenas o nome de ambiente development", () => {
        expect(isDevelopmentSeedEnvironment("development")).toBe(true);
        expect(isDevelopmentSeedEnvironment("test")).toBe(false);
        expect(isDevelopmentSeedEnvironment("production")).toBe(false);
        expect(isDevelopmentSeedEnvironment(undefined)).toBe(false);
    });

    it("recusa executar no NODE_ENV=test atual antes de qualquer escrita", () => {
        expect(() => assertDevelopmentSeedsAllowed()).toThrow(
            "apenas em NODE_ENV=development",
        );
    });

    it("não imprime nem devolve passwords nos scripts de seed", async () => {
        const sources = await Promise.all(
            SEED_SCRIPT_PATHS.map((filePath) => readFile(filePath, "utf8")),
        );
        const outputStatements = sources
            .flatMap((source) => source.match(/console\.(?:log|info|warn|error)\([^;]+/gs) ?? [])
            .join("\n");

        expect(outputStatements).not.toMatch(/password|senha|credencial/i);
        expect(sources.join("\n")).not.toContain("return { users, password }");
    });

    it("mantém os 68 produtos locais válidos e elegíveis sem alterar o stock", () => {
        expect(CATALOG_PRODUCTS).toHaveLength(68);

        for (const product of CATALOG_PRODUCTS) {
            const { categorySlugs, ...payload } = product;
            const metadata = buildCuratedAiMetadata(
                product,
                product.stock,
                [],
            );
            const input = validateProductInput({
                ...payload,
                brandName: "Orelle",
                imageUrl: "http://localhost:5173/products/fixture.png",
                ...metadata,
            });

            expect(input.aiEligible, product.name).toBe(true);
            expect(input.concernTags.length, product.name).toBeGreaterThan(0);
            expect(
                input.variants.reduce((total, variant) => total + variant.stock, 0),
                product.name,
            ).toBe(input.variants.length > 0 ? input.stock : 0);
            expect(input.stock, product.name).toBe(product.stock);
            expect(categorySlugs.length, product.name).toBeGreaterThan(0);
        }
    });

    it("garante cobertura curada para todos os objetivos e tipos de pele", () => {
        const products = CATALOG_PRODUCTS.map((product) => ({
            ...product,
            ...buildCuratedAiMetadata(product, product.stock, []),
        }));

        for (const concernTag of PRODUCT_CONCERN_TAGS) {
            const candidates = products.filter((product) =>
                product.concernTags.includes(concernTag),
            );

            expect(candidates.length, concernTag).toBeGreaterThanOrEqual(5);
            for (const skinType of SKIN_TYPES) {
                expect(
                    candidates.some((product) =>
                        product.skinTypes.includes(skinType),
                    ),
                    `${concernTag}:${skinType}`,
                ).toBe(true);
            }
        }
    });

    it("preserva passos em falta e elimina classificações por coincidência textual", () => {
        const productsByName = new Map(
            CATALOG_PRODUCTS.map((product) => [
                product.name,
                buildCuratedAiMetadata(product, product.stock, []),
            ]),
        );
        const allMetadata = [...productsByName.values()];

        expect(
            allMetadata.filter(({ routineSteps }) =>
                routineSteps.includes("prime"),
            ),
        ).toHaveLength(3);
        expect(
            allMetadata.filter(({ routineSteps }) =>
                routineSteps.includes("set"),
            ).length,
        ).toBeGreaterThanOrEqual(3);
        expect(
            allMetadata.some(({ routineSteps }) =>
                routineSteps.includes("tone_exfoliate"),
            ),
        ).toBe(true);
        expect(productsByName.get("Blush Creme Rosa").concernTags).toEqual([
            "makeup",
        ]);
        expect(productsByName.get("Paleta Sombras Neutras").concernTags).toEqual([
            "makeup",
        ]);
        expect(
            productsByName.get("Tonico Esfoliante AHA BHA").concernTags,
        ).not.toContain("sensitivity_redness");
        expect(
            productsByName.get("Serum Niacinamida 10% + Zinco 1%").attributes
                .texture,
        ).toBe("serum");
        expect(
            productsByName.get("Gel-Creme Hidratante Oil-Free").attributes
                .texture,
        ).toBe("gel_cream");
        expect(
            productsByName.get("Protetor Solar Oil Control FPS 50").attributes
                .texture,
        ).toBe("fluid");
    });

    it("mantém três candidatos por objetivo nas 154 combinações e cinco tipos de pele", () => {
        const products = CATALOG_PRODUCTS.map((product) => ({
            ...product,
            ...buildCuratedAiMetadata(product, product.stock, []),
        }));
        let combinations = 0;

        for (const primaryGoal of PRODUCT_CONCERN_TAGS) {
            const remainingGoals = PRODUCT_CONCERN_TAGS.filter(
                (goalCode) => goalCode !== primaryGoal,
            );
            const secondarySelections = [
                [],
                ...remainingGoals.map((goalCode) => [goalCode]),
                ...remainingGoals.flatMap((goalCode, index) =>
                    remainingGoals
                        .slice(index + 1)
                        .map((otherGoalCode) => [goalCode, otherGoalCode]),
                ),
            ];

            for (const secondaryGoals of secondarySelections) {
                const goalCodes = [primaryGoal, ...secondaryGoals];
                for (const skinType of SKIN_TYPES) {
                    const candidates = selectBalancedCatalogCandidates(
                        products.filter((product) =>
                            product.concernTags.some((concernTag) =>
                                goalCodes.includes(concernTag),
                            ),
                        ),
                        { goalCodes, primaryGoal, skinType },
                    );

                    expect(new Set(candidates.map(({ name }) => name)).size).toBe(
                        candidates.length,
                    );
                    for (const goalCode of goalCodes) {
                        expect(
                            candidates.filter((product) =>
                                product.concernTags.includes(goalCode),
                            ).length,
                            `${primaryGoal}:${secondaryGoals.join(",")}:${skinType}:${goalCode}`,
                        ).toBeGreaterThanOrEqual(3);
                    }
                }
                combinations += 1;
            }
        }

        expect(combinations).toBe(154);
    });

    it("exporta 68 briefs de imagem com nomes de ficheiro únicos e canónicos", () => {
        const manifest = buildProductImageGenerationManifest();

        expect(manifest).toHaveLength(68);
        expect(new Set(manifest.map(({ imageFileName }) => imageFileName)).size).toBe(
            68,
        );
        for (const product of manifest) {
            expect(product.imageFileName).toMatch(/^[a-z0-9-]+\.png$/);
            expect(product.publicImagePath).toBe(`/products/${product.imageFileName}`);
            expect(product.canonicalSize).toEqual({
                width: 960,
                height: 960,
                format: "png",
            });
            expect(product.imagePrompt).toContain(product.productName);
            expect(product.concernTags.length).toBeGreaterThan(0);
        }
    });
});
