/**
 * Provas de ownership fotográfico e revogação durante o job de edição OpenAI.
 * O transport e o storage são injetados: o teste nunca faz rede nem publica
 * uma imagem, mas usa MongoDB transacional e uma fotografia cifrada real.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { AppError } from "../src/middlewares/error.middleware.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { User } from "../src/models/user.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../src/models/makeup-simulation.model.js";
import { encryptFacePhotoFile } from "../src/services/face-secure-storage.service.js";
import {
    generateMakeupPreviewForJob,
    getMakeupSimulationForUser,
    readMakeupSimulationImageForUser,
} from "../src/services/makeup-simulation.service.js";
import { writeEncryptedMakeupOutput } from "../src/services/makeup-simulation-storage.service.js";

const DATABASE_NAME = "orelle_makeup_consent_test";
const OPENAI_NOTICE_VERSION = "openai-cosmetic-consultation-v2";
const TEMP_ROOT = path.join(os.tmpdir(), `orelle-makeup-consent-${randomUUID()}`);
let replicaSet;

async function createActiveConsent(userId) {
    const now = new Date();
    await User.create({
        _id: userId,
        email: `makeup-${userId.toString()}@orelle.test`,
        passwordHash: "fixture-not-used-for-authentication",
        role: "cliente",
        isActive: true,
        accountStatus: "active",
    });
    return FaceConsent.create({
        userId,
        acceptedAt: now,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: OPENAI_NOTICE_VERSION,
            acceptedAt: now,
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    });
}

async function createSimulation({ userId, consentId, facePhotoId }) {
    return MakeupSimulation.create({
        schemaVersion: 2,
        userId,
        reportId: new mongoose.Types.ObjectId(),
        facePhotoId,
        consentId,
        generativeConsent: {
            noticeVersion: "generative-makeup-v1",
            acceptedAt: new Date(),
            revokedAt: null,
        },
        recommendationIds: [],
        status: MAKEUP_SIMULATION_STATUSES.QUEUED,
        simulationSpec: {
            objective: "makeup",
            instruction: "Aplicar apenas as variantes recomendadas.",
        },
        recommendationSnapshot: [],
    });
}

describe("job OpenAI de pré-visualização de maquilhagem", () => {
    beforeAll(async () => {
        await mkdir(TEMP_ROOT, { recursive: true });
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de teste não é loopback efémera");
        }
        await mongoose.connect(uri);
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
        await rm(TEMP_ROOT, { recursive: true, force: true });
    }, 60_000);

    it("não troca uma fotografia congelada por outra frontal ativa", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consent = await createActiveConsent(userId);
        const stalePhotoId = new mongoose.Types.ObjectId();
        const replacementPhotoId = new mongoose.Types.ObjectId();
        const simulation = await createSimulation({
            userId,
            consentId: consent._id,
            facePhotoId: stalePhotoId,
        });
        await FacePhoto.collection.insertMany([
            {
                _id: stalePhotoId,
                userId,
                kind: "frontal",
                status: "deleted",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: replacementPhotoId,
                userId,
                kind: "frontal",
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const provider = vi.fn();

        await expect(
            generateMakeupPreviewForJob(
                { resourceId: simulation._id.toString(), userId },
                { provider, storageWriter: vi.fn() },
            ),
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(provider).not.toHaveBeenCalled();
        expect(
            (await MakeupSimulation.findById(simulation._id)).status,
        ).toBe(MAKEUP_SIMULATION_STATUSES.FAILED_TERMINAL);
    });

    it("projeta timeout OpenAI normalizado como falha durável repetível", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consent = await createActiveConsent(userId);
        const photoId = new mongoose.Types.ObjectId();
        const plainPath = path.join(TEMP_ROOT, `${photoId}.webp`);
        await writeFile(plainPath, Buffer.from("source-image-for-timeout"));
        const encrypted = await encryptFacePhotoFile(
            { path: plainPath },
            { userId, photoId, kind: "frontal" },
        );
        await FacePhoto.create({
            _id: photoId,
            userId,
            kind: "frontal",
            storageKey: encrypted.storageKey,
            encryption: encrypted.encryption,
            originalName: "frontal.webp",
            mimeType: "image/webp",
            sizeBytes: 24,
            quality: {
                profileVersion: "photo-quality-v1",
                status: "pass",
                failures: [],
                warnings: [],
                metrics: {
                    lumaMean: 128,
                    darkClippedRatio: 0,
                    lightClippedRatio: 0,
                    blurVariance: 120,
                },
            },
            consentId: consent._id,
            status: "active",
        });
        const simulation = await createSimulation({
            userId,
            consentId: consent._id,
            facePhotoId: photoId,
        });
        const provider = vi.fn().mockRejectedValue(
            new AppError(503, "Timeout OpenAI", {
                code: "OPENAI_IMAGE_TIMEOUT",
                retryable: true,
            }),
        );
        const storageWriter = vi.fn();

        await expect(
            generateMakeupPreviewForJob(
                { resourceId: simulation._id.toString(), userId },
                { provider, storageWriter },
            ),
        ).rejects.toMatchObject({
            details: {
                code: "OPENAI_IMAGE_TIMEOUT",
                retryable: true,
            },
        });

        expect(provider).toHaveBeenCalledOnce();
        expect(provider).toHaveBeenCalledWith(
            expect.objectContaining({ operationId: simulation._id.toString() }),
        );
        expect(storageWriter).not.toHaveBeenCalled();
        const stored = await MakeupSimulation.findById(simulation._id).lean();
        expect(stored).toMatchObject({
            status: MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE,
            safeErrorCode: "OPENAI_IMAGE_TIMEOUT",
        });
    });

    it("revogação durante o provider impede storage e publicação", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consent = await createActiveConsent(userId);
        const photoId = new mongoose.Types.ObjectId();
        const plainPath = path.join(TEMP_ROOT, `${photoId}.webp`);
        await writeFile(plainPath, Buffer.from("source-image-for-provider"));
        const encrypted = await encryptFacePhotoFile(
            { path: plainPath },
            { userId, photoId, kind: "frontal" },
        );
        await FacePhoto.create({
            _id: photoId,
            userId,
            kind: "frontal",
            storageKey: encrypted.storageKey,
            encryption: encrypted.encryption,
            originalName: "frontal.webp",
            mimeType: "image/webp",
            sizeBytes: 25,
            quality: {
                profileVersion: "photo-quality-v1",
                status: "pass",
                failures: [],
                warnings: [],
                metrics: {
                    lumaMean: 128,
                    darkClippedRatio: 0,
                    lightClippedRatio: 0,
                    blurVariance: 120,
                },
            },
            consentId: consent._id,
            status: "active",
        });
        const simulation = await createSimulation({
            userId,
            consentId: consent._id,
            facePhotoId: photoId,
        });
        const provider = vi.fn(async () => {
            const revokedAt = new Date();
            await FaceConsent.updateOne(
                { _id: consent._id },
                {
                    $set: {
                        revokedAt,
                        "externalProviderConsent.revokedAt": revokedAt,
                    },
                },
            );
            return {
                imageBuffer: Buffer.from("must-not-be-stored"),
                provenance: {
                    provider: "openai",
                    requestedModel: "gpt-image-2",
                    effectiveModel: "gpt-image-2",
                    requestId: "test-request-id",
                    promptVersion: "makeup-image-edit-v1",
                    schemaVersion: "makeup-image-contract-v1",
                    requestedSize: "1024x1024",
                    outputWidth: 1024,
                    outputHeight: 1024,
                    quality: "high",
                    format: "png",
                },
            };
        });
        const storageWriter = vi.fn();

        await expect(
            generateMakeupPreviewForJob(
                { resourceId: simulation._id.toString(), userId },
                { provider, storageWriter },
            ),
        ).rejects.toMatchObject({ statusCode: 403 });

        expect(provider).toHaveBeenCalledOnce();
        expect(storageWriter).not.toHaveBeenCalled();
        const stored = await MakeupSimulation.findById(simulation._id)
            .select("+outputStorageKey +outputEncryption")
            .lean();
        expect(stored.status).toBe(MAKEUP_SIMULATION_STATUSES.FAILED_TERMINAL);
        expect(stored.outputStorageKey).toBeNull();
        expect(stored.outputEncryption).toBeNull();
    });

    it("persiste e publica provenance versionada completa da imagem", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consent = await createActiveConsent(userId);
        const photoId = new mongoose.Types.ObjectId();
        const plainPath = path.join(TEMP_ROOT, `${photoId}.webp`);
        await writeFile(plainPath, Buffer.from("source-image-provenance"));
        const encrypted = await encryptFacePhotoFile(
            { path: plainPath },
            { userId, photoId, kind: "frontal" },
        );
        await FacePhoto.create({
            _id: photoId,
            userId,
            kind: "frontal",
            storageKey: encrypted.storageKey,
            encryption: encrypted.encryption,
            originalName: "frontal.webp",
            mimeType: "image/webp",
            sizeBytes: 25,
            quality: {
                profileVersion: "photo-quality-v1",
                status: "pass",
                failures: [],
                warnings: [],
                metrics: {
                    lumaMean: 128,
                    darkClippedRatio: 0,
                    lightClippedRatio: 0,
                    blurVariance: 120,
                },
            },
            consentId: consent._id,
            status: "active",
        });
        const simulation = await createSimulation({
            userId,
            consentId: consent._id,
            facePhotoId: photoId,
        });
        const provenance = {
            provider: "openai",
            requestedModel: "gpt-image-2",
            effectiveModel: "gpt-image-2-2026-07-01",
            requestId: "req-image-provenance",
            promptVersion: "makeup-image-edit-v3",
            schemaVersion: "makeup-image-contract-v4",
            requestedSize: "1024x1024",
            outputWidth: 1024,
            outputHeight: 1024,
            quality: "high",
            format: "png",
        };

        await expect(
            generateMakeupPreviewForJob(
                { resourceId: simulation._id.toString(), userId },
                {
                    provider: vi.fn().mockResolvedValue({
                        imageBuffer: Buffer.from("generated-image"),
                        provenance,
                    }),
                    storageWriter: vi.fn().mockResolvedValue({
                        storageKey: path.join(TEMP_ROOT, "generated.enc"),
                        encryption: {
                            algorithm: "aes-256-gcm",
                            keyVersion: 2,
                            aadHash: "a".repeat(64),
                            iv: "iv",
                            authTag: "tag",
                        },
                        mimeType: "image/png",
                        sizeBytes: 128,
                    }),
                },
            ),
        ).resolves.toMatchObject({ flowState: "completed" });

        const stored = await MakeupSimulation.findById(simulation._id).lean();
        expect(stored).toMatchObject({
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            requestedModel: provenance.requestedModel,
            effectiveModel: provenance.effectiveModel,
            providerRequestId: provenance.requestId,
            promptVersion: provenance.promptVersion,
            responseSchemaVersion: provenance.schemaVersion,
        });
        await expect(
            getMakeupSimulationForUser(userId, simulation._id),
        ).resolves.toMatchObject({
            provider: {
                name: "openai",
                requestedModel: provenance.requestedModel,
                effectiveModel: provenance.effectiveModel,
                requestId: provenance.requestId,
                promptVersion: provenance.promptVersion,
                schemaVersion: provenance.schemaVersion,
            },
        });
    });

    it("carrega todos os metadados privados necessários para decifrar o output", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consent = await createActiveConsent(userId);
        const simulationId = new mongoose.Types.ObjectId();
        const generatedImage = await sharp({
            create: {
                width: 32,
                height: 32,
                channels: 3,
                background: { r: 142, g: 92, b: 98 },
            },
        })
            .png()
            .toBuffer();
        const stored = await writeEncryptedMakeupOutput(generatedImage, {
            userId,
            simulationId,
            storageDir: TEMP_ROOT,
        });
        await MakeupSimulation.create({
            _id: simulationId,
            schemaVersion: 2,
            userId,
            reportId: new mongoose.Types.ObjectId(),
            facePhotoId: new mongoose.Types.ObjectId(),
            consentId: consent._id,
            generativeConsent: {
                noticeVersion: "generative-makeup-v1",
                acceptedAt: new Date(),
                revokedAt: null,
            },
            recommendationIds: [],
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            outputStorageKey: stored.storageKey,
            outputEncryption: stored.encryption,
            outputMimeType: stored.mimeType,
            outputSizeBytes: stored.sizeBytes,
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
        });

        const image = await readMakeupSimulationImageForUser(
            userId,
            simulationId,
        );

        expect(image.mimeType).toBe("image/png");
        await expect(sharp(image.buffer).metadata()).resolves.toMatchObject({
            format: "png",
            width: 32,
            height: 32,
        });
    });
});
