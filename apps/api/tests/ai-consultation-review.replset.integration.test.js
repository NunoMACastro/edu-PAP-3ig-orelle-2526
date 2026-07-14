/**
 * Prova concorrente e transacional da revisão humana de recomendações IA.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import {
    decideAiConsultationReview,
    getAiConsultationReviewForConsultant,
    listAiConsultationReviewsForConsultant,
} from "../src/services/ai-consultation-review.service.js";

const DATABASE_NAME = "orelle_ai_review_test";
let replicaSet;
let fixture;

async function createReviewFixture(label) {
    const userId = new mongoose.Types.ObjectId();
    const recommendation = await ProductRecommendation.create({
        userId,
        analysisId: new mongoose.Types.ObjectId(),
        reportId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        score: 0.82,
        reasonCodes: ["skin_type_match"],
        explanation: "Recomendação cosmética controlada para o teste.",
        sourceSignals: ["skinType:mista"],
        limitations: ["Resultado cosmético não médico."],
        machineResult: {
            score: 0.82,
            reasonCodes: ["skin_type_match"],
            explanation: "Recomendação cosmética controlada para o teste.",
            sourceSignals: ["skinType:mista"],
            limitations: ["Resultado cosmético não médico."],
            generatedAt: new Date(),
            version: "recommendation-engine-v2",
        },
    });
    const review = await AiConsultationReview.create({
        userId,
        consultationSessionId: new mongoose.Types.ObjectId(),
        recommendationIds: [recommendation._id],
        status: "pending",
        summary: `Revisão humana concorrente ${label} com recomendação válida.`,
        sourceLabels: ["tipo de pele"],
        limitations: ["Resultado cosmético não médico."],
        machineResult: {
            recommendationIds: [recommendation._id],
            summary: `Snapshot de máquina ${label} para revisão humana.`,
            sourceLabels: ["tipo de pele"],
            limitations: ["Resultado cosmético não médico."],
            generatedAt: new Date(),
        },
    });

    return { userId, recommendation, review };
}

describe("revisão humana IA em replica set", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de revisão IA não é loopback efémera");
        }

        await mongoose.connect(uri);
        await Promise.all([
            Product.syncIndexes(),
            ProductRecommendation.syncIndexes(),
            AiConsultationReview.syncIndexes(),
            AiConsultationAuditLog.syncIndexes(),
        ]);
        fixture = await createReviewFixture("principal");
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("duas decisões concorrentes produzem um sucesso, um 409 e um audit", async () => {
        const consultant = {
            id: new mongoose.Types.ObjectId().toString(),
            role: "consultor",
        };
        const input = {
            reviewId: fixture.review._id.toString(),
            decision: "approved",
            publicNote: "Recomendação validada pelo consultor.",
            internalNote: "Decisão concorrente de teste.",
            adjustedRecommendationIds: [],
        };
        const results = await Promise.allSettled([
            decideAiConsultationReview(consultant, input, {
                requestId: "review-race-a",
            }),
            decideAiConsultationReview(consultant, input, {
                requestId: "review-race-b",
            }),
        ]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        const rejected = results.find((result) => result.status === "rejected");
        expect(rejected.reason.statusCode).toBe(409);

        const [stored, rawStored] = await Promise.all([
            AiConsultationReview.findById(fixture.review._id),
            AiConsultationReview.collection.findOne({ _id: fixture.review._id }),
        ]);
        expect(stored.status).toBe("approved");
        expect(stored.humanOverride.decision).toBe("approved");
        expect(rawStored.humanOverride.keyVersion).toBe(2);
        expect(stored.auditTrail).toHaveLength(1);
        expect(
            await AiConsultationAuditLog.countDocuments({
                reviewId: fixture.review._id,
                action: "decision",
            }),
        ).toBe(1);
    });

    it("reverte review e audit quando outra decisão já ganhou o CAS da recomendação", async () => {
        const lostRaceFixture = await createReviewFixture("CAS perdido");
        const existingOverride = {
            decision: "adjusted",
            note: "Ajuste humano vencedor preservado.",
            reviewId: new mongoose.Types.ObjectId(),
            reviewedAt: new Date("2026-07-10T11:00:00.000Z"),
        };
        const winningRecommendation =
            await ProductRecommendation.findOneAndUpdate(
                {
                    _id: lostRaceFixture.recommendation._id,
                    userId: lostRaceFixture.userId,
                    humanOverride: null,
                },
                {
                    $set: {
                        status: "adjusted",
                        consultantNote: existingOverride.note,
                        humanOverride: existingOverride,
                    },
                },
                { new: true, runValidators: true },
            );
        expect(winningRecommendation).not.toBeNull();

        const machineResultBefore = winningRecommendation.machineResult;
        const explanationBefore = winningRecommendation.explanation;
        const humanOverrideBefore = winningRecommendation.humanOverride;
        const reviewMachineResultBefore = lostRaceFixture.review.machineResult;
        const consultant = {
            id: new mongoose.Types.ObjectId().toString(),
            role: "consultor",
        };

        await expect(
            decideAiConsultationReview(
                consultant,
                {
                    reviewId: lostRaceFixture.review._id.toString(),
                    decision: "adjusted",
                    publicNote: "Tentativa tardia que deve ser revertida.",
                    internalNote: "A recomendação já tinha decisão humana.",
                    adjustedRecommendationIds: [
                        lostRaceFixture.recommendation._id.toString(),
                    ],
                },
                { requestId: "review-recommendation-cas-lost" },
            ),
        ).rejects.toMatchObject({ statusCode: 409 });

        const [storedReview, storedRecommendation, decisionAuditCount] =
            await Promise.all([
                AiConsultationReview.findById(lostRaceFixture.review._id),
                ProductRecommendation.findById(
                    lostRaceFixture.recommendation._id,
                ),
                AiConsultationAuditLog.countDocuments({
                    reviewId: lostRaceFixture.review._id,
                    action: "decision",
                }),
            ]);

        expect(storedReview.status).toBe("pending");
        expect(storedReview.humanOverride).toBeNull();
        expect(storedReview.publicInsight).toBeNull();
        expect(storedReview.internalNote).toBeNull();
        expect(storedReview.reviewedBy).toBeNull();
        expect(storedReview.reviewedAt).toBeNull();
        expect(storedReview.auditTrail).toHaveLength(0);
        expect(storedReview.machineResult).toEqual(reviewMachineResultBefore);
        expect(decisionAuditCount).toBe(0);

        expect(storedRecommendation.status).toBe("adjusted");
        expect(storedRecommendation.humanOverride).toEqual(humanOverrideBefore);
        expect(storedRecommendation.machineResult).toEqual(machineResultBefore);
        expect(storedRecommendation.explanation).toBe(explanationBefore);
    });

    it("falha do audit decision reverte o CAS da revisão", async () => {
        const rollbackFixture = await createReviewFixture("rollback");
        const createSpy = vi
            .spyOn(AiConsultationAuditLog, "create")
            .mockRejectedValueOnce(new Error("audit unavailable"));

        await expect(
            decideAiConsultationReview(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "administrador",
                },
                {
                    reviewId: rollbackFixture.review._id.toString(),
                    decision: "approved",
                    publicNote: "Decisão que deve sofrer rollback.",
                    internalNote: null,
                    adjustedRecommendationIds: [],
                },
                { requestId: "review-rollback" },
            ),
        ).rejects.toThrow("audit unavailable");
        const stored = await AiConsultationReview.findById(
            rollbackFixture.review._id,
        ).lean();
        expect(stored.status).toBe("pending");
        expect(stored.humanOverride).toBeNull();
        expect(stored.auditTrail).toHaveLength(0);
    });

    it("listagem e detalhe autorizados acrescentam audits sem expor ator", async () => {
        const actor = {
            id: new mongoose.Types.ObjectId().toString(),
            role: "administrador",
        };
        const pendingFixture = await createReviewFixture("leitura");
        const list = await listAiConsultationReviewsForConsultant(actor, {
            requestId: "review-list",
        });
        const detail = await getAiConsultationReviewForConsultant(
            actor,
            pendingFixture.review._id.toString(),
            { requestId: "review-detail" },
        );

        expect(list.length).toBeGreaterThan(0);
        expect(JSON.stringify(list)).not.toContain(actor.id);
        expect(JSON.stringify(detail)).not.toContain(actor.id);
        expect(
            await AiConsultationAuditLog.countDocuments({
                actorId: actor.id,
                action: { $in: ["list", "detail"] },
            }),
        ).toBe(2);
    });
});
