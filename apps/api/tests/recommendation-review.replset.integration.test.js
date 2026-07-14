/**
 * Prova transacional da via compatível de revisão individual de recomendações.
 *
 * Usa exclusivamente um MongoDB replica set efémero em loopback e inspeciona
 * BSON cru para garantir que máquina e texto humano permanecem separados e
 * cifrados, incluindo concorrência e rollback depois do CAS.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { createRecommendationReview } from "../src/services/recommendation-review.service.js";

const DATABASE_NAME = "orelle_recommendation_review_test";
const PRIVATE_MARKER = "legacy-review-private-marker";
let replicaSet;

/**
 * Cria uma recomendação real com snapshot de máquina cifrado.
 *
 * @param {string} label - Sufixo não sensível que isola o fixture.
 * @returns {Promise<{userId: mongoose.Types.ObjectId, recommendation: object}>}
 */
async function createRecommendationFixture(label) {
    const userId = new mongoose.Types.ObjectId();
    const product = await Product.create({
        name: `Produto ${label}`,
        brandName: "Orélle Test",
        description: "Produto cosmético usado apenas no replica set efémero.",
        ingredientNames: ["Aqua"],
        skinTypes: ["mista"],
        imageUrl: `/products/${label}.png`,
        priceCents: 1299,
        stock: 5,
        createdBy: new mongoose.Types.ObjectId(),
    });
    const recommendation = await ProductRecommendation.create({
        userId,
        analysisId: new mongoose.Types.ObjectId(),
        reportId: new mongoose.Types.ObjectId(),
        productId: product._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        score: 0.84,
        reasonCodes: ["skin_type_match"],
        explanation: `Explicação de máquina ${label}.`,
        sourceSignals: ["skinType:mista"],
        limitations: ["Resultado cosmético não médico."],
        machineResult: {
            score: 0.84,
            reasonCodes: ["skin_type_match"],
            explanation: `Snapshot de máquina ${label}.`,
            sourceSignals: ["skinType:mista"],
            limitations: ["Resultado cosmético não médico."],
            generatedAt: new Date("2026-07-10T12:00:00.000Z"),
            version: "recommendation-engine-v2",
        },
    });

    return { userId, recommendation };
}

describe("revisão individual de recomendação em replica set", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de revisão individual não é loopback efémera");
        }

        await mongoose.connect(uri);
        await Promise.all([
            Product.syncIndexes(),
            ProductRecommendation.syncIndexes(),
            RecommendationReview.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("aceita uma de duas decisões concorrentes e preserva máquina separada", async () => {
        const fixture = await createRecommendationFixture("concorrência");
        const consultantId = new mongoose.Types.ObjectId().toString();
        const input = {
            recommendationId: fixture.recommendation._id.toString(),
            status: "adjusted",
            note: `Nota humana ${PRIVATE_MARKER}`,
            adjustedExplanation: `Explicação ajustada ${PRIVATE_MARKER}`,
        };
        const machineResultBefore = fixture.recommendation.machineResult;
        const machineExplanationBefore = fixture.recommendation.explanation;

        const results = await Promise.allSettled([
            createRecommendationReview(consultantId, input),
            createRecommendationReview(consultantId, input),
        ]);
        const fulfilled = results.filter((result) => result.status === "fulfilled");
        const rejected = results.filter((result) => result.status === "rejected");

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect(rejected[0].reason).toMatchObject({ statusCode: 409 });
        expect(fulfilled[0].value.recommendation).toMatchObject({
            status: "adjusted",
            explanation: input.adjustedExplanation,
            machineExplanation: machineExplanationBefore,
        });

        const [storedRecommendation, storedReview, rawRecommendation, rawReview] =
            await Promise.all([
                ProductRecommendation.findById(fixture.recommendation._id),
                RecommendationReview.findOne({
                    recommendationId: fixture.recommendation._id,
                }),
                ProductRecommendation.collection.findOne({
                    _id: fixture.recommendation._id,
                }),
                RecommendationReview.collection.findOne({
                    recommendationId: fixture.recommendation._id,
                }),
            ]);

        expect(
            await RecommendationReview.countDocuments({
                recommendationId: fixture.recommendation._id,
            }),
        ).toBe(1);
        expect(storedRecommendation.humanOverride).toMatchObject({
            decision: "adjusted",
            note: input.note,
            adjustedExplanation: input.adjustedExplanation,
            reviewId: storedReview._id.toString(),
        });
        expect(storedRecommendation.machineResult).toEqual(machineResultBefore);
        expect(storedRecommendation.explanation).toBe(machineExplanationBefore);
        expect(storedReview.note).toBe(input.note);
        expect(storedReview.adjustedExplanation).toBe(input.adjustedExplanation);

        expect(rawRecommendation.humanOverride.keyVersion).toBe(2);
        expect(rawReview.note.keyVersion).toBe(2);
        expect(rawReview.adjustedExplanation.keyVersion).toBe(2);
        expect(JSON.stringify({ rawRecommendation, rawReview })).not.toContain(
            PRIVATE_MARKER,
        );
    });

    it("reverte o CAS se a criação da review falhar e permite retry", async () => {
        const fixture = await createRecommendationFixture("rollback");
        const consultantId = new mongoose.Types.ObjectId().toString();
        const input = {
            recommendationId: fixture.recommendation._id.toString(),
            status: "approved",
            note: `Nota rollback ${PRIVATE_MARKER}`,
            adjustedExplanation: null,
        };
        const createSpy = vi
            .spyOn(RecommendationReview, "create")
            .mockRejectedValueOnce(new Error("review unavailable"));

        await expect(
            createRecommendationReview(consultantId, input),
        ).rejects.toThrow("review unavailable");
        createSpy.mockRestore();

        const rolledBack = await ProductRecommendation.findById(
            fixture.recommendation._id,
        );
        expect(rolledBack.status).toBe("active");
        expect(rolledBack.humanOverride).toBeNull();
        expect(rolledBack.consultantNote).toBeNull();
        expect(
            await RecommendationReview.countDocuments({
                recommendationId: fixture.recommendation._id,
            }),
        ).toBe(0);

        const retried = await createRecommendationReview(consultantId, input);
        expect(retried).toMatchObject({
            status: "approved",
            recommendation: {
                status: "accepted",
                explanation: fixture.recommendation.explanation,
                machineExplanation: fixture.recommendation.explanation,
            },
        });
        expect(
            await RecommendationReview.countDocuments({
                recommendationId: fixture.recommendation._id,
            }),
        ).toBe(1);
    });
});
