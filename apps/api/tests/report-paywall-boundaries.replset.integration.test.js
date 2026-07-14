/**
 * Barreiras transversais do paywall v2.
 *
 * Prova que endpoints históricos/derivados não contornam o teaser do relatório
 * e que o mesmo conteúdo volta a ficar acessível apenas depois do unlock.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../src/models/makeup-simulation.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { listPublishedConsultantInsightsForClient } from "../src/services/ai-consultation-review.service.js";
import { getFaceReportV2ForUser } from "../src/services/report-access.service.js";
import {
    listRecommendationsForUser,
    submitRecommendationFeedback,
} from "../src/services/recommendation.service.js";
import { listSkinComparisonOptions } from "../src/services/skin-comparison.service.js";
import { getMySkinEvolution } from "../src/services/skin-evolution.service.js";
import { getPersonalSkinHistory } from "../src/services/skin-history.service.js";

const DATABASE_NAME = "orelle_report_paywall_boundaries_test";
const PRIVATE_MARKER = "conteudo-completo-bloqueado";
let replicaSet;

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
        throw new Error("URI externa recusada no teste de paywall");
    }
    await mongoose.connect(uri);
    await Promise.all(
        [
            AiConsultationReview,
            AiConsultationSession,
            FaceAnalysis,
            FaceReport,
            MakeupSimulation,
            Product,
            ProductRecommendation,
            ReportUnlock,
            Voucher,
        ].map((model) => model.syncIndexes()),
    );
}, 30_000);

afterEach(async () => {
    await Promise.all(
        [
            AiConsultationReview,
            AiConsultationSession,
            FaceAnalysis,
            FaceReport,
            MakeupSimulation,
            Product,
            ProductRecommendation,
            ReportUnlock,
            Voucher,
        ].map((model) => model.deleteMany({})),
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

async function createFixture() {
    const userId = new mongoose.Types.ObjectId();
    const analysis = await FaceAnalysis.create({
        schemaVersion: 2,
        userId,
        photoIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        consentId: new mongoose.Types.ObjectId(),
        providerName: "openai-responses",
        providerVersion: "gpt-test",
        mode: "openai",
        isDemo: false,
        findings: {
            skinType: {
                label: PRIVATE_MARKER,
                confidence: 0.8,
                explanation: "Observação cosmética de teste.",
            },
        },
        photoQuality: { status: "pass", reasons: [], warnings: [] },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [PRIVATE_MARKER],
        safetyFlags: [],
        provenance: {
            requestedModel: "gpt-test",
            effectiveModel: "gpt-test",
            requestId: "req-paywall-test",
            promptVersion: "prompt-test-v2",
            schemaVersion: "schema-test-v2",
        },
        status: "completed",
    });
    const consultation = await AiConsultationSession.create({
        userId,
        analysisId: analysis._id,
        goalSelection: {
            primaryGoal: "hydration_barrier",
            secondaryGoals: [],
        },
        conversation: { turns: [], currentQuestion: null },
        facts: {},
        answers: [],
        flowState: "frozen_locked",
        status: "active",
        isOpen: true,
    });
    const report = await FaceReport.create({
        schemaVersion: 2,
        version: 1,
        userId,
        analysisId: analysis._id,
        consultationSessionId: consultation._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        lifecycleStatus: "frozen_locked",
        objectives: [{ code: "hydration_barrier", priority: "primary" }],
        cosmeticSummary: PRIVATE_MARKER,
        routineSuggestions: [
            { period: "manha", title: "Rotina", reason: PRIVATE_MARKER },
        ],
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [PRIVATE_MARKER],
        machineResult: {
            assessment: PRIVATE_MARKER,
            routine: [
                {
                    period: "manha",
                    title: "Rotina",
                    reason: PRIVATE_MARKER,
                    instructions: "Aplicar sobre a pele limpa.",
                    cautions: ["Suspender em caso de desconforto."],
                },
            ],
        },
        privacyStatus: "active",
    });
    consultation.reportId = report._id;
    await consultation.save();
    const product = await Product.create({
        name: "Produto paywall",
        brandName: "Orelle",
        description: "Produto cosmético para o teste do gate.",
        ingredientNames: ["glicerina"],
        skinTypes: ["mista"],
        imageUrl: "/images/paywall.webp",
        priceCents: 2000,
        stock: 5,
        createdBy: new mongoose.Types.ObjectId(),
    });
    const recommendation = await ProductRecommendation.create({
        schemaVersion: 2,
        reportVersion: 1,
        userId,
        analysisId: analysis._id,
        reportId: report._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        productId: product._id,
        productSnapshot: {
            name: product.name,
            priceCents: product.priceCents,
            stock: product.stock,
            available: true,
        },
        selectionRank: 1,
        score: 0.8,
        reasonCodes: ["objective:hydration_barrier"],
        explanation: PRIVATE_MARKER,
        sourceSignals: ["catalog:allowlist"],
        limitations: ["Consulta cosmética não médica."],
        machineResult: {
            explanation: PRIVATE_MARKER,
            usage: "Aplicar de manhã.",
            cautions: [],
        },
        status: "active",
    });
    report.finalRecommendationIds = [recommendation._id];
    await report.save();
    await AiConsultationReview.create({
        schemaVersion: 2,
        userId,
        consultationSessionId: consultation._id,
        reportId: report._id,
        reportVersion: 1,
        recommendationIds: [recommendation._id],
        status: "approved",
        summary: "Revisão cosmética concluída.",
        sourceLabels: ["Catálogo autorizado"],
        limitations: ["Consulta cosmética não médica."],
        publicInsight: {
            note: PRIVATE_MARKER,
            publishedAt: new Date(),
        },
        reviewedBy: new mongoose.Types.ObjectId(),
        reviewedAt: new Date(),
        machineResult: {
            recommendationIds: [recommendation._id],
            summary: "Revisão de teste.",
            sourceLabels: ["Catálogo autorizado"],
            limitations: ["Consulta cosmética não médica."],
            generatedAt: new Date(),
        },
    });
    const unlock = await ReportUnlock.create({
        schemaVersion: 2,
        reportVersion: 1,
        contentHash: "b".repeat(64),
        userId,
        analysisId: analysis._id,
        reportId: report._id,
        recommendationIds: [recommendation._id],
        recommendationSnapshots: [
            {
                recommendationId: recommendation._id,
                productId: product._id,
                variantId: null,
                unitPriceCents: product.priceCents,
                stockAtFreeze: product.stock,
                availableAtFreeze: true,
            },
        ],
        recommendedTotalCents: 2000,
        depositCents: 200,
        availableRecommendationCount: 1,
        status: "locked",
        simulatedPayment: { status: "not_started" },
        frozenAt: new Date(),
    });
    return { userId, analysis, report, recommendation, unlock };
}

describe("paywall transversal do relatório v2", () => {
    it("protege todos os derivados e retoma DTO, voucher, simulação e fontes após unlock", async () => {
        const { userId, analysis, report, recommendation, unlock } =
            await createFixture();
        const [
            historyLocked,
            evolutionLocked,
            comparisonLocked,
            insightsLocked,
            recommendationsLocked,
            reportLocked,
        ] =
            await Promise.all([
                getPersonalSkinHistory(userId.toString()),
                getMySkinEvolution(userId.toString()),
                listSkinComparisonOptions(userId.toString()),
                listPublishedConsultantInsightsForClient(userId.toString()),
                listRecommendationsForUser(userId.toString()),
                getFaceReportV2ForUser(
                    userId.toString(),
                    report._id.toString(),
                ),
            ]);

        expect(JSON.stringify(historyLocked)).not.toContain(PRIVATE_MARKER);
        expect(historyLocked.filter(({ locked }) => locked)).toHaveLength(2);
        expect(evolutionLocked.points).toEqual([]);
        expect(comparisonLocked).toEqual([]);
        expect(insightsLocked).toEqual([]);
        expect(recommendationsLocked).toMatchObject({
            locked: true,
            recommendations: [],
            access: { status: "locked" },
        });
        expect(reportLocked).toMatchObject({
            id: report._id.toString(),
            locked: true,
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            access: {
                status: "locked",
                recommendationCount: 1,
                depositCents: 200,
            },
            voucher: null,
            makeupSimulation: null,
            consentNotices: {
                consultantPhotoAccess: expect.any(String),
                generativeMakeup: expect.any(String),
            },
        });
        expect(reportLocked).not.toHaveProperty("content");
        expect(reportLocked).not.toHaveProperty("sources");
        expect(reportLocked).not.toHaveProperty("recommendations");
        expect(JSON.stringify(reportLocked)).not.toContain(PRIVATE_MARKER);

        await ReportUnlock.updateOne(
            { _id: unlock._id },
            {
                $set: {
                    status: "unlocked",
                    unlockedAt: new Date(),
                    simulatedPayment: {
                        status: "simulated_paid",
                        amountCents: 200,
                        confirmedAt: new Date(),
                        reference: "simulated-paywall-test",
                    },
                },
            },
        );
        await FaceReport.updateOne(
            { _id: report._id },
            { $set: { lifecycleStatus: "unlocked" } },
        );
        await Promise.all([
            Voucher.create({
                userId,
                code: "ORELLE-PAYWALL",
                amountCents: 200,
                remainingCents: 200,
                sourceReportUnlockId: unlock._id,
                status: "active",
            }),
            MakeupSimulation.create({
                schemaVersion: 2,
                userId,
                reportId: report._id,
                facePhotoId: new mongoose.Types.ObjectId(),
                consentId: new mongoose.Types.ObjectId(),
                generativeConsent: {
                    noticeVersion: "generative-makeup-v1",
                    acceptedAt: new Date(),
                },
                recommendationIds: [recommendation._id],
                status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
                requestedModel: "gpt-image-test",
                effectiveModel: "gpt-image-test",
                completedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
            }),
        ]);

        const frozenIdsBeforeFeedback = report.finalRecommendationIds.map(
            String,
        );
        await submitRecommendationFeedback(userId.toString(), {
            recommendationId: recommendation._id.toString(),
            feedback: "nao_relevante",
        });
        const [storedReport, storedRecommendation] = await Promise.all([
            FaceReport.findById(report._id),
            ProductRecommendation.findById(recommendation._id),
        ]);
        expect(storedReport.finalRecommendationIds.map(String)).toEqual(
            frozenIdsBeforeFeedback,
        );
        expect(storedRecommendation.status).toBe("dismissed");

        const [
            historyUnlocked,
            evolutionUnlocked,
            comparisonUnlocked,
            insightsUnlocked,
            recommendationsUnlocked,
            reportUnlocked,
        ] =
            await Promise.all([
                getPersonalSkinHistory(userId.toString()),
                getMySkinEvolution(userId.toString()),
                listSkinComparisonOptions(userId.toString()),
                listPublishedConsultantInsightsForClient(userId.toString()),
                listRecommendationsForUser(userId.toString()),
                getFaceReportV2ForUser(
                    userId.toString(),
                    report._id.toString(),
                ),
            ]);
        expect(JSON.stringify(historyUnlocked)).toContain(PRIVATE_MARKER);
        expect(evolutionUnlocked.points).toHaveLength(1);
        expect(evolutionUnlocked.points[0].analysisId).toBe(
            analysis._id.toString(),
        );
        expect(comparisonUnlocked).toHaveLength(1);
        expect(comparisonUnlocked[0].selectionKey).toBe(
            analysis._id.toString(),
        );
        expect(insightsUnlocked).toHaveLength(1);
        expect(insightsUnlocked[0].note).toBe(PRIVATE_MARKER);
        expect(recommendationsUnlocked).toHaveLength(1);
        expect(recommendationsUnlocked[0].explanation).toBe(PRIVATE_MARKER);
        expect(reportUnlocked).toMatchObject({
            id: report._id.toString(),
            locked: false,
            voucher: {
                code: "ORELLE-PAYWALL",
                amountCents: 200,
                remainingCents: 200,
                status: "active",
            },
            makeupSimulation: {
                status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
                imageUrl: expect.stringContaining("/api/makeup-simulations/"),
                provider: {
                    name: "openai",
                    requestedModel: "gpt-image-test",
                    effectiveModel: "gpt-image-test",
                },
            },
            sources: ["fotografia_frontal", "fotografia_perfil"],
            sourceImageUrl: `/api/me/skin-analyses/${analysis._id.toString()}/image`,
        });
        expect(reportUnlocked.content.assessment).toBe(PRIVATE_MARKER);
        expect(reportUnlocked.routine).toEqual([
            {
                period: "manha",
                title: "Rotina",
                reason: PRIVATE_MARKER,
                instructions: "Aplicar sobre a pele limpa.",
                cautions: ["Suspender em caso de desconforto."],
            },
        ]);
        expect(reportUnlocked.recommendations).toEqual([]);
    });
});
