/**
 * Smoke OpenAI multimodal opt-in; nunca participa no `verify:all` normal.
 *
 * Usa apenas retratos vetoriais sintéticos criados em memória. Com chave, o
 * comando consome créditos e testa Responses vision, relatório estruturado e
 * GPT Image edit. A edição pode exigir Organization Verification da conta.
 */
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { editMakeupPhotoWithOpenAi } from "../src/providers/openai-makeup-edit.provider.js";
import { generateCosmeticReportWithOpenAi } from "../src/providers/openai-report.provider.js";
import { analyzeSkinPhotosWithOpenAiV2 } from "../src/providers/openai-responses.provider.js";

const liveEnabled =
    process.env.ORELLE_LIVE_OPENAI_TEST === "true" &&
    Boolean(process.env.OPENAI_API_KEY);

/** Cria uma imagem de rosto ilustrado sem usar fotografia ou PII. */
async function createSyntheticPortrait({ profile = false } = {}) {
    const eyeMarkup = profile
        ? '<ellipse cx="535" cy="405" rx="20" ry="14" fill="#33251f" />'
        : [
              '<ellipse cx="395" cy="405" rx="20" ry="14" fill="#33251f" />',
              '<ellipse cx="565" cy="405" rx="20" ry="14" fill="#33251f" />',
          ].join("");
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="960">
            <rect width="960" height="960" fill="#e9dfd4" />
            <ellipse cx="480" cy="480" rx="245" ry="320" fill="#c98f70" />
            ${eyeMarkup}
            <path d="M480 430 L${profile ? 570 : 480} 560 L445 570" fill="none" stroke="#754b3b" stroke-width="12" />
            <path d="M385 650 Q480 700 575 650" fill="none" stroke="#8d4a4f" stroke-width="18" />
            <path d="M280 260 Q480 80 680 260" fill="none" stroke="#4d342c" stroke-width="80" />
        </svg>`;
    return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

function toVisionPhoto(buffer) {
    return {
        mimeType: "image/webp",
        sizeBytes: buffer.length,
        imageBase64: buffer.toString("base64"),
    };
}

describe.skipIf(!liveEnabled)("OpenAI live multimodal opt-in", () => {
    it(
        "executa vision, relatório estruturado e edição GPT Image com assets sintéticos",
        async () => {
            const frontal = await createSyntheticPortrait();
            const perfil = await createSyntheticPortrait({ profile: true });

            const analysis = await analyzeSkinPhotosWithOpenAiV2({
                frontalPhoto: toVisionPhoto(frontal),
                perfilPhoto: toVisionPhoto(perfil),
                objectives: ["makeup"],
            });
            expect(analysis.providerName).toBe("openai-responses");
            expect(["pass", "warning", "inconclusive"]).toContain(
                analysis.photoQuality.status,
            );
            expect(analysis.provenance.requestId).toBeTruthy();

            const productId = "64b000000000000000000001";
            const candidate = {
                productId,
                productName: "Base sintética de teste",
                concernTags: ["makeup"],
                routineSteps: ["complexion"],
                ingredients: ["mica", "iron oxides"],
                variants: [
                    {
                        variantId: "neutral-test",
                        label: "Neutro sintético",
                        colorHex: "#B9855E",
                        finish: "natural",
                        coverage: "light",
                        priceCents: 2_490,
                        stock: 5,
                        available: true,
                    },
                ],
            };
            const reportResponse = await generateCosmeticReportWithOpenAi({
                objectives: [{ code: "makeup", priority: "primary" }],
                photoQuality: analysis.photoQuality,
                findings: analysis.findings ?? {
                    status: "inconclusive_synthetic_asset",
                },
                safetyFlags: analysis.safetyFlags ?? [],
                facts: {
                    budget_cents: 5_000,
                    current_routine: "Rotina sintética de teste.",
                    allergies_restrictions: "Nenhuma no cenário sintético.",
                    makeup_context: "daily",
                    coverage_preference: "light",
                    finish_preference: "natural",
                    makeup_regions: ["complexion"],
                },
                profileConstraints: {
                    skinType: "normal",
                    allergies: [],
                    avoidIngredients: [],
                    budgetCents: 5_000,
                },
                candidates: [candidate],
            });
            expect(reportResponse.value.recommendations).toHaveLength(1);
            expect(reportResponse.value.recommendations[0]).toMatchObject({
                productId,
                variantId: "neutral-test",
            });
            expect(reportResponse.provenance.requestId).toBeTruthy();

            const simulationSpec = reportResponse.value.simulationSpec.enabled
                ? reportResponse.value.simulationSpec
                : {
                      enabled: true,
                      regions: ["complexion"],
                      lookDescription: "Cobertura leve e acabamento natural.",
                      preserve: [
                          "identity",
                          "face_structure",
                          "skin_features",
                          "hair",
                          "background",
                          "lighting",
                      ],
                  };
            const edited = await editMakeupPhotoWithOpenAi({
                sourceImage: frontal,
                sourceMimeType: "image/webp",
                simulationSpec,
                recommendations: [
                    {
                        productName: candidate.productName,
                        variantLabel: candidate.variants[0].label,
                        colorHex: candidate.variants[0].colorHex,
                        finish: candidate.variants[0].finish,
                        coverage: candidate.variants[0].coverage,
                    },
                ],
            });
            const metadata = await sharp(edited.imageBuffer).metadata();
            expect(metadata.format).toBe("webp");
            expect(edited.provenance.provider).toBe("openai");
            expect(edited.provenance.requestId).toBeTruthy();
        },
        360_000,
    );
});
