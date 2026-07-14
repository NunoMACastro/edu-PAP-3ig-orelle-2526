/** Integração da resposta humana que reabre a geração de relatório. */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../src/models/ai-consultation-session.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiJob, AI_JOB_TYPES } from "../src/models/ai-job.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Profile } from "../src/models/profile.model.js";
import { ReportPhotoGrant } from "../src/models/report-photo-grant.model.js";
import { answerAiConsultationQuestion } from "../src/services/ai-consultation.service.js";
import { generateConsultationReportForJob } from "../src/services/consultation-report.service.js";

let replSet;
let previousApiKey;

beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    await mongoose.connect(replSet.getUri("orelle_clarification_test"));
    previousApiKey = env.openAiApiKey;
    env.openAiApiKey = "test-openai-key";
    await Promise.all(
        [
            AiConsultationReview,
            AiConsultationSession,
            AiJob,
            FaceAnalysis,
            FaceConsent,
            FaceReport,
            Product,
            ProductRecommendation,
            Profile,
            ReportPhotoGrant,
        ].map((model) => model.syncIndexes()),
    );
});

afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
        [
            AiConsultationReview,
            AiConsultationSession,
            AiJob,
            FaceAnalysis,
            FaceConsent,
            FaceReport,
            Product,
            ProductRecommendation,
            Profile,
            ReportPhotoGrant,
        ].map((model) => model.deleteMany({})),
    );
});

afterAll(async () => {
    env.openAiApiKey = previousApiKey;
    await mongoose.disconnect();
    await replSet?.stop();
});

describe("AI-E2E-04 - clarification humana", () => {
    it("resolve uma vez e enfileira nova versão do relatório", async () => {
        const userId = new mongoose.Types.ObjectId();
        await FaceConsent.create({
            userId,
            acceptedAt: new Date(),
            version: "face-analysis-v2",
            purpose: "analise_facial_cosmetica",
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                acceptedAt: new Date(),
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        const session = await AiConsultationSession.create({
            userId,
            goalSelection: {
                primaryGoal: "hydration_barrier",
                secondaryGoals: [],
            },
            conversation: { turns: [], currentQuestion: null },
            facts: {},
            answers: [],
            flowState: AI_CONSULTATION_FLOW_STATES.NEEDS_CLARIFICATION,
            status: "active",
            isOpen: true,
            revision: 3,
            logicalOperations: 6,
        });
        const review = await AiConsultationReview.create({
            userId,
            consultationSessionId: session._id,
            status: "needs_clarification",
            summary: "Revisão que requer um dado adicional.",
            sourceLabels: ["relatorio_v2"],
            limitations: ["Informação em falta."],
            machineResult: { version: 1 },
            clarificationRequestedAt: new Date(),
        });
        const question = {
            id: `clarification:${review._id}`,
            revision: 3,
            slotCode: `clarification:${review._id}`,
            type: "short_text",
            label: "Que produto provocou a reação descrita?",
            options: [],
            min: null,
            max: null,
            maxLength: 600,
            source: "human_review",
        };
        session.conversation = {
            turns: [{ kind: "question", question, at: new Date() }],
            currentQuestion: question,
        };
        session.currentReviewId = review._id;
        await session.save();

        const result = await answerAiConsultationQuestion(
            String(userId),
            String(session._id),
            {
                questionId: question.id,
                revision: 3,
                value: "Um creme perfumado que já deixei de utilizar.",
            },
        );
        const [storedReview, storedSession, job] = await Promise.all([
            AiConsultationReview.findById(review._id),
            AiConsultationSession.findById(session._id),
            AiJob.findOne({ consultationSessionId: session._id }),
        ]);

        expect(storedReview.clarificationResolvedAt).toBeInstanceOf(Date);
        expect(storedReview.status).toBe("cancelled");
        expect(storedSession.flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
        );
        expect(storedSession.currentReviewId.toString()).toBe(
            review._id.toString(),
        );
        expect(job.type).toBe(AI_JOB_TYPES.GENERATE_REPORT);
        expect(result.operation.type).toBe(AI_JOB_TYPES.GENERATE_REPORT);

        await expect(
            answerAiConsultationQuestion(String(userId), String(session._id), {
                questionId: question.id,
                revision: 3,
                value: "Replay.",
            }),
        ).rejects.toThrow("pergunta mudou");
    });

    it("cancela review/grant antigos e liga uma nova review pending ao relatório sucessor", async () => {
        const userId = new mongoose.Types.ObjectId();
        const acceptedAt = new Date();
        const consent = await FaceConsent.create({
            userId,
            acceptedAt,
            version: "face-analysis-v2",
            purpose: "analise_facial_cosmetica",
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                acceptedAt,
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: true,
            },
        });
        const analysis = await FaceAnalysis.create({
            schemaVersion: 2,
            userId,
            photoIds: [
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId(),
            ],
            consentId: consent._id,
            providerName: "openai-responses",
            providerVersion: "gpt-test",
            mode: "openai",
            isDemo: false,
            findings: { skinType: { label: "mista" } },
            photoQuality: { status: "pass", warnings: [], reasons: [] },
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: ["Consulta cosmética não médica."],
            safetyFlags: [],
            provenance: {
                requestedModel: "gpt-test",
                effectiveModel: "gpt-test",
                requestId: "req-clarification-successor",
                promptVersion: "analysis-test-v2",
                schemaVersion: "analysis-schema-test-v2",
            },
            status: "completed",
        });
        await Profile.create({
            userId,
            nome: "Cliente Clarification",
            idade: 30,
            tipoDePele: "mista",
            genero: "prefiro_nao_dizer",
            allergies: [],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
        });
        await Product.create({
            name: "Hidratante sucessor",
            brandName: "Orélle Test",
            description: "Produto elegível para o relatório sucessor.",
            ingredientNames: ["glicerina"],
            inciIngredients: ["glycerin"],
            skinTypes: ["mista"],
            imageUrl: "/images/successor.webp",
            priceCents: 1800,
            stock: 4,
            aiEligible: true,
            concernTags: ["hydration_barrier"],
            routineSteps: ["moisturize"],
            createdBy: new mongoose.Types.ObjectId(),
        });
        const session = await AiConsultationSession.create({
            userId,
            analysisId: analysis._id,
            consentId: consent._id,
            goalSelection: {
                primaryGoal: "hydration_barrier",
                secondaryGoals: [],
            },
            conversation: { turns: [], currentQuestion: null },
            facts: {},
            answers: [],
            flowState: AI_CONSULTATION_FLOW_STATES.NEEDS_CLARIFICATION,
            status: "active",
            isOpen: true,
            revision: 3,
            logicalOperations: 6,
        });
        const oldReport = await FaceReport.create({
            schemaVersion: 2,
            version: 1,
            userId,
            analysisId: analysis._id,
            consultationSessionId: session._id,
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-test",
            lifecycleStatus: "needs_clarification",
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            cosmeticSummary: "Versão anterior que requer esclarecimento.",
            routineSuggestions: [],
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: ["Informação em falta."],
            machineResult: { assessment: "Rascunho anterior." },
            privacyStatus: "active",
        });
        const oldReview = await AiConsultationReview.create({
            schemaVersion: 2,
            userId,
            consultationSessionId: session._id,
            reportId: oldReport._id,
            reportVersion: 1,
            recommendationIds: [],
            status: "needs_clarification",
            summary: "É necessário esclarecer uma reação anterior.",
            sourceLabels: ["relatorio_v2"],
            limitations: ["Informação em falta."],
            machineResult: { version: 1 },
            clarificationRequestedAt: new Date(),
        });
        oldReport.reviewId = oldReview._id;
        await oldReport.save();
        const oldGrant = await ReportPhotoGrant.create({
            clientUserId: userId,
            reportId: oldReport._id,
            reviewId: oldReview._id,
            consentId: consent._id,
            noticeVersion: "consultant-photo-access-v1",
            status: "active",
            grantedAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
        });
        const question = {
            id: `clarification:${oldReview._id}`,
            revision: 3,
            slotCode: `human_clarification:${oldReview._id}`,
            type: "short_text",
            label: "Que produto provocou a reação descrita?",
            options: [],
            min: null,
            max: null,
            maxLength: 600,
            source: "human_review",
        };
        session.reportId = oldReport._id;
        session.currentReviewId = oldReview._id;
        session.conversation = {
            turns: [{ kind: "question", question, at: new Date() }],
            currentQuestion: question,
        };
        await session.save();

        await answerAiConsultationQuestion(
            userId.toString(),
            session._id.toString(),
            {
                questionId: question.id,
                revision: 3,
                value: "Um creme perfumado que já deixei de utilizar.",
            },
        );
        const generatingSession = await AiConsultationSession.findById(
            session._id,
        );
        const reportJob = await AiJob.findById(
            generatingSession.currentJobId,
        );
        const provider = vi.fn(async ({ candidates }) => ({
            value: {
                observations: ["Observação cosmética controlada."],
                answerSummary: "A reação anterior ficou esclarecida.",
                assessment: "Avaliação cosmética não médica atualizada.",
                routine: [
                    {
                        period: "manha",
                        title: "Hidratar",
                        reason: "Apoiar o conforto cosmético.",
                        instructions: "Aplicar sobre pele limpa.",
                        cautions: [],
                    },
                ],
                recommendations: [
                    {
                        productId: candidates[0].productId,
                        variantId: null,
                        score: 0.9,
                        reason: "Compatível com o objetivo.",
                        usage: "Aplicar de manhã.",
                        cautions: [],
                    },
                ],
                simulationSpec: {
                    enabled: false,
                    regions: [],
                    lookDescription: null,
                    preserve: [],
                },
                limitations: ["Consulta cosmética não médica."],
                safetyFlags: [],
            },
            provenance: {
                requestedModel: "gpt-test",
                effectiveModel: "gpt-test",
                requestId: "req-report-successor",
                promptVersion: "report-test-v2",
                schemaVersion: "report-schema-test-v2",
            },
        }));

        const generated = await generateConsultationReportForJob(reportJob, {
            reportProvider: provider,
        });
        const [
            storedOldReview,
            storedOldGrant,
            newReport,
            storedSession,
        ] = await Promise.all([
            AiConsultationReview.findById(oldReview._id),
            ReportPhotoGrant.findById(oldGrant._id),
            FaceReport.findById(generated.reportId),
            AiConsultationSession.findById(session._id),
        ]);
        const successorReview = await AiConsultationReview.findById(
            newReport.reviewId,
        );

        expect(storedOldReview).toMatchObject({
            status: "cancelled",
            cancelledAt: expect.any(Date),
            clarificationResolvedAt: expect.any(Date),
        });
        expect(storedOldGrant).toMatchObject({
            status: "revoked",
            revokedAt: expect.any(Date),
            revocationReason: "clarification_report_superseded",
        });
        expect(newReport).toMatchObject({
            lifecycleStatus: "review_pending",
            version: 5,
        });
        expect(successorReview).toMatchObject({
            userId,
            consultationSessionId: session._id,
            reportId: newReport._id,
            reportVersion: 5,
            status: "pending",
        });
        expect(successorReview._id.toString()).not.toBe(
            oldReview._id.toString(),
        );
        expect(storedSession).toMatchObject({
            reportId: newReport._id,
            currentReviewId: successorReview._id,
            flowState: AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING,
        });
        expect(await ProductRecommendation.countDocuments({
            reportId: newReport._id,
        })).toBe(1);
    }, 30_000);
});
