/**
 * Provas materiais de rollback para análises faciais canceladas.
 *
 * A suite usa um replica set efémero local: o abort acontece depois do insert
 * Mongoose, mas antes do callback transacional terminar, e confirma que não
 * fica qualquer análise tardia. O retry seguinte deve persistir exatamente
 * uma análise.
 */
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startLocalReplicaSet } from "../scripts/local-dev-runtime.core.mjs";
import { disconnectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { AppError } from "../src/middlewares/error.middleware.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { User } from "../src/models/user.model.js";
import { persistFaceAnalysisAtomically } from "../src/services/face-analysis.service.js";

let runtime;
let previousMongoUri;
let user;
let consent;
let photos;

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
 * Cria o payload completo já validado pelo provider, sem executar qualquer
 * chamada externa durante a prova transacional.
 *
 * @returns {object} Payload da persistência.
 */
function makeAnalysisPayload() {
    const finding = {
        label: "baixo",
        confidence: 0.5,
        explanation: "Resultado académico de teste.",
    };
    return {
        userId: user._id,
        photoIds: photos.map((photo) => photo._id),
        consentId: consent._id,
        schemaVersion: 2,
        mode: "openai",
        isDemo: false,
        providerName: "openai",
        providerVersion: "gpt-5.4-mini",
        findings: {
            skinType: { ...finding, label: "mista" },
            acne: finding,
            manchas: finding,
            rugas: finding,
            oleosidade: { ...finding, label: "moderada" },
        },
        photoQuality: {
            status: "pass",
            warnings: [],
            observations: ["Par técnico adequado para o teste transacional."],
        },
        sources: ["openai_vision"],
        limitations: ["Consulta cosmética não médica."],
        safetyFlags: [],
        provenance: {
            requestedModel: "gpt-5.4-mini",
            effectiveModel: "gpt-5.4-mini",
            requestId: "req-analysis-abort-fixture",
            promptVersion: "cosmetic-consultation-v2",
            schemaVersion: "cosmetic-consultation-schema-v2",
        },
        status: "completed",
    };
}

describe("análise facial cancelável em replica set", () => {
    beforeAll(async () => {
        runtime = await startLocalReplicaSet();
        previousMongoUri = env.mongoUri;
        env.mongoUri = runtime.mongo.uri;
        await mongoose.connect(env.mongoUri);
    }, 180_000);

    beforeEach(async () => {
        await mongoose.connection.db.dropDatabase();
        user = await User.create({
            email: "analysis-abort@orelle.test",
            passwordHash: "hash-de-teste-nao-utilizavel",
        });
        consent = await FaceConsent.create({
            userId: user._id,
            acceptedAt: new Date(),
            version: "face-analysis-v2",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                acceptedAt: new Date(),
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        photos = await FacePhoto.create([
            {
                userId: user._id,
                kind: "frontal",
                storageKey: "/private/test-frontal.enc",
                encryption: {
                    algorithm: "aes-256-gcm",
                    keyVersion: 2,
                    aadHash: "aad-frontal",
                    iv: "iv-frontal",
                    authTag: "tag-frontal",
                },
                originalName: "frontal.webp",
                mimeType: "image/webp",
                sizeBytes: 100,
                quality: VALID_PHOTO_QUALITY,
                consentId: consent._id,
            },
            {
                userId: user._id,
                kind: "perfil",
                storageKey: "/private/test-perfil.enc",
                encryption: {
                    algorithm: "aes-256-gcm",
                    keyVersion: 2,
                    aadHash: "aad-perfil",
                    iv: "iv-perfil",
                    authTag: "tag-perfil",
                },
                originalName: "perfil.webp",
                mimeType: "image/webp",
                sizeBytes: 100,
                quality: VALID_PHOTO_QUALITY,
                consentId: consent._id,
            },
        ]);
    });

    afterAll(async () => {
        await disconnectDB().catch(() => undefined);
        env.mongoUri = previousMongoUri;
        await runtime?.replSet?.stop();
    }, 60_000);

    it("faz rollback após insert abortado e permite retry único", async () => {
        const controller = new AbortController();

        await expect(
            persistFaceAnalysisAtomically({
                userId: user._id,
                analysisPayload: makeAnalysisPayload(),
                signal: controller.signal,
                afterPersist: async () => {
                    controller.abort(
                        new AppError(503, "Pedido excedeu o tempo limite."),
                    );
                },
            }),
        ).rejects.toMatchObject({
            statusCode: 503,
            message: "Pedido excedeu o tempo limite.",
        });

        expect(await FaceAnalysis.countDocuments({ userId: user._id })).toBe(0);
        const rolledBackUser = await User.findById(user._id).select(
            "+faceDataGeneration",
        );
        expect(rolledBackUser.faceDataGeneration).toBe(0);

        const retry = await persistFaceAnalysisAtomically({
            userId: user._id,
            analysisPayload: makeAnalysisPayload(),
            signal: new AbortController().signal,
        });

        expect(retry._id).toBeDefined();
        expect(await FaceAnalysis.countDocuments({ userId: user._id })).toBe(1);
    });

    it("recusa fotografias substituídas antes do commit", async () => {
        await FacePhoto.updateOne(
            { _id: photos[0]._id },
            { $set: { status: "deleted" } },
        );

        await expect(
            persistFaceAnalysisAtomically({
                userId: user._id,
                analysisPayload: makeAnalysisPayload(),
                signal: new AbortController().signal,
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "As fotografias usadas na análise já foram substituídas.",
        });

        expect(await FaceAnalysis.countDocuments({ userId: user._id })).toBe(0);
    });

    it("recusa consentimento revogado antes do commit", async () => {
        await FaceConsent.updateOne(
            { _id: consent._id },
            { $set: { revokedAt: new Date() } },
        );

        await expect(
            persistFaceAnalysisAtomically({
                userId: user._id,
                analysisPayload: makeAnalysisPayload(),
                signal: new AbortController().signal,
            }),
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Consentimento facial em falta",
        });

        expect(await FaceAnalysis.countDocuments({ userId: user._id })).toBe(0);
        const rolledBackUser = await User.findById(user._id).select(
            "+faceDataGeneration",
        );
        expect(rolledBackUser.faceDataGeneration).toBe(0);
    });
});
