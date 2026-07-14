/**
 * Concorrência e rollback do pagamento simulado de relatórios.
 *
 * O replica set é efémero, loopback e independente de qualquer `.env`.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AppError } from "../src/middlewares/error.middleware.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import {
    findOrCreateReportForAnalysis,
    generateReportFromLatestAnalysis,
    unlockReportWithAcademicPayment,
} from "../src/services/face-report.service.js";

const DATABASE_NAME = "orelle_report_payment_test";
let replicaSet;

/** Recusa qualquer URI que não seja o replica set efémero esperado. */
function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("URI externa recusada no teste de pagamento do relatório");
    }
}

/** Cria um relatório e respetivo gate bloqueado. */
async function createLockedFixture(label) {
    const userId = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();
    const report = await FaceReport.create({
        schemaVersion: 1,
        userId,
        analysisId,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        cosmeticSummary: `Resumo ${label}`,
        routineSuggestions: [],
        sources: ["openai-responses"],
        limitations: ["Sem finalidade médica."],
        privacyStatus: "active",
    });
    const unlock = await ReportUnlock.create({
        userId,
        analysisId,
        reportId: report._id,
        recommendationIds: [],
        recommendedTotalCents: 3200,
        depositCents: 320,
        status: "locked",
        simulatedPayment: { status: "not_started" },
    });

    return { userId, analysisId, report, unlock };
}

async function createLockedV2Fixture(label) {
    const userId = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();
    const consultation = await AiConsultationSession.create({
        userId,
        analysisId,
        goalSelection: {
            primaryGoal: "sun_protection",
            secondaryGoals: [],
        },
        conversation: { turns: [], currentQuestion: null },
        facts: { budget_cents: 5000 },
        answers: [],
        flowState: "frozen_locked",
        status: "active",
        isOpen: true,
    });
    const report = await FaceReport.create({
        schemaVersion: 2,
        version: 1,
        userId,
        analysisId,
        consultationSessionId: consultation._id,
        analysisMode: "openai",
        analysisIsDemo: false,
        analysisProviderVersion: "gpt-test",
        lifecycleStatus: "frozen_locked",
        objectives: [{ code: "sun_protection", priority: "primary" }],
        cosmeticSummary: `Resumo ${label}`,
        routineSuggestions: [],
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Sem finalidade médica."],
        machineResult: { assessment: "Conteúdo final de teste." },
        privacyStatus: "active",
    });
    consultation.reportId = report._id;
    await consultation.save();
    const unlock = await ReportUnlock.create({
        schemaVersion: 2,
        reportVersion: 1,
        contentHash: "a".repeat(64),
        userId,
        analysisId,
        reportId: report._id,
        recommendationIds: [],
        recommendationSnapshots: [],
        recommendedTotalCents: 3200,
        depositCents: 320,
        availableRecommendationCount: 1,
        status: "locked",
        simulatedPayment: { status: "not_started" },
        frozenAt: new Date(),
    });
    return { userId, consultation, report, unlock };
}

/** Cria análise, perfil e três produtos para gerar o relatório numa transação real. */
async function createGenerationFixture(label) {
    const userId = new mongoose.Types.ObjectId();
    await FaceAnalysis.create({
        userId,
        photoIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        consentId: new mongoose.Types.ObjectId(),
        providerName: "openai",
        providerVersion: "gpt-test",
        mode: "openai",
        isDemo: false,
        findings: {
            skinType: {
                label: "mista",
                confidence: 0.8,
                explanation: "Estimativa cosmética de teste.",
            },
            acne: {
                label: "baixo",
                confidence: 0.7,
                explanation: "Estimativa cosmética de teste.",
            },
            manchas: {
                label: "baixo",
                confidence: 0.7,
                explanation: "Estimativa cosmética de teste.",
            },
            rugas: {
                label: "baixo",
                confidence: 0.7,
                explanation: "Estimativa cosmética de teste.",
            },
            oleosidade: {
                label: "moderada",
                confidence: 0.8,
                explanation: "Estimativa cosmética de teste.",
            },
        },
        photoQuality: { status: "pass", warnings: [], failures: [] },
        sources: ["openai-responses"],
        limitations: ["Sem finalidade médica."],
        provenance: {
            requestedModel: "gpt-test-primary",
            effectiveModel: "gpt-test-primary",
            requestId: "fixture-generation",
            promptVersion: "analysis-test-v2",
            schemaVersion: "analysis-test-v2",
        },
        status: "completed",
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
    const creatorId = new mongoose.Types.ObjectId();
    await Product.insertMany(
        ["Creme hidratante", "Gel equilibrante", "Serum conforto"].map(
            (name, index) => ({
                name: `${name} ${label}`,
                brandName: "Orelle Test",
                description: `${name} para pele mista com hidratação cosmética`,
                ingredientNames: [`ingrediente-${index}`],
                skinTypes: ["mista"],
                imageUrl: `/images/report-${index}.webp`,
                priceCents: 1200 + index,
                stock: 10,
                createdBy: creatorId,
            }),
        ),
    );

    return { userId };
}

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    assertEphemeralUri(uri);
    await mongoose.connect(uri);
    await Promise.all([
        FaceAnalysis.syncIndexes(),
        FaceReport.syncIndexes(),
        ProductRecommendation.syncIndexes(),
        Product.syncIndexes(),
        Profile.syncIndexes(),
        ReportUnlock.syncIndexes(),
        Voucher.syncIndexes(),
        AiConsultationSession.syncIndexes(),
    ]);
}, 30_000);

afterEach(async () => {
    await Promise.all([
        FaceAnalysis.deleteMany({}),
        FaceReport.deleteMany({}),
        ProductRecommendation.deleteMany({}),
        Product.deleteMany({}),
        Profile.deleteMany({}),
        ReportUnlock.deleteMany({}),
        Voucher.deleteMany({}),
        AiConsultationSession.deleteMany({}),
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

describe("pagamento simulado de relatório", () => {
    it("reutiliza um relatório sob 25 criações concorrentes", async () => {
        const userId = new mongoose.Types.ObjectId();
        const analysis = {
            _id: new mongoose.Types.ObjectId(),
            mode: "openai",
            isDemo: false,
            providerVersion: "gpt-test",
            findings: {
                skinType: { label: "mista" },
                acne: { label: "baixo" },
                manchas: { label: "baixo" },
                rugas: { label: "baixo" },
                oleosidade: { label: "moderada" },
            },
            sources: ["openai-responses"],
            limitations: ["Sem finalidade médica."],
        };

        const reports = await Promise.all(
            Array.from({ length: 25 }, () =>
                findOrCreateReportForAnalysis(userId.toString(), analysis),
            ),
        );

        expect(new Set(reports.map((report) => report._id.toString())).size).toBe(1);
        expect(await FaceReport.countDocuments({ userId })).toBe(1);
    });

    it("confirma 25 replays com uma única mutação e um voucher", async () => {
        const fixture = await createLockedFixture("concorrente");
        const key = "report-payment-concurrent-key";

        const responses = await Promise.all(
            Array.from({ length: 25 }, () =>
                unlockReportWithAcademicPayment(
                    fixture.userId.toString(),
                    fixture.report._id.toString(),
                    key,
                ),
            ),
        );

        const unlock = await ReportUnlock.findById(fixture.unlock._id).select(
            "+simulatedPayment.idempotencyKeyHash",
        );
        expect(unlock.status).toBe("unlocked");
        expect(unlock.simulatedPayment.status).toBe("simulated_paid");
        expect(unlock.simulatedPayment.reference).toMatch(/^simulated-report-/);
        expect(new Set(responses.map((response) => response.voucher.id)).size).toBe(1);
        expect(await Voucher.countDocuments({ sourceReportUnlockId: unlock._id })).toBe(1);
        expect(
            new Set(
                responses.map(
                    (response) => response.report.access.payment.simulationReference,
                ),
            ).size,
        ).toBe(1);

        await expect(
            unlockReportWithAcademicPayment(
                fixture.userId.toString(),
                fixture.report._id.toString(),
                "a-different-report-payment-key",
            ),
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("fecha a consulta v2 atomicamente no desbloqueio e permite uma nova", async () => {
        const fixture = await createLockedV2Fixture("fecho-terminal");
        const result = await unlockReportWithAcademicPayment(
            fixture.userId.toString(),
            fixture.report._id.toString(),
            "report-payment-closes-consultation",
        );

        expect(result.report.locked).toBe(false);
        const completed = await AiConsultationSession.findById(
            fixture.consultation._id,
        );
        expect(completed).toMatchObject({
            isOpen: false,
            status: "completed",
            flowState: "unlocked",
        });
        expect(completed.completedAt).toBeInstanceOf(Date);
        await expect(
            AiConsultationSession.create({
                userId: fixture.userId,
                goalSelection: {
                    primaryGoal: "hydration_barrier",
                    secondaryGoals: [],
                },
                conversation: { turns: [], currentQuestion: null },
                facts: {},
                answers: [],
                flowState: "collecting_photos",
                status: "active",
                isOpen: true,
            }),
        ).resolves.toMatchObject({ isOpen: true });
    });

    for (const failurePoint of ["after_unlock", "after_voucher"]) {
        it(`faz rollback integral em ${failurePoint} e permite retry`, async () => {
            const fixture = await createLockedFixture(failurePoint);
            const key = `report-payment-${failurePoint}-key`;

            await expect(
                unlockReportWithAcademicPayment(
                    fixture.userId.toString(),
                    fixture.report._id.toString(),
                    key,
                    {
                        failureInjector: async (point) => {
                            if (point === failurePoint) {
                                throw new Error(`falha:${failurePoint}`);
                            }
                        },
                    },
                ),
            ).rejects.toThrow(`falha:${failurePoint}`);

            const rolledBack = await ReportUnlock.findById(fixture.unlock._id);
            expect(rolledBack.status).toBe("locked");
            expect(rolledBack.simulatedPayment.status).toBe("not_started");
            expect(await Voucher.countDocuments({ userId: fixture.userId })).toBe(0);

            const retried = await unlockReportWithAcademicPayment(
                fixture.userId.toString(),
                fixture.report._id.toString(),
                key,
            );
            expect(retried.report.access.payment.status).toBe("simulated_paid");
            expect(await Voucher.countDocuments({ userId: fixture.userId })).toBe(1);
        });
    }

    for (const abortPoint of ["after_unlock", "after_voucher"]) {
        it(`faz rollback do pagamento cancelado em ${abortPoint} e permite retry`, async () => {
            const fixture = await createLockedFixture(`abort-${abortPoint}`);
            const key = `report-payment-abort-${abortPoint}-key`;
            const controller = new AbortController();

            await expect(
                unlockReportWithAcademicPayment(
                    fixture.userId.toString(),
                    fixture.report._id.toString(),
                    key,
                    {
                        signal: controller.signal,
                        failureInjector: async (point) => {
                            if (point === abortPoint) {
                                controller.abort(
                                    new AppError(
                                        503,
                                        "Pedido excedeu o tempo limite.",
                                    ),
                                );
                            }
                        },
                    },
                ),
            ).rejects.toMatchObject({
                statusCode: 503,
                message: "Pedido excedeu o tempo limite.",
            });

            const rolledBack = await ReportUnlock.findById(fixture.unlock._id);
            expect(rolledBack.status).toBe("locked");
            expect(rolledBack.simulatedPayment.status).toBe("not_started");
            expect(await Voucher.countDocuments({ userId: fixture.userId })).toBe(0);

            const retried = await unlockReportWithAcademicPayment(
                fixture.userId.toString(),
                fixture.report._id.toString(),
                key,
            );
            expect(retried.report.access.payment.status).toBe("simulated_paid");
            expect(await Voucher.countDocuments({ userId: fixture.userId })).toBe(1);
        });
    }

    for (const abortPoint of [
        "after_report",
        "after_recommendations",
        "after_unlock",
    ]) {
        it(`faz rollback integral da geração cancelada em ${abortPoint} e permite retry`, async () => {
            const fixture = await createGenerationFixture(abortPoint);
            const controller = new AbortController();

            await expect(
                generateReportFromLatestAnalysis(fixture.userId.toString(), {
                    signal: controller.signal,
                    failureInjector: async (point) => {
                        if (point === abortPoint) {
                            controller.abort(
                                new AppError(
                                    503,
                                    "Pedido excedeu o tempo limite.",
                                ),
                            );
                        }
                    },
                }),
            ).rejects.toMatchObject({
                statusCode: 503,
                message: "Pedido excedeu o tempo limite.",
            });

            expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(0);
            expect(
                await ProductRecommendation.countDocuments({ userId: fixture.userId }),
            ).toBe(0);
            expect(await ReportUnlock.countDocuments({ userId: fixture.userId })).toBe(0);

            const retried = await generateReportFromLatestAnalysis(
                fixture.userId.toString(),
            );
            expect(retried.status).toBe("locked");
            expect(await FaceReport.countDocuments({ userId: fixture.userId })).toBe(1);
            expect(
                await ProductRecommendation.countDocuments({ userId: fixture.userId }),
            ).toBe(3);
            expect(await ReportUnlock.countDocuments({ userId: fixture.userId })).toBe(1);
        });
    }
});
