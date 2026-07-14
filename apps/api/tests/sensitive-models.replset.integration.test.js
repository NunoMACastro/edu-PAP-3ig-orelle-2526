/**
 * Persistência real dos models protegidos: setters de documento/query, getters
 * autenticados e falha fechada quando um envelope é movido entre campos.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { AiInteractionHistory } from "../src/models/ai-interaction-history.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Profile } from "../src/models/profile.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { listMyAiInteractionHistory } from "../src/services/ai-interaction-history.service.js";
import { getMySkinEvolution } from "../src/services/skin-evolution.service.js";
import { getPersonalSkinHistory } from "../src/services/skin-history.service.js";

const DATABASE_NAME = "orelle_sensitive_models_test";
const PRIVATE_MARKER = "runtime-private-fixture";
let replicaSet;
let ownerId;
let analysis;
let report;
let recommendation;
let review;
let recommendationReview;
let comparison;
let historyEvent;

describe("models com campos sensíveis contextuais", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI dos models sensíveis não é loopback efémera");
        }
        await mongoose.connect(uri);
        ownerId = new mongoose.Types.ObjectId();
        analysis = await FaceAnalysis.create({
            schemaVersion: 2,
            userId: ownerId,
            photoIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            consentId: new mongoose.Types.ObjectId(),
            providerName: "openai",
            providerVersion: "gpt-5.4-mini",
            mode: "openai",
            isDemo: false,
            findings: {
                skinType: { label: PRIVATE_MARKER, confidence: 0.8, explanation: "fixture" },
            },
            photoQuality: {
                status: "pass",
                warnings: [],
                observations: [PRIVATE_MARKER],
            },
            sources: [PRIVATE_MARKER],
            limitations: [PRIVATE_MARKER],
            safetyFlags: [],
            provenance: {
                requestedModel: "gpt-5.4-mini",
                effectiveModel: "gpt-5.4-mini",
                requestId: "req-sensitive-models-fixture",
                promptVersion: "cosmetic-consultation-v2",
                schemaVersion: "cosmetic-consultation-schema-v2",
            },
        });
        report = await FaceReport.create({
            schemaVersion: 2,
            userId: ownerId,
            analysisId: analysis._id,
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-5.4-mini",
            cosmeticSummary: { value: PRIVATE_MARKER },
            routineSuggestions: [{ reason: PRIVATE_MARKER }],
            sources: [PRIVATE_MARKER],
            limitations: [PRIVATE_MARKER],
        });
        await ReportUnlock.create({
            schemaVersion: 2,
            reportVersion: report.version,
            userId: ownerId,
            analysisId: analysis._id,
            reportId: report._id,
            recommendationIds: [],
            recommendationSnapshots: [],
            recommendedTotalCents: 0,
            depositCents: 0,
            availableRecommendationCount: 0,
            status: "unlocked",
            simulatedPayment: {
                status: "not_required",
                amountCents: 0,
            },
            unlockedAt: new Date(),
            frozenAt: new Date(),
            zeroFeeReason: "fixture_without_available_recommendations",
        });
        await Profile.create({
            userId: ownerId,
            nome: "Fixture User",
            idade: 30,
            tipoDePele: "mista",
            genero: "prefiro_nao_dizer",
            allergies: [PRIVATE_MARKER],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
        });
        const session = await AiConsultationSession.create({
            schemaVersion: 2,
            userId: ownerId,
            analysisId: analysis._id,
            reportId: report._id,
            photoIds: analysis.photoIds,
            consentId: analysis.consentId,
            goalSelection: {
                primary: "acne_imperfections",
                secondary: [],
                privateFixture: PRIVATE_MARKER,
            },
            conversation: {
                turns: [],
                currentQuestion: null,
            },
            facts: { fixture: PRIVATE_MARKER },
            answers: [
                {
                    questionId: "notes",
                    type: "text",
                    value: PRIVATE_MARKER,
                    answeredAt: new Date("2026-07-10T09:00:00.000Z"),
                },
            ],
        });
        recommendation = await ProductRecommendation.create({
            schemaVersion: 2,
            userId: ownerId,
            analysisId: analysis._id,
            reportId: report._id,
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-5.4-mini",
            productId: new mongoose.Types.ObjectId(),
            score: 0.8,
            reasonCodes: [PRIVATE_MARKER],
            explanation: `Fixture recommendation ${PRIVATE_MARKER}.`,
            sourceSignals: [`skinType:${PRIVATE_MARKER}`],
            limitations: [PRIVATE_MARKER],
            machineResult: {
                score: 0.8,
                reasonCodes: [PRIVATE_MARKER],
                explanation: `Fixture machine ${PRIVATE_MARKER}.`,
                sourceSignals: [`skinType:${PRIVATE_MARKER}`],
                limitations: [PRIVATE_MARKER],
                generatedAt: new Date(),
                version: "fixture-v1",
            },
        });
        review = await AiConsultationReview.create({
            schemaVersion: 2,
            userId: ownerId,
            consultationSessionId: session._id,
            reportId: report._id,
            recommendationIds: [recommendation._id],
            summary: `Fixture review ${PRIVATE_MARKER} long enough.`,
            sourceLabels: [PRIVATE_MARKER],
            limitations: [PRIVATE_MARKER],
            machineResult: {
                recommendationIds: [recommendation._id],
                summary: `Fixture review machine ${PRIVATE_MARKER}.`,
                sourceLabels: [PRIVATE_MARKER],
                limitations: [PRIVATE_MARKER],
                generatedAt: new Date(),
            },
        });
        recommendationReview = await RecommendationReview.create({
            recommendationId: recommendation._id,
            clientUserId: ownerId,
            consultantId: new mongoose.Types.ObjectId(),
            status: "adjusted",
            note: PRIVATE_MARKER,
            adjustedExplanation: `Ajuste ${PRIVATE_MARKER}`,
        });
        comparison = await SkinComparison.create({
            userId: ownerId,
            baselineAnalysisId: new mongoose.Types.ObjectId(),
            followUpAnalysisId: new mongoose.Types.ObjectId(),
            daysBetween: 31,
            metricDeltas: [
                {
                    metric: "Oleosidade",
                    baselineValue: PRIVATE_MARKER,
                    followUpValue: "moderada",
                    changeLabel: `alterou ${PRIVATE_MARKER}`,
                },
            ],
            summary: `Resumo ${PRIVATE_MARKER}`,
            limitations: [PRIVATE_MARKER],
        });
        historyEvent = await AiInteractionHistory.create({
            userId: ownerId,
            sessionId: session._id,
            eventType: "consultation_submitted",
            purpose: "Contexto cosmético minimizado.",
            safeSummary: PRIVATE_MARKER,
            safeSignals: [
                { key: "main_goal", label: "Objetivo", value: PRIVATE_MARKER },
            ],
            source: "guided_consultation",
        });
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("guarda somente envelopes v2 e restaura os tipos necessários", async () => {
        const [
            rawAnalysis,
            rawReport,
            rawProfile,
            rawSession,
            rawHistory,
            rawRecommendation,
            rawReview,
            rawRecommendationReview,
            rawComparison,
        ] = await Promise.all([
            FaceAnalysis.collection.findOne({ _id: analysis._id }),
            FaceReport.collection.findOne({ _id: report._id }),
            Profile.collection.findOne({ userId: ownerId }),
            AiConsultationSession.collection.findOne({ userId: ownerId }),
            AiInteractionHistory.collection.findOne({ _id: historyEvent._id }),
            ProductRecommendation.collection.findOne({ _id: recommendation._id }),
            AiConsultationReview.collection.findOne({ _id: review._id }),
            RecommendationReview.collection.findOne({
                _id: recommendationReview._id,
            }),
            SkinComparison.collection.findOne({ _id: comparison._id }),
        ]);
        const rawDump = {
            rawAnalysis,
            rawReport,
            rawProfile,
            rawSession,
            rawHistory,
            rawRecommendation,
            rawReview,
            rawRecommendationReview,
            rawComparison,
        };

        expect(JSON.stringify(rawDump)).not.toContain(PRIVATE_MARKER);
        expect(rawAnalysis.findings.keyVersion).toBe(2);
        expect(rawAnalysis.photoQuality.keyVersion).toBe(2);
        expect(rawAnalysis.sources.keyVersion).toBe(2);
        expect(rawAnalysis.limitations.keyVersion).toBe(2);
        expect(rawProfile.allergies.keyVersion).toBe(2);
        expect(rawSession.answers.keyVersion).toBe(2);
        expect(rawSession.goalSelection.keyVersion).toBe(2);
        expect(rawSession.conversation.keyVersion).toBe(2);
        expect(rawSession.facts.keyVersion).toBe(2);
        expect(rawHistory.safeSummary.keyVersion).toBe(2);
        expect(rawHistory.safeSignals.keyVersion).toBe(2);
        for (const field of [
            "reasonCodes",
            "explanation",
            "sourceSignals",
            "limitations",
            "machineResult",
        ]) {
            expect(rawRecommendation[field].keyVersion).toBe(2);
        }
        for (const field of [
            "summary",
            "sourceLabels",
            "limitations",
            "machineResult",
        ]) {
            expect(rawReview[field].keyVersion).toBe(2);
        }
        expect(rawRecommendationReview.note.keyVersion).toBe(2);
        expect(rawRecommendationReview.adjustedExplanation.keyVersion).toBe(2);
        expect(rawComparison.metricDeltas.keyVersion).toBe(2);
        expect(rawComparison.summary.keyVersion).toBe(2);
        expect(rawComparison.limitations.keyVersion).toBe(2);

        const [
            persistedSession,
            persistedRecommendation,
            persistedReview,
            persistedRecommendationReview,
            persistedComparison,
        ] = await Promise.all([
            AiConsultationSession.findById(rawSession._id),
            ProductRecommendation.findById(recommendation._id),
            AiConsultationReview.findById(review._id),
            RecommendationReview.findById(recommendationReview._id),
            SkinComparison.findById(comparison._id),
        ]);
        expect(persistedSession.answers[0].value).toBe(PRIVATE_MARKER);
        expect(persistedSession.answers[0].answeredAt).toBeInstanceOf(Date);
        expect(persistedRecommendation.sourceSignals[0]).toContain(PRIVATE_MARKER);
        expect(persistedRecommendation.machineResult.generatedAt).toBeInstanceOf(Date);
        expect(persistedReview.summary).toContain(PRIVATE_MARKER);
        expect(persistedReview.machineResult.generatedAt).toBeInstanceOf(Date);
        expect(persistedRecommendationReview.note).toBe(PRIVATE_MARKER);
        expect(persistedComparison.metricDeltas[0].baselineValue).toBe(
            PRIVATE_MARKER,
        );
    });

    it("inclui o owner em projeções que decifram campos contextuais", async () => {
        const [skinHistory, evolution, aiHistory] = await Promise.all([
            getPersonalSkinHistory(ownerId.toString()),
            getMySkinEvolution(ownerId.toString()),
            listMyAiInteractionHistory(ownerId.toString(), { limit: 5 }),
        ]);

        expect(skinHistory.some((item) => item.type === "analysis")).toBe(true);
        expect(skinHistory.some((item) => item.type === "report")).toBe(true);
        expect(evolution.points).toHaveLength(1);
        expect(aiHistory[0].safeSummary).toBe(PRIVATE_MARKER);
        expect(aiHistory[0].safeSignals[0].value).toBe(PRIVATE_MARKER);
    });

    it("cifra updates por query sem perder os filtros pesquisáveis", async () => {
        const reviewedAt = new Date("2026-07-10T10:00:00.000Z");
        await Profile.findOneAndUpdate(
            { userId: ownerId },
            { $set: { allergies: [PRIVATE_MARKER] } },
            { new: true, runValidators: true },
        );
        await ProductRecommendation.updateMany(
            { _id: recommendation._id, userId: ownerId },
            {
                $set: {
                    consultantNote: PRIVATE_MARKER,
                    humanOverride: {
                        decision: "adjusted",
                        note: PRIVATE_MARKER,
                        reviewId: new mongoose.Types.ObjectId(),
                        reviewedAt,
                    },
                },
            },
        );
        await AiConsultationReview.findOneAndUpdate(
            { _id: review._id, userId: ownerId, humanOverride: null },
            {
                $set: {
                    status: "approved",
                    publicInsight: { note: PRIVATE_MARKER, publishedAt: reviewedAt },
                    internalNote: PRIVATE_MARKER,
                    humanOverride: {
                        decision: "approved",
                        publicNote: PRIVATE_MARKER,
                        internalNote: PRIVATE_MARKER,
                        reviewId: new mongoose.Types.ObjectId(),
                        reviewedAt,
                    },
                },
            },
            { new: true, runValidators: true },
        );

        const [rawRecommendation, rawReview] = await Promise.all([
            ProductRecommendation.collection.findOne({ _id: recommendation._id }),
            AiConsultationReview.collection.findOne({ _id: review._id }),
        ]);
        expect(JSON.stringify({ rawRecommendation, rawReview })).not.toContain(
            PRIVATE_MARKER,
        );
        expect(rawRecommendation.consultantNote.keyVersion).toBe(2);
        expect(rawRecommendation.humanOverride.keyVersion).toBe(2);
        expect(rawReview.publicInsight.keyVersion).toBe(2);
        expect(rawReview.internalNote.keyVersion).toBe(2);
        expect(rawReview.humanOverride.keyVersion).toBe(2);

        const persistedReview = await AiConsultationReview.findById(review._id);
        const persistedRecommendation = await ProductRecommendation.findById(
            recommendation._id,
        );
        expect(persistedReview.publicInsight.publishedAt).toBeInstanceOf(Date);
        expect(persistedReview.humanOverride.reviewedAt).toBeInstanceOf(Date);
        expect(persistedReview.humanOverride.reviewId).toEqual(expect.any(String));
        expect(persistedReview.humanOverride).not.toHaveProperty("reviewerId");
        expect(persistedRecommendation.humanOverride.reviewId).toEqual(
            expect.any(String),
        );
        expect(persistedRecommendation.humanOverride).not.toHaveProperty(
            "reviewerId",
        );
    });

    it("falha ao mover um payload para outro campo", async () => {
        const rawProfile = await Profile.collection.findOne({ userId: ownerId });
        await Profile.collection.updateOne(
            { _id: rawProfile._id },
            { $set: { avoidIngredients: rawProfile.allergies } },
        );
        const tamperedProfile = await Profile.findById(rawProfile._id);

        expect(() => tamperedProfile.avoidIngredients).toThrow(
            "Conteúdo contextual encriptado inválido",
        );
    });
});
