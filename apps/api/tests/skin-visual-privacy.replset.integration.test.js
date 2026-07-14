/**
 * Prova persistente do boundary de imagem e da comparação temporal P2-009.
 */
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { ROLES } from "../src/constants/roles.js";
import { FACE_PHOTO_UPLOAD_DIR } from "../src/middlewares/face-photo-upload.middleware.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { encryptFacePhotoFile } from "../src/services/face-secure-storage.service.js";
import { createSessionToken } from "../src/services/session.service.js";

const DATABASE_NAME = "orelle_skin_visual_privacy_test";
const BASELINE_DATE = new Date("2026-04-01T10:00:00.000Z");
const FOLLOW_UP_DATE = new Date("2026-05-08T10:00:00.000Z");
let replicaSet;
let userId;
let otherUserId;
let baselineAnalysis;
let followUpAnalysis;
let expectedImageBytes;

const VALID_PHOTO_QUALITY = Object.freeze({
    profileVersion: "face-photo-quality-v1",
    status: "pass",
    failures: [],
    warnings: [],
    metrics: {
        lumaMean: 128,
        darkClippedRatio: 0,
        lightClippedRatio: 0,
        blurVariance: 80,
    },
});

/**
 * Cria findings cosméticos válidos para uma análise persistida.
 *
 * @param {string} acneLabel - Estado de acne usado para produzir um delta.
 * @returns {object} Findings completos.
 */
function makeFindings(acneLabel) {
    const finding = (label) => ({
        label,
        confidence: 0.8,
        explanation: "Sinal cosmético para teste local.",
    });

    return {
        skinType: finding("mista"),
        acne: finding(acneLabel),
        manchas: finding("baixo"),
        rugas: finding("baixo"),
        oleosidade: finding("moderada"),
    };
}

/**
 * Cria uma sessão opaca do adaptador test-only.
 *
 * @param {mongoose.Types.ObjectId} ownerId - Titular da sessão.
 * @returns {string} Token para cookie.
 */
function makeToken(ownerId) {
    return createSessionToken({
        id: ownerId.toString(),
        email: `${ownerId.toString()}@orelle.test`,
        role: ROLES.CLIENTE,
    });
}

describe("P2-009 - persistência local de imagens e comparação", () => {
    beforeAll(async () => {
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
        await mkdir(FACE_PHOTO_UPLOAD_DIR, { recursive: true, mode: 0o700 });

        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de teste não é loopback efémera");
        }
        await mongoose.connect(uri);
        await Promise.all([
            FaceConsent.syncIndexes(),
            FacePhoto.syncIndexes(),
            FaceAnalysis.syncIndexes(),
            ReportUnlock.syncIndexes(),
            SkinComparison.syncIndexes(),
        ]);

        userId = new mongoose.Types.ObjectId();
        otherUserId = new mongoose.Types.ObjectId();
        const consent = await FaceConsent.create({
            userId,
            acceptedAt: new Date("2026-03-01T10:00:00.000Z"),
            version: "face-analysis-v2",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                acceptedAt: new Date("2026-03-01T10:00:00.000Z"),
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        const imageSource = Buffer.from(`
            <svg width="960" height="720" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="quality-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <rect width="24" height="24" fill="rgb(92, 124, 151)" />
                        <rect width="12" height="12" fill="rgb(158, 146, 132)" />
                        <rect x="12" y="12" width="12" height="12" fill="rgb(158, 146, 132)" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#quality-grid)" />
            </svg>
        `);
        const frontalPath = path.join(
            FACE_PHOTO_UPLOAD_DIR,
            "skin-visual-persistence-frontal.webp",
        );
        await sharp(imageSource)
            .webp({ quality: 85 })
            .toFile(frontalPath);
        expectedImageBytes = await readFile(frontalPath);
        const photos = [];
        for (const kind of ["frontal", "perfil"]) {
            const plainPath =
                kind === "frontal"
                    ? frontalPath
                    : path.join(
                          FACE_PHOTO_UPLOAD_DIR,
                          "skin-visual-persistence-perfil.webp",
                      );
            if (kind === "perfil") {
                await sharp(imageSource).webp({ quality: 85 }).toFile(plainPath);
            }
            const imageBytes = await readFile(plainPath);
            const photoId = new mongoose.Types.ObjectId();
            const encrypted = await encryptFacePhotoFile(
                { path: plainPath },
                { userId, photoId, kind },
            );
            photos.push(
                await FacePhoto.create({
                    _id: photoId,
                    userId,
                    kind,
                    storageKey: encrypted.storageKey,
                    encryption: encrypted.encryption,
                    originalName: `skin-visual-persistence-${kind}.webp`,
                    mimeType: "image/webp",
                    sizeBytes: imageBytes.length,
                    quality: VALID_PHOTO_QUALITY,
                    consentId: consent._id,
                    status: "active",
                }),
            );
        }
        const commonAnalysis = {
            schemaVersion: 2,
            userId,
            photoIds: photos.map((photo) => photo._id),
            consentId: consent._id,
            providerName: "openai",
            providerVersion: "gpt-5.4-mini",
            mode: "openai",
            isDemo: false,
            photoQuality: {
                status: "pass",
                warnings: [],
                observations: ["Par fotográfico adequado ao teste."],
            },
            sources: ["openai_vision"],
            limitations: ["Teste cosmético local."],
            safetyFlags: [],
            provenance: {
                requestedModel: "gpt-5.4-mini",
                effectiveModel: "gpt-5.4-mini",
                requestId: "req-skin-visual-fixture",
                promptVersion: "cosmetic-consultation-v2",
                schemaVersion: "cosmetic-consultation-schema-v2",
            },
            status: "completed",
        };

        baselineAnalysis = await FaceAnalysis.create({
            ...commonAnalysis,
            findings: makeFindings("moderado"),
            createdAt: BASELINE_DATE,
            updatedAt: BASELINE_DATE,
        });
        followUpAnalysis = await FaceAnalysis.create({
            ...commonAnalysis,
            findings: makeFindings("baixo"),
            createdAt: FOLLOW_UP_DATE,
            updatedAt: FOLLOW_UP_DATE,
        });
        await ReportUnlock.insertMany(
            [baselineAnalysis, followUpAnalysis].map((item, index) => ({
                schemaVersion: 2,
                reportVersion: 1,
                userId,
                analysisId: item._id,
                reportId: new mongoose.Types.ObjectId(),
                recommendationIds: [],
                recommendationSnapshots: [],
                recommendedTotalCents: 0,
                depositCents: 0,
                availableRecommendationCount: 0,
                status: "unlocked",
                simulatedPayment: {
                    status: "not_required",
                    amountCents: 0,
                    reference: `skin-visual-${index}`,
                },
                unlockedAt: item.createdAt,
                frozenAt: item.createdAt,
                zeroFeeReason: "fixture_without_available_recommendations",
            })),
        );
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
    }, 60_000);

    it("descifra para o titular, bloqueia outro utilizador e persiste a comparação datada", async () => {
        const app = createApp();
        const ownImage = await request(app)
            .get(`/api/me/skin-analyses/${baselineAnalysis._id}/image`)
            .set("Cookie", [`orelle_session=${makeToken(userId)}`]);

        expect(ownImage.status).toBe(200);
        expect(ownImage.body).toEqual(expectedImageBytes);
        expect(ownImage.headers["cache-control"]).toContain("no-store");
        expect(ownImage.headers["content-type"]).toContain("image/webp");

        const forbiddenImage = await request(app)
            .get(`/api/me/skin-analyses/${baselineAnalysis._id}/image`)
            .set("Cookie", [`orelle_session=${makeToken(otherUserId)}`]);
        expect(forbiddenImage.status).toBe(404);

        const options = await request(app)
            .get("/api/me/skin-analyses/comparison-options")
            .set("Cookie", [`orelle_session=${makeToken(userId)}`]);
        expect(options.status).toBe(200);
        expect(options.body.analyses.map((analysis) => analysis.date)).toEqual([
            BASELINE_DATE.toISOString(),
            FOLLOW_UP_DATE.toISOString(),
        ]);
        expect(JSON.stringify(options.body)).not.toContain("storageKey");

        const comparison = await request(app)
            .post("/api/me/skin-comparisons")
            .set("Cookie", [`orelle_session=${makeToken(userId)}`])
            .send({
                baselineSelection: baselineAnalysis._id.toString(),
                followUpSelection: followUpAnalysis._id.toString(),
            });
        expect(comparison.status).toBe(201);
        expect(comparison.body.comparison.daysBetween).toBe(37);
        expect(comparison.body.comparison.metricDeltas).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    metric: "Acne",
                    baselineValue: "moderado",
                    followUpValue: "baixo",
                }),
            ]),
        );
        expect(comparison.body.comparison.baselineAnalysisId).toBeUndefined();
        expect(await SkinComparison.countDocuments({ userId })).toBe(1);
    }, 30_000);
});
