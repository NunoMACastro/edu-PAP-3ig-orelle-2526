/** Congelamento comercial v2: stock disponível, 10% e zero-fee. */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { finalizeFaceReportForUser } from "../src/services/report-access.service.js";

let replicaSet;
const DATABASE_NAME = "orelle_report_v2_freeze_test";

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    await mongoose.connect(replicaSet.getUri(DATABASE_NAME));
    await Promise.all([
        AiConsultationSession.syncIndexes(),
        FaceReport.syncIndexes(),
        ProductRecommendation.syncIndexes(),
        ReportUnlock.syncIndexes(),
        Voucher.syncIndexes(),
    ]);
}, 30_000);

afterEach(async () => {
    await Promise.all(
        [AiConsultationSession, FaceReport, ProductRecommendation, Product, ReportUnlock, Voucher].map(
            (model) => model.deleteMany({}),
        ),
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

async function fixture(stocks) {
    const userId = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();
    const consultation = await AiConsultationSession.create({
        userId,
        analysisId,
        goalSelection: { primaryGoal: "hydration_barrier", secondaryGoals: [] },
        conversation: { turns: [], currentQuestion: null },
        facts: { budget_cents: 10000 },
        answers: [],
        flowState: "draft_ready",
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
        lifecycleStatus: "draft_ready",
        objectives: [{ code: "hydration_barrier", priority: "primary" }],
        cosmeticSummary: "Resumo cosmético.",
        routineSuggestions: [],
        sources: ["fotografia_frontal"],
        limitations: ["Não médico."],
        machineResult: { assessment: "Conteúdo final." },
        privacyStatus: "active",
    });
    const products = await Product.insertMany(
        stocks.map((stock, index) => ({
            name: `Produto freeze ${index}`,
            brandName: "Orelle",
            description: "Produto cosmético do teste de congelamento.",
            ingredientNames: ["glicerina"],
            skinTypes: ["mista"],
            imageUrl: `https://example.test/freeze-${index}.webp`,
            priceCents: 1001 + index * 1000,
            stock,
            createdBy: new mongoose.Types.ObjectId(),
        })),
    );
    const recommendations = [];
    for (let index = 0; index < products.length; index += 1) {
        recommendations.push(
            await ProductRecommendation.create({
                schemaVersion: 2,
                reportVersion: 1,
                userId,
                analysisId,
                reportId: report._id,
                analysisMode: "openai",
                analysisIsDemo: false,
                analysisProviderVersion: "gpt-test",
                productId: products[index]._id,
                productSnapshot: {
                    priceCents: products[index].priceCents,
                    stock: products[index].stock,
                    available: products[index].stock > 0,
                },
                selectionRank: index + 1,
                score: 0.8,
                reasonCodes: ["objective:hydration_barrier"],
                explanation: "Compatível.",
                sourceSignals: ["catalog:allowlist"],
                limitations: ["Não médico."],
                machineResult: { usage: "Aplicar." },
            }),
        );
    }
    report.finalRecommendationIds = recommendations.map(({ _id }) => _id);
    await report.save();
    consultation.reportId = report._id;
    await consultation.save();
    return { userId, report, consultation };
}

describe("freeze report v2", () => {
    it("soma apenas produtos disponíveis e calcula 10% por excesso", async () => {
        const { userId, report, consultation } = await fixture([2, 0]);
        const result = await finalizeFaceReportForUser(
            userId.toString(),
            report._id.toString(),
        );
        expect(result.locked).toBe(true);
        expect(result.access).toMatchObject({
            recommendedTotalCents: 1001,
            depositCents: 101,
            recommendationCount: 2,
            availableRecommendationCount: 1,
            requiresPayment: true,
        });
        const stillOpen = await AiConsultationSession.findById(consultation._id);
        expect(stillOpen).toMatchObject({
            isOpen: true,
            status: "active",
            flowState: "frozen_locked",
        });
    });

    it("desbloqueia sem pagamento e sem voucher quando tudo está sem stock", async () => {
        const { userId, report, consultation } = await fixture([0, 0]);
        const [first, replay] = await Promise.all([
            finalizeFaceReportForUser(userId.toString(), report._id.toString()),
            finalizeFaceReportForUser(userId.toString(), report._id.toString()),
        ]);
        expect(first.access).toMatchObject({
            status: "unlocked",
            depositCents: 0,
            requiresPayment: false,
            payment: { status: "not_required" },
        });
        expect(replay.access.status).toBe("unlocked");
        expect(await Voucher.countDocuments({ userId })).toBe(0);
        expect(await ReportUnlock.countDocuments({ reportId: report._id })).toBe(1);
        const completed = await AiConsultationSession.findById(consultation._id);
        expect(completed.isOpen).toBe(false);
        expect(completed.status).toBe("completed");
        expect(completed.flowState).toBe("unlocked");
        expect(completed.completedAt).toBeInstanceOf(Date);
        await expect(
            AiConsultationSession.create({
                userId,
                goalSelection: {
                    primaryGoal: "sun_protection",
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
});
