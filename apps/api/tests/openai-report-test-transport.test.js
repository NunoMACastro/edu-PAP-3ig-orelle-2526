/**
 * Regressão do transport OpenAI test-only no provider de relatório.
 *
 * O relatório cria um cliente próprio, distinto do cliente de análise. Este
 * teste prova que o runtime E2E isolado não faz HTTP real nessa terceira fase.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe("transport test-only do relatório OpenAI", () => {
    it("usa a fixture determinística em NODE_ENV=test sem chamar fetch global", async () => {
        vi.stubEnv("NODE_ENV", "test");
        vi.stubEnv("OPENAI_TEST_FIXTURE_MODE", "true");
        vi.stubEnv("OPENAI_API_KEY", "");
        vi.stubEnv("OPENAI_ANALYSIS_MODEL", "gpt-5.4-mini");
        vi.stubEnv("OPENAI_FALLBACK_MODEL", "gpt-5.4");
        const networkFetch = vi.fn(() => {
            throw new Error("O relatório E2E não pode sair para a rede");
        });
        vi.stubGlobal("fetch", networkFetch);
        vi.resetModules();

        const { generateCosmeticReportWithOpenAi } = await import(
            "../src/providers/openai-report.provider.js"
        );
        const candidates = [1_299, 1_899, 2_199].map(
            (priceCents, index) => ({
                productId: `66a00000000000000000000${index + 1}`,
                priceCents,
                stock: 5,
                available: true,
                variants: [],
            }),
        );
        const result = await generateCosmeticReportWithOpenAi({
            objectives: [
                { code: "acne_imperfections", priority: "primary" },
            ],
            photoQuality: { status: "pass", reasons: [], warnings: [] },
            findings: {},
            safetyFlags: [],
            facts: { budget_cents: 5_000 },
            profileConstraints: {
                skinType: "mista",
                allergies: [],
                avoidIngredients: [],
                restrictions: [],
            },
            candidates,
            selectedRecommendations: candidates.slice(0, 2).map(
                ({ productId }, index) => ({
                    productId,
                    variantId: null,
                    selectionRank: index + 1,
                }),
            ),
        });

        expect(result.value).not.toHaveProperty("recommendationGuidance");
        expect(result.value.routine).toHaveLength(1);
        expect(result.provenance).toMatchObject({
            provider: "openai",
            requestId: "test-openai-request",
        });
        expect(networkFetch).not.toHaveBeenCalled();
    });
});
