/**
 * Revalidação do subset escolhido pelo consultor no instante da decisão.
 * As fixtures usam snapshots v2 reais e provam que perfil e catálogo não
 * podem mudar silenciosamente enquanto uma revisão humana está pendente.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Profile } from "../src/models/profile.model.js";
import {
    decideAiConsultationReview,
    getAiConsultationReviewForConsultant,
    revalidateAdjustedRecommendations,
} from "../src/services/ai-consultation-review.service.js";
import { listReportRecommendationDtos } from "../src/services/report-recommendation-read.service.js";

const DATABASE_NAME = "orelle_report_review_revalidation_test";
let replicaSet;

async function createAdjustmentDecisionFixture(
    { withRecommendation = true } = {},
) {
    const userId = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();
    const session = await AiConsultationSession.create({
        userId,
        analysisId,
        goalSelection: { primaryGoal: "makeup", secondaryGoals: [] },
        conversation: { turns: [], currentQuestion: null },
        facts: {},
        answers: [],
        flowState: "review_pending",
        status: "active",
        isOpen: true,
        revision: 6,
    });
    const report = await FaceReport.create({
        schemaVersion: 2,
        version: 7,
        userId,
        analysisId,
        consultationSessionId: session._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-5.4-mini",
        lifecycleStatus: "review_pending",
        objectives: [{ code: "makeup", priority: "primary" }],
        cosmeticSummary: "Relatório de maquilhagem em revisão.",
        routineSuggestions: [
            {
                period: "manha",
                title: "Preparação",
                reason: "Preparar a pele antes da maquilhagem.",
            },
        ],
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Pré-visualização cosmética não garante resultado real."],
        machineResult: {
            objectivesAssessment: "Avaliação cosmética original.",
            routine: [
                {
                    period: "manha",
                    title: "Preparação",
                    reason: "Preparar a pele antes da maquilhagem.",
                    instructions: "Aplicar uma camada fina antes da base.",
                    cautions: ["Aguardar absorção antes de continuar."],
                },
            ],
            recommendations: [],
        },
        simulationSpec: {
            enabled: true,
            regions: ["complexion"],
            lookDescription: "Look com a variante inicialmente recomendada.",
            preserve: ["identity", "skin_features"],
        },
        privacyStatus: "active",
    });
    let product = null;
    let recommendation = null;
    if (withRecommendation) {
        product = await Product.create({
            name: "Primer sem variante",
            brandName: "Orélle Test",
            description: "Produto sem variante escolhido no ajuste humano.",
            ingredientNames: ["glycerin"],
            inciIngredients: ["glycerin"],
            skinTypes: ["mista"],
            imageUrl: "/images/primer-no-variant.webp",
            priceCents: 2100,
            stock: 6,
            aiEligible: true,
            concernTags: ["makeup"],
            routineSteps: ["prime"],
            variants: [],
            createdBy: new mongoose.Types.ObjectId(),
        });
        await Profile.create({
            userId,
            nome: "Cliente Ajuste",
            idade: 29,
            tipoDePele: "mista",
            genero: "prefiro_nao_dizer",
            allergies: [],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
        });
        recommendation = await ProductRecommendation.create({
            schemaVersion: 2,
            reportVersion: report.version,
            userId,
            analysisId,
            reportId: report._id,
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-5.4-mini",
            productId: product._id,
            variantId: null,
            productSnapshot: {
                productId: product._id.toString(),
                name: product.name,
                priceCents: product.priceCents,
                stock: product.stock,
                available: true,
                variant: null,
            },
            selectionRank: 1,
            candidateAllowlistHash: "c".repeat(64),
            score: 0.84,
            reasonCodes: ["goal_match"],
            explanation: "Produto compatível sem variante de cor.",
            sourceSignals: ["goal:makeup"],
            limitations: ["O resultado real pode variar."],
            machineResult: {
                reason: "Produto de preparação cosmética.",
                usage: "Aplicar antes da maquilhagem.",
                cautions: ["Suspender em caso de desconforto."],
            },
            humanOverride: null,
            status: "active",
        });
    }
    const review = await AiConsultationReview.create({
        schemaVersion: 2,
        userId,
        consultationSessionId: session._id,
        reportId: report._id,
        reportVersion: report.version,
        recommendationIds: recommendation ? [recommendation._id] : [],
        status: "pending",
        summary: "Revisão da rotina e seleção de maquilhagem.",
        sourceLabels: ["Análise OpenAI", "Catálogo validado"],
        limitations: ["Consulta cosmética não médica."],
        machineResult: report.machineResult,
        humanOverride: null,
    });
    report.reviewId = review._id;
    report.finalRecommendationIds = recommendation ? [recommendation._id] : [];
    await report.save();
    session.reportId = report._id;
    session.currentReviewId = review._id;
    await session.save();
    return { userId, session, report, product, recommendation, review };
}

async function createFixture(label) {
    const userId = new mongoose.Types.ObjectId();
    const reportId = new mongoose.Types.ObjectId();
    const product = await Product.create({
        name: `Sérum seguro ${label}`,
        brandName: "Orélle Test",
        description: "Produto de teste curado para revisão humana v2.",
        ingredientNames: ["niacinamide"],
        inciIngredients: ["niacinamide"],
        skinTypes: ["mista"],
        imageUrl: "/images/review-safe.webp",
        priceCents: 2400,
        stock: 5,
        aiEligible: true,
        concernTags: ["hydration_barrier"],
        routineSteps: ["treat"],
        createdBy: new mongoose.Types.ObjectId(),
    });
    await Profile.create({
        userId,
        nome: `Cliente ${label}`,
        idade: 30,
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        allergies: [],
        avoidIngredients: [],
        lightMedicalRestrictions: [],
    });
    const recommendation = await ProductRecommendation.create({
        userId,
        analysisId: new mongoose.Types.ObjectId(),
        reportId,
        schemaVersion: 2,
        reportVersion: 1,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-5.4-mini",
        productId: product._id,
        variantId: null,
        productSnapshot: {
            productId: product._id.toString(),
            name: product.name,
            brandName: product.brandName,
            description: product.description,
            ingredientNames: product.inciIngredients,
            imageUrl: product.imageUrl,
            priceCents: product.priceCents,
            stock: product.stock,
            available: true,
            variant: null,
            capturedAt: new Date(),
        },
        selectionRank: 1,
        candidateAllowlistHash: "a".repeat(64),
        score: 0.9,
        reasonCodes: ["goal_match"],
        explanation: "Produto pertencente à allowlist e compatível no relatório.",
        sourceSignals: ["goal:hydration_barrier"],
        limitations: ["Confirmar sempre a tolerância individual."],
        machineResult: {
            reason: "Compatibilidade cosmética validada.",
            generatedAt: new Date(),
        },
        humanOverride: null,
        status: "active",
    });
    return {
        userId,
        reportId,
        report: {
            _id: reportId,
            userId,
            version: 1,
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
        },
        product,
        recommendation,
        review: { schemaVersion: 2, userId, reportId, reportVersion: 1 },
    };
}

/** Revalida a recomendação única contra o relatório congelado da fixture. */
function revalidateFixtureRecommendation(fixture) {
    return revalidateAdjustedRecommendations(
        fixture.review,
        [fixture.recommendation._id.toString()],
        { report: fixture.report },
    );
}

/** Replica a orientação original no contrato v6 do consultor. */
function unchangedRecommendationGuidance(fixture) {
    if (!fixture.recommendation) return [];
    return [
        {
            recommendationId: fixture.recommendation._id.toString(),
            explanation: fixture.recommendation.explanation,
            usage: fixture.recommendation.machineResult.usage,
            cautions: fixture.recommendation.machineResult.cautions,
        },
    ];
}

describe("revalidação transacional de ajustes humanos", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de teste não é loopback efémera");
        }
        await mongoose.connect(uri);
        await Promise.all([
            AiConsultationAuditLog.syncIndexes(),
            AiConsultationReview.syncIndexes(),
            AiConsultationSession.syncIndexes(),
            FaceReport.syncIndexes(),
            Product.syncIndexes(),
            ProductRecommendation.syncIndexes(),
            Profile.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        await Promise.all([
            AiConsultationAuditLog.deleteMany({}),
            AiConsultationReview.deleteMany({}),
            AiConsultationSession.deleteMany({}),
            FaceReport.deleteMany({}),
            ProductRecommendation.deleteMany({}),
            Product.deleteMany({}),
            Profile.deleteMany({}),
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("preserva a compatibilidade de revisão legacy schema v1", async () => {
        const legacyReview = {
            schemaVersion: 1,
            userId: new mongoose.Types.ObjectId(),
        };

        for (const recommendationIds of [
            [],
            [new mongoose.Types.ObjectId().toString()],
        ]) {
            await expect(
                revalidateAdjustedRecommendations(
                    legacyReview,
                    recommendationIds,
                    { report: null },
                ),
            ).resolves.toBeUndefined();
        }
    });

    it.each([
        {
            boundary: "report ID",
            mutateReport: (fixture) => ({
                ...fixture.report,
                _id: new mongoose.Types.ObjectId(),
            }),
        },
        {
            boundary: "user ID",
            mutateReport: (fixture) => ({
                ...fixture.report,
                userId: new mongoose.Types.ObjectId(),
            }),
        },
        {
            boundary: "report version",
            mutateReport: (fixture) => ({
                ...fixture.report,
                version: fixture.report.version + 1,
            }),
        },
    ])(
        "recusa mismatch de $boundary com seleção vazia e não vazia",
        async ({ boundary, mutateReport }) => {
            const fixture = await createFixture(`mismatch ${boundary}`);
            const mismatchedReport = mutateReport(fixture);
            const selectedRecommendationIds = [
                fixture.recommendation._id.toString(),
            ];

            for (const recommendationIds of [
                [],
                selectedRecommendationIds,
            ]) {
                await expect(
                    revalidateAdjustedRecommendations(
                        fixture.review,
                        recommendationIds,
                        { report: mismatchedReport },
                    ),
                ).rejects.toMatchObject({
                    statusCode: 409,
                    details: { code: "REVIEW_STALE" },
                });
            }
        },
    );

    it("valida objetivos autoritativos mesmo sem produtos selecionados", async () => {
        const fixture = await createFixture("objetivos sem produtos");

        await expect(
            revalidateAdjustedRecommendations(fixture.review, [], {
                report: { ...fixture.report, objectives: [] },
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: { code: "REVIEW_STALE" },
        });
    });

    it("recusa recomendação de outra versão do mesmo relatório", async () => {
        const fixture = await createFixture("versão da recomendação");
        fixture.recommendation.reportVersion = fixture.report.version + 1;
        await fixture.recommendation.save();

        await expect(revalidateFixtureRecommendation(fixture)).rejects.toMatchObject({
            statusCode: 409,
            message: "Recomendações ou perfil mudaram durante a revisão",
        });
    });

    it("recusa produto que passou a colidir com alergias do perfil", async () => {
        const fixture = await createFixture("alergia");
        await expect(
            revalidateAdjustedRecommendations(
                fixture.review,
                [fixture.recommendation._id.toString()],
                { report: fixture.report },
            ),
        ).resolves.toBeUndefined();

        const profile = await Profile.findOne({ userId: fixture.userId });
        profile.allergies = ["niacinamide"];
        await profile.save();

        await expect(
            revalidateAdjustedRecommendations(
                fixture.review,
                [fixture.recommendation._id.toString()],
                { report: fixture.report },
            ),
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("recusa snapshot cujo stock mudou durante a revisão", async () => {
        const fixture = await createFixture("stock");
        fixture.product.stock = 4;
        await fixture.product.save();

        await expect(
            revalidateAdjustedRecommendations(
                fixture.review,
                [fixture.recommendation._id.toString()],
                { report: fixture.report },
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Preço ou stock mudou; atualiza a revisão antes de decidir",
        });
    });

    it("reverte a decisão quando concernTags deixam de corresponder aos objetivos congelados", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        fixture.product.concernTags = ["hydration_barrier"];
        await fixture.product.save();

        await expect(
            decideAiConsultationReview(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                {
                    reviewId: fixture.review._id.toString(),
                    decision: "adjusted",
                    publicNote:
                        "Ajuste que não pode aceitar um produto incompatível.",
                    internalNote: null,
                    adjustedRecommendationIds: [
                        fixture.recommendation._id.toString(),
                    ],
                    adjustedContent: {
                        assessment:
                            "Avaliação materialmente ajustada pelo consultor humano.",
                        routine: null,
                        recommendations:
                            unchangedRecommendationGuidance(fixture),
                    },
                },
                { requestId: "review-concern-mismatch" },
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: {
                code: "REVIEW_STALE",
                reason: "product_objective_mismatch",
            },
        });

        const [storedReview, storedReport, storedRecommendation, auditCount] =
            await Promise.all([
                AiConsultationReview.findById(fixture.review._id),
                FaceReport.findById(fixture.report._id),
                ProductRecommendation.findById(fixture.recommendation._id),
                AiConsultationAuditLog.countDocuments({
                    reviewId: fixture.review._id,
                    action: "decision",
                }),
            ]);
        expect(storedReview.status).toBe("pending");
        expect(storedReview.humanOverride).toBeNull();
        expect(storedReport.lifecycleStatus).toBe("review_pending");
        expect(storedReport.humanOverride).toBeNull();
        expect(storedRecommendation.status).toBe("active");
        expect(storedRecommendation.humanOverride).toBeNull();
        expect(auditCount).toBe(0);
    });

    it("reverte a decisão quando a versão autoritativa do relatório mudou", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        fixture.report.version += 1;
        await fixture.report.save();

        await expect(
            decideAiConsultationReview(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                {
                    reviewId: fixture.review._id.toString(),
                    decision: "adjusted",
                    publicNote:
                        "Ajuste recusado porque a versão do relatório mudou.",
                    internalNote: null,
                    adjustedRecommendationIds: [
                        fixture.recommendation._id.toString(),
                    ],
                    adjustedContent: {
                        assessment:
                            "Avaliação material que não pode atingir outra versão.",
                        routine: null,
                        recommendations:
                            unchangedRecommendationGuidance(fixture),
                    },
                },
                { requestId: "review-report-version-mismatch" },
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Relatório de revisão mudou concorrentemente",
        });

        const [storedReview, storedReport, storedRecommendation, auditCount] =
            await Promise.all([
                AiConsultationReview.findById(fixture.review._id),
                FaceReport.findById(fixture.report._id),
                ProductRecommendation.findById(fixture.recommendation._id),
                AiConsultationAuditLog.countDocuments({
                    reviewId: fixture.review._id,
                    action: "decision",
                }),
            ]);
        expect(storedReview.status).toBe("pending");
        expect(storedReview.humanOverride).toBeNull();
        expect(storedReport.lifecycleStatus).toBe("review_pending");
        expect(storedReport.humanOverride).toBeNull();
        expect(storedRecommendation.status).toBe("active");
        expect(storedRecommendation.humanOverride).toBeNull();
        expect(auditCount).toBe(0);
    });

    it("falha fechado quando o relatório não fornece objetivos autoritativos", async () => {
        const fixture = await createFixture("objetivos ausentes");

        await expect(
            revalidateAdjustedRecommendations(
                fixture.review,
                [fixture.recommendation._id.toString()],
                { report: { ...fixture.report, objectives: [] } },
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: { code: "REVIEW_STALE" },
        });
    });

    it("recusa produto que deixou de estar elegível para IA", async () => {
        const fixture = await createFixture("ineligível");
        fixture.product.aiEligible = false;
        await fixture.product.save();

        await expect(revalidateFixtureRecommendation(fixture)).rejects.toMatchObject({
            statusCode: 409,
            message: "Produto deixou de estar elegível para IA",
        });
    });

    it("recusa snapshot cujo preço mudou durante a revisão", async () => {
        const fixture = await createFixture("preço");
        fixture.product.priceCents += 100;
        await fixture.product.save();

        await expect(revalidateFixtureRecommendation(fixture)).rejects.toMatchObject({
            statusCode: 409,
            message: "Preço ou stock mudou; atualiza a revisão antes de decidir",
        });
    });

    it("recusa variante removida depois de congelar a recomendação", async () => {
        const fixture = await createFixture("variante");
        fixture.product.variants = [
            {
                variantId: "neutral",
                label: "Neutral",
                priceCents: fixture.product.priceCents,
                stock: fixture.product.stock,
            },
        ];
        await fixture.product.save();
        fixture.recommendation.variantId = "neutral";
        fixture.recommendation.productSnapshot = {
            ...fixture.recommendation.productSnapshot,
            variant: { variantId: "neutral", label: "Neutral" },
        };
        await fixture.recommendation.save();
        await expect(revalidateFixtureRecommendation(fixture)).resolves.toBeUndefined();

        fixture.product.variants = [];
        await fixture.product.save();

        await expect(revalidateFixtureRecommendation(fixture)).rejects.toMatchObject({
            statusCode: 409,
            message: "Variante recomendada deixou de estar disponível",
        });
    });

    it("preserva rotina ajustada completa e desativa simulação sem variantes", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        const adjustedRoutine = [
            {
                period: "manha",
                title: "Preparação ajustada",
                reason: "Simplificar a preparação cosmética antes da base.",
                instructions:
                    "Aplicar uma camada fina e aguardar dois minutos.",
                cautions: [
                    "Evitar o contorno ocular.",
                    "Suspender se surgir desconforto persistente.",
                ],
            },
        ];

        await decideAiConsultationReview(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "consultor",
            },
            {
                reviewId: fixture.review._id.toString(),
                decision: "adjusted",
                publicNote:
                    "Rotina simplificada e produto sem variante selecionado.",
                internalNote: "Ajuste validado no teste de integração.",
                adjustedRecommendationIds: [
                    fixture.recommendation._id.toString(),
                ],
                adjustedContent: {
                    assessment:
                        "Avaliação cosmética ajustada após revisão humana.",
                    routine: adjustedRoutine,
                    recommendations:
                        unchangedRecommendationGuidance(fixture),
                },
            },
            { requestId: "review-adjusted-routine-test" },
        );

        const [storedReport, storedSession] = await Promise.all([
            FaceReport.findById(fixture.report._id),
            AiConsultationSession.findById(fixture.session._id),
        ]);
        expect(storedReport.humanOverride.routine).toEqual(adjustedRoutine);
        expect(storedReport.routineSuggestions).toEqual(adjustedRoutine);
        expect(storedReport.simulationSpec).toEqual({
            enabled: false,
            regions: [],
            lookDescription: null,
            preserve: [],
        });
        expect(storedReport.finalRecommendationIds.map(String)).toEqual([
            fixture.recommendation._id.toString(),
        ]);
        expect(storedSession).toMatchObject({
            flowState: "draft_ready",
            currentReviewId: null,
        });
    });

    it("aceita ajuste textual num relatório sem recomendações", async () => {
        const fixture = await createAdjustmentDecisionFixture({
            withRecommendation: false,
        });

        await decideAiConsultationReview(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "consultor",
            },
            {
                reviewId: fixture.review._id.toString(),
                decision: "adjusted",
                publicNote:
                    "Avaliação revista mesmo sem produtos compatíveis no catálogo.",
                internalNote: null,
                adjustedRecommendationIds: [],
                adjustedContent: {
                    assessment:
                        "Avaliação cosmética humana ajustada sem recomendações de produto.",
                    routine: null,
                    recommendations: [],
                },
            },
            { requestId: "review-zero-products-text-adjustment" },
        );

        const [storedReview, storedReport, storedSession] = await Promise.all([
            AiConsultationReview.findById(fixture.review._id),
            FaceReport.findById(fixture.report._id),
            AiConsultationSession.findById(fixture.session._id),
        ]);
        expect(storedReview.status).toBe("adjusted");
        expect(storedReport.finalRecommendationIds).toEqual([]);
        expect(storedReport.humanOverride.objectivesAssessment).toBe(
            "Avaliação cosmética humana ajustada sem recomendações de produto.",
        );
        expect(storedSession.flowState).toBe("draft_ready");
    });

    it("recusa decisão adjusted sem alteração material e preserva a revisão", async () => {
        const fixture = await createAdjustmentDecisionFixture();

        await expect(
            decideAiConsultationReview(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                {
                    reviewId: fixture.review._id.toString(),
                    decision: "adjusted",
                    publicNote:
                        "Nota diferente que não altera o conteúdo do relatório.",
                    internalNote: null,
                    adjustedRecommendationIds: [
                        fixture.recommendation._id.toString(),
                    ],
                    adjustedContent: {
                        assessment:
                            fixture.report.machineResult.objectivesAssessment,
                        routine: fixture.report.machineResult.routine,
                        recommendations:
                            unchangedRecommendationGuidance(fixture),
                    },
                },
                { requestId: "review-no-material-adjustment" },
            ),
        ).rejects.toMatchObject({
            statusCode: 400,
            details: { code: "MATERIAL_ADJUSTMENT_REQUIRED" },
        });

        const [storedReview, storedReport, auditCount] = await Promise.all([
            AiConsultationReview.findById(fixture.review._id),
            FaceReport.findById(fixture.report._id),
            AiConsultationAuditLog.countDocuments({
                reviewId: fixture.review._id,
                action: "decision",
            }),
        ]);
        expect(storedReview.status).toBe("pending");
        expect(storedReview.humanOverride).toBeNull();
        expect(storedReport.lifecycleStatus).toBe("review_pending");
        expect(storedReport.humanOverride).toBeNull();
        expect(auditCount).toBe(0);
    });

    it("permite remover todos os produtos e marca-os como dismissed", async () => {
        const fixture = await createAdjustmentDecisionFixture();

        await decideAiConsultationReview(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "administrador",
            },
            {
                reviewId: fixture.review._id.toString(),
                decision: "adjusted",
                publicNote:
                    "Os produtos foram retirados após a revisão humana do relatório.",
                internalNote: null,
                adjustedRecommendationIds: [],
                adjustedContent: {
                    assessment: null,
                    routine: null,
                    recommendations: [],
                },
            },
            { requestId: "review-remove-all-products" },
        );

        const [storedReport, storedRecommendation] = await Promise.all([
            FaceReport.findById(fixture.report._id),
            ProductRecommendation.findById(fixture.recommendation._id),
        ]);
        expect(storedReport.finalRecommendationIds).toEqual([]);
        expect(storedReport.humanOverride.recommendations).toEqual([]);
        expect(storedRecommendation.status).toBe("dismissed");
        expect(storedRecommendation.humanOverride).toMatchObject({
            decision: "dismissed",
        });
        await expect(
            listReportRecommendationDtos(storedReport, fixture.userId),
        ).resolves.toEqual([]);
    });

    it("aprova apenas após revalidar e marca os produtos como accepted", async () => {
        const fixture = await createAdjustmentDecisionFixture();

        await decideAiConsultationReview(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "consultor",
            },
            {
                reviewId: fixture.review._id.toString(),
                decision: "approved",
                publicNote:
                    "Relatório e produtos confirmados após revalidação atual.",
                internalNote: null,
                adjustedRecommendationIds: [],
                adjustedContent: {
                    assessment: null,
                    routine: null,
                    recommendations: null,
                },
            },
            { requestId: "review-approved-current" },
        );

        const [storedReview, storedReport, storedRecommendation] =
            await Promise.all([
                AiConsultationReview.findById(fixture.review._id),
                FaceReport.findById(fixture.report._id),
                ProductRecommendation.findById(fixture.recommendation._id),
            ]);
        expect(storedReview.humanOverride.finalRecommendationIds.map(String)).toEqual([
            fixture.recommendation._id.toString(),
        ]);
        expect(storedReport.finalRecommendationIds.map(String)).toEqual([
            fixture.recommendation._id.toString(),
        ]);
        expect(storedRecommendation.status).toBe("accepted");
        expect(storedRecommendation.humanOverride.decision).toBe("accepted");
    });

    it("recusa aprovação perante drift sem mutações parciais nem audit", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        fixture.product.stock += 1;
        await fixture.product.save();

        await expect(
            decideAiConsultationReview(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                {
                    reviewId: fixture.review._id.toString(),
                    decision: "approved",
                    publicNote:
                        "Aprovação que deve ser recusada após mudança de stock.",
                    internalNote: null,
                    adjustedRecommendationIds: [],
                    adjustedContent: {
                        assessment: null,
                        routine: null,
                        recommendations: null,
                    },
                },
                { requestId: "review-approved-stale" },
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: {
                code: "REVIEW_STALE",
                reason: "price_or_stock_changed",
            },
        });

        const [storedReview, storedReport, storedRecommendation, auditCount] =
            await Promise.all([
                AiConsultationReview.findById(fixture.review._id),
                FaceReport.findById(fixture.report._id),
                ProductRecommendation.findById(fixture.recommendation._id),
                AiConsultationAuditLog.countDocuments({
                    reviewId: fixture.review._id,
                    action: "decision",
                }),
            ]);
        expect(storedReview.status).toBe("pending");
        expect(storedReview.humanOverride).toBeNull();
        expect(storedReport.lifecycleStatus).toBe("review_pending");
        expect(storedRecommendation.status).toBe("active");
        expect(storedRecommendation.humanOverride).toBeNull();
        expect(auditCount).toBe(0);
    });

    it("persiste e relê orientação canónica ajustada pelo consultor", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        const adjustedGuidance = {
            recommendationId: fixture.recommendation._id.toString(),
            explanation:
                "Produto mantido por apoiar uma preparação cosmética suave.",
            usage: "Aplicar uma camada fina antes da maquilhagem.",
            cautions: ["Evitar o contacto direto com os olhos."],
        };

        await decideAiConsultationReview(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "consultor",
            },
            {
                reviewId: fixture.review._id.toString(),
                decision: "adjusted",
                publicNote: "Orientação individual revista pelo consultor.",
                internalNote: null,
                adjustedRecommendationIds: [
                    fixture.recommendation._id.toString(),
                ],
                adjustedContent: {
                    assessment:
                        fixture.report.machineResult.objectivesAssessment,
                    routine: fixture.report.machineResult.routine,
                    recommendations: [adjustedGuidance],
                },
            },
            { requestId: "review-adjusted-guidance" },
        );

        const [storedReport, storedRecommendation] = await Promise.all([
            FaceReport.findById(fixture.report._id),
            ProductRecommendation.findById(fixture.recommendation._id),
        ]);
        expect(storedRecommendation.status).toBe("adjusted");
        expect(storedRecommendation.humanOverride).toMatchObject({
            decision: "adjusted",
            adjustedExplanation: adjustedGuidance.explanation,
            adjustedUsage: adjustedGuidance.usage,
            adjustedCautions: adjustedGuidance.cautions,
        });
        expect(storedReport.humanOverride.recommendations[0]).toMatchObject({
            reason: adjustedGuidance.explanation,
            usage: adjustedGuidance.usage,
            cautions: adjustedGuidance.cautions,
        });

        const [publicRecommendation] = await listReportRecommendationDtos(
            storedReport,
            fixture.userId,
        );
        expect(publicRecommendation).toMatchObject({
            explanation: adjustedGuidance.explanation,
            usage: adjustedGuidance.usage,
            cautions: adjustedGuidance.cautions,
            status: "adjusted",
        });
    });

    it("projeta o relatório v6 completo sem identidade nem metadata interna", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        fixture.report.machineResult = {
            ...fixture.report.machineResult,
            observations: ["Observação cosmética controlada."],
            answerSummary: "Resumo voluntário da consulta cosmética.",
            photoQuality: { status: "pass", warnings: [] },
            safetyFlags: ["Evitar a zona ocular sensibilizada."],
            routine: [
                {
                    routineSlotCode: "prime",
                    period: "manha",
                    priority: "essential",
                    title: "Preparação",
                    reason: "Preparar a pele antes da maquilhagem.",
                    instructions: "Aplicar uma camada fina.",
                    cautions: [],
                },
            ],
        };
        fixture.report.providerMetadata = {
            provider: "openai",
            requestedModel: "modelo-interno",
            effectiveModel: "modelo-interno",
            requestId: "request-id-privado",
            responseSchemaVersion: "cosmetic-report-schema-v6",
            generatedAt: new Date("2026-07-14T10:00:00.000Z"),
        };
        await fixture.report.save();
        fixture.recommendation.productSnapshot = {
            ...fixture.recommendation.productSnapshot,
            routineSteps: ["prime"],
        };
        await fixture.recommendation.save();

        const detail = await getAiConsultationReviewForConsultant(
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "consultor",
            },
            fixture.review._id.toString(),
            { requestId: "audit-request-id" },
        );
        const serialized = JSON.stringify(detail);

        expect(detail).toMatchObject({
            reportVersion: 7,
            report: {
                schemaVersion: 2,
                version: 7,
                sourceLabels: [
                    "Fotografia frontal autorizada",
                    "Fotografia de perfil autorizada",
                ],
                content: {
                    answerSummary: "Resumo voluntário da consulta cosmética.",
                },
            },
            recommendations: [
                expect.objectContaining({
                    id: fixture.recommendation._id.toString(),
                    usage: "Aplicar antes da maquilhagem.",
                }),
            ],
        });
        expect(detail.report.routine[0].recommendationIds).toEqual([
            fixture.recommendation._id.toString(),
        ]);
        expect(serialized).not.toContain(fixture.userId.toString());
        expect(serialized).not.toContain(fixture.report.analysisId.toString());
        expect(serialized).not.toContain("request-id-privado");
        expect(serialized).not.toContain("modelo-interno");
        expect(serialized).not.toContain("providerMetadata");
        expect(serialized).not.toContain("feedback");
        expect(serialized).not.toContain("availableVariants");
    });

    it("devolve 404 no detalhe de uma revisão concluída", async () => {
        const fixture = await createAdjustmentDecisionFixture();
        fixture.review.status = "approved";
        fixture.review.humanOverride = {
            decision: "approved",
            finalRecommendationIds: [fixture.recommendation._id],
        };
        await fixture.review.save();

        await expect(
            getAiConsultationReviewForConsultant(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                fixture.review._id.toString(),
            ),
        ).rejects.toMatchObject({ statusCode: 404 });
    });
});
