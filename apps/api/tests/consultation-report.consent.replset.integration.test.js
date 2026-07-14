/** Prova o consentimento antes e depois da chamada remota do relatório. */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Profile } from "../src/models/profile.model.js";
import { generateConsultationReportForJob } from "../src/services/consultation-report.service.js";

let replicaSet;
const DATABASE_NAME = "orelle_report_consent_test";

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
        throw new Error("URI de teste não efémera recusada");
    }
    await mongoose.connect(uri);
    await Promise.all([
        AiConsultationSession.syncIndexes(),
        FaceConsent.syncIndexes(),
        FaceReport.syncIndexes(),
        ProductRecommendation.syncIndexes(),
        Product.syncIndexes(),
        Profile.syncIndexes(),
    ]);
}, 30_000);

afterEach(async () => {
    await Promise.all(
        [
            AiConsultationSession,
            FaceAnalysis,
            FaceConsent,
            FaceReport,
            ProductRecommendation,
            Product,
            Profile,
        ].map((model) => model.deleteMany({})),
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

async function createFixture() {
    const userId = new mongoose.Types.ObjectId();
    const consent = await FaceConsent.create({
        userId,
        acceptedAt: new Date(),
        version: "face-analysis-v2",
        purpose: "analise_facial_cosmetica",
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: "openai-cosmetic-consultation-v2",
            acceptedAt: new Date(),
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    });
    const analysis = await FaceAnalysis.create({
        userId,
        photoIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        consentId: consent._id,
        providerName: "openai-responses",
        providerVersion: "gpt-test",
        mode: "openai",
        isDemo: false,
        findings: { skinType: { label: "mista" } },
        photoQuality: { status: "pass", reasons: [], warnings: [] },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Não médico."],
        safetyFlags: ["possible_clinical_sign"],
        provenance: {
            requestedModel: "gpt-test",
            effectiveModel: "gpt-test",
            promptVersion: "p2",
            schemaVersion: "s2",
        },
        status: "completed",
    });
    await Profile.create({
        userId,
        nome: "Cliente Teste",
        idade: 25,
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        allergies: [],
        avoidIngredients: [],
        lightMedicalRestrictions: [],
    });
    await Product.insertMany(
        [0, 1, 2].map((index) => ({
            name: `Produto consentimento ${index}`,
            brandName: "Orelle",
            description: "Produto cosmético elegível para hidratação e barreira.",
            ingredientNames: [`inci-${index}`],
            inciIngredients: [`inci-${index}`],
            skinTypes: ["mista"],
            imageUrl: `https://example.test/${index}.webp`,
            priceCents: 1000,
            stock: 5,
            createdBy: new mongoose.Types.ObjectId(),
            aiEligible: true,
            concernTags: ["hydration_barrier"],
            routineSteps: ["moisturize"],
        })),
    );
    const consultation = await AiConsultationSession.create({
        userId,
        analysisId: analysis._id,
        consentId: consent._id,
        goalSelection: {
            primaryGoal: "hydration_barrier",
            secondaryGoals: [],
        },
        conversation: { turns: [], currentQuestion: null },
        facts: { budget_cents: 10000 },
        answers: [],
        flowState: "generating_report",
        status: "active",
        isOpen: true,
        revision: 5,
    });
    return { userId, consent, consultation };
}

function makeProvider() {
    return vi.fn(async ({ candidates }) => ({
        value: {
            observations: ["Observação cosmética."],
            answerSummary: "Resumo das respostas.",
            assessment: "Avaliação cosmética não médica.",
            routine: [
                {
                    period: "manha",
                    title: "Hidratar",
                    reason: "Conforto.",
                    instructions: "Aplicar.",
                    cautions: [],
                },
            ],
            recommendations: candidates.slice(0, 3).map((candidate) => ({
                productId: candidate.productId,
                variantId: null,
                score: 0.8,
                reason: "Compatível.",
                usage: "Aplicar.",
                cautions: [],
            })),
            simulationSpec: {
                enabled: false,
                regions: [],
                lookDescription: null,
                preserve: [],
            },
            limitations: ["Não médico."],
            safetyFlags: [],
        },
        provenance: {
            requestedModel: "gpt-test",
            effectiveModel: "gpt-test",
            requestId: "req-test",
            promptVersion: "p2",
            schemaVersion: "s2",
        },
    }));
}

describe("consentimento do relatório OpenAI", () => {
    it("não chama provider quando o consentimento já foi revogado", async () => {
        const fixture = await createFixture();
        await FaceConsent.updateOne(
            { _id: fixture.consent._id },
            { $set: { revokedAt: new Date() } },
        );
        const provider = makeProvider();

        await expect(
            generateConsultationReportForJob(
                {
                    userId: fixture.userId,
                    consultationSessionId: fixture.consultation._id,
                },
                { reportProvider: provider },
            ),
        ).rejects.toMatchObject({ statusCode: 403 });
        expect(provider).not.toHaveBeenCalled();
    });

    it("faz rollback quando o consentimento é revogado durante a rede", async () => {
        const fixture = await createFixture();
        const provider = makeProvider();
        provider.mockImplementationOnce(async (input) => {
            await FaceConsent.updateOne(
                { _id: fixture.consent._id },
                { $set: { revokedAt: new Date() } },
            );
            return makeProvider()(input);
        });

        await expect(
            generateConsultationReportForJob(
                {
                    userId: fixture.userId,
                    consultationSessionId: fixture.consultation._id,
                },
                { reportProvider: provider },
            ),
        ).rejects.toMatchObject({ statusCode: 403 });
        expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(0);
        expect(
            await ProductRecommendation.countDocuments({ userId: fixture.userId }),
        ).toBe(0);
    });

    it("não permite que o relatório descarte safety flags da análise", async () => {
        const fixture = await createFixture();
        await generateConsultationReportForJob(
            {
                userId: fixture.userId,
                consultationSessionId: fixture.consultation._id,
            },
            { reportProvider: makeProvider() },
        );
        const report = await FaceReport.findOne({ userId: fixture.userId });
        expect(report.machineResult.safetyFlags).toContain(
            "possible_clinical_sign",
        );
        expect(report.limitations.join(" ")).toContain("profissional de saúde");
    });

    it("publica relatório com cobertura limitada quando o catálogo não tem elegíveis", async () => {
        const fixture = await createFixture();
        await Product.updateMany({}, { $set: { aiEligible: false } });

        const result = await generateConsultationReportForJob(
            {
                userId: fixture.userId,
                consultationSessionId: fixture.consultation._id,
            },
            { reportProvider: makeProvider() },
        );

        expect(result).toMatchObject({ flowState: "draft_ready" });
        const report = await FaceReport.findById(result.reportId);
        expect(report.machineResult.recommendations).toEqual([]);
        expect(report.finalRecommendationIds).toEqual([]);
    });

    it("ignora simulationSpec produzido pela OpenAI e usa o plano determinístico", async () => {
        const fixture = await createFixture();
        fixture.consultation.goalSelection = {
            primaryGoal: "makeup",
            secondaryGoals: [],
        };
        await fixture.consultation.save();
        await Product.updateMany(
            { aiEligible: true },
            { $set: { concernTags: ["makeup"] } },
        );
        const provider = makeProvider();
        provider.mockImplementationOnce(async (input) => {
            const response = await makeProvider()(input);
            return {
                ...response,
                value: {
                    ...response.value,
                    simulationSpec: {
                        enabled: true,
                        regions: ["lips"],
                        lookDescription: "Aplicar a maquilhagem recomendada.",
                        preserve: ["identity", "skin_features"],
                    },
                },
            };
        });

        const result = await generateConsultationReportForJob(
                {
                    userId: fixture.userId,
                    consultationSessionId: fixture.consultation._id,
                },
                { reportProvider: provider },
            );
        const report = await FaceReport.findById(result.reportId);
        expect(report.simulationSpec.enabled).toBe(false);
        expect(report.simulationSpec).not.toHaveProperty("lookDescription");
        expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(1);
    });
});
