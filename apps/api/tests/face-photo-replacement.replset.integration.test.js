/**
 * Prova real da substituição transacional do par facial num replica set local.
 */
import { readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FACE_PHOTO_UPLOAD_DIR } from "../src/middlewares/face-photo-upload.middleware.js";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../src/models/ai-consultation-session.model.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../src/models/ai-job.model.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FileDeletionJob } from "../src/models/file-deletion-job.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../src/models/makeup-simulation.model.js";
import { User } from "../src/models/user.model.js";
import {
    revokeFaceConsentForUser,
    saveFacePhotos,
} from "../src/services/face-photo.service.js";
import {
    createMyBiometricDataRequest,
    processApprovedPrivacyRequest,
} from "../src/services/biometric-data-request.service.js";
import { eraseOwnAccount } from "../src/services/account-erasure.service.js";
import { processFileDeletionJobs } from "../src/services/file-deletion-job.service.js";
import {
    generateMakeupPreviewForJob,
    readMakeupSimulationImageForUser,
} from "../src/services/makeup-simulation.service.js";

const DATABASE_NAME = "orelle_face_photo_replacement_test";
let replicaSet;
let userId;
let consent;

/**
 * Cria uma conta e consentimento reais para um cenário isolado.
 *
 * @param {string} label - Namespace único.
 * @param {{passwordHash?: string}} [options] - Credencial opcional para account erasure.
 * @returns {Promise<{user: object, consent: object}>} Identidade persistida.
 */
async function createFaceIdentity(
    label,
    { passwordHash = "fixture-not-used-for-authentication" } = {},
) {
    const user = await User.create({
        email: `${label}@orelle.test`,
        passwordHash,
        role: "cliente",
        isActive: true,
        accountStatus: "active",
    });
    const persistedConsent = await FaceConsent.create({
        userId: user._id,
        acceptedAt: new Date("2026-07-10T10:00:00.000Z"),
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: env.openAiNoticeVersion,
            acceptedAt: new Date("2026-07-10T10:00:00.000Z"),
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    });
    return { user, consent: persistedConsent };
}

/**
 * Cria um par PNG temporário no namespace privado do worker.
 *
 * @param {string} label - Identificador do cenário.
 * @returns {Promise<object[]>} Shape recebido por `saveFacePhotos`.
 */
async function createUploadedPair(label) {
    const files = [];

    for (const [index, kind] of ["frontal", "perfil"].entries()) {
        const filePath = path.join(
            FACE_PHOTO_UPLOAD_DIR,
            `${label}-${kind}.upload`,
        );
        const width = 960;
        const height = 720;
        const source = Buffer.from(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid-${index}" width="24" height="24" patternUnits="userSpaceOnUse">
                        <rect width="24" height="24" fill="rgb(${104 + index}, 116, 128)" />
                        <rect width="12" height="12" fill="rgb(164, 152, 136)" />
                        <rect x="12" y="12" width="12" height="12" fill="rgb(164, 152, 136)" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-${index})" />
            </svg>
        `);
        const output = await sharp(source)
            .png()
            .toFile(filePath);

        files.push({
            kind,
            file: {
                fieldname: kind,
                originalname: `${label}-${kind}.png`,
                mimetype: "image/png",
                path: filePath,
                filename: path.basename(filePath),
                size: output.size,
            },
        });
    }

    return files;
}

/**
 * Carrega fotografias incluindo paths privados apenas para verificação local.
 *
 * @param {string} statusValue - Estado pretendido.
 * @returns {Promise<object[]>} Documentos ordenados.
 */
async function findPhotosByStatus(statusValue) {
    return FacePhoto.find({ userId, status: statusValue })
        .select("+storageKey +encryption +encryption.iv +encryption.authTag")
        .sort({ kind: 1, createdAt: 1 });
}

describe("substituição facial transacional", () => {
    beforeAll(async () => {
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
        await import("node:fs/promises").then(({ mkdir }) =>
            mkdir(FACE_PHOTO_UPLOAD_DIR, { recursive: true, mode: 0o700 }),
        );
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI facial não é loopback efémera");
        }

        await mongoose.connect(uri);
        await Promise.all([
            User.syncIndexes(),
            AiConsultationSession.syncIndexes(),
            AiJob.syncIndexes(),
            FaceConsent.syncIndexes(),
            BiometricDataRequest.syncIndexes(),
            FacePhoto.syncIndexes(),
            FileDeletionJob.syncIndexes(),
            MakeupSimulation.syncIndexes(),
        ]);
        const identity = await createFaceIdentity("face-photo-replacement");
        const { user } = identity;
        userId = user._id;
        consent = identity.consent;
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
    }, 60_000);

    it("mantém exatamente duas ativas e elimina todos os bytes substituídos", async () => {
        await saveFacePhotos(userId.toString(), await createUploadedPair("first"), consent);
        const firstActive = await findPhotosByStatus("active");
        expect(firstActive).toHaveLength(2);

        await saveFacePhotos(userId.toString(), await createUploadedPair("second"), consent);
        const secondActive = await findPhotosByStatus("active");
        const firstDeleted = await findPhotosByStatus("deleted");

        expect(secondActive).toHaveLength(2);
        expect(firstDeleted).toHaveLength(2);
        for (const oldPhoto of firstDeleted) {
            await expect(readFile(oldPhoto.storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }

        const concurrentResults = await Promise.allSettled([
            saveFacePhotos(
                userId.toString(),
                await createUploadedPair("concurrent-a"),
                consent,
            ),
            saveFacePhotos(
                userId.toString(),
                await createUploadedPair("concurrent-b"),
                consent,
            ),
        ]);
        expect(
            concurrentResults.some((result) => result.status === "fulfilled"),
        ).toBe(true);

        const finalActive = await findPhotosByStatus("active");
        const finalDeleted = await findPhotosByStatus("deleted");
        expect(finalActive).toHaveLength(2);
        expect(new Set(finalActive.map((photo) => photo.kind))).toEqual(
            new Set(["frontal", "perfil"]),
        );

        for (const activePhoto of finalActive) {
            await expect(readFile(activePhoto.storageKey)).resolves.toBeInstanceOf(
                Buffer,
            );
            expect((await stat(activePhoto.storageKey)).mode & 0o777).toBe(0o600);
        }
        for (const deletedPhoto of finalDeleted) {
            await expect(readFile(deletedPhoto.storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }

        const remainingFiles = (await readdir(FACE_PHOTO_UPLOAD_DIR)).filter(
            (name) => name.endsWith(".enc"),
        );
        expect(remainingFiles).toHaveLength(2);
    }, 30_000);

    it("falha pós-commit preserva o novo par e permite retry dos bytes antigos", async () => {
        const previousActive = await findPhotosByStatus("active");
        expect(previousActive).toHaveLength(2);

        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("durable-retry"),
            consent,
            {
                fileDeletionProcessor: async () => {
                    throw new Error("filesystem unavailable");
                },
            },
        );

        const currentActive = await findPhotosByStatus("active");
        expect(currentActive).toHaveLength(2);
        for (const photo of currentActive) {
            await expect(readFile(photo.storageKey)).resolves.toBeInstanceOf(Buffer);
        }
        for (const photo of previousActive) {
            await expect(readFile(photo.storageKey)).resolves.toBeInstanceOf(Buffer);
        }

        const pendingJobs = await FileDeletionJob.find({
            sourceType: "face_photo_replacement",
            status: "pending",
        }).select("+storageKey");
        expect(pendingJobs).toHaveLength(2);
        const pendingJobIds = pendingJobs.map(({ _id }) => _id);
        expect(new Set(pendingJobs.map((job) => job.storageKey))).toEqual(
            new Set(previousActive.map((photo) => photo.storageKey)),
        );

        const retry = await processFileDeletionJobs({
            sourceType: "face_photo_replacement",
            sourceId: pendingJobs[0].sourceId,
        });
        expect(retry).toMatchObject({ completed: 2, failed: 0, outstanding: 0 });
        const completedJobs = await FileDeletionJob.find({
            _id: { $in: pendingJobIds },
            status: "completed",
        }).select("+storageKey");
        expect(completedJobs).toHaveLength(2);
        expect(
            completedJobs.every(
                (job) =>
                    job.storageKey === undefined &&
                    job.ownerId === undefined &&
                    job.sourceType === undefined &&
                    job.sourceId === undefined &&
                    job.terminalAt instanceof Date,
            ),
        ).toBe(true);

        for (const photo of previousActive) {
            await expect(readFile(photo.storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }
        for (const photo of currentActive) {
            await expect(readFile(photo.storageKey)).resolves.toBeInstanceOf(Buffer);
        }
    }, 30_000);

    it("bloqueia a substituição depois de a consulta sair de collecting_photos", async () => {
        const identity = await createFaceIdentity("replacement-forbidden");
        userId = identity.user._id;
        consent = identity.consent;
        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-forbidden-initial"),
            consent,
        );
        const initialPhotos = await findPhotosByStatus("active");
        const consultation = await AiConsultationSession.create({
            userId,
            consentId: consent._id,
            photoIds: initialPhotos.map(({ _id }) => _id),
            goalSelection: {
                primaryGoal: "hydration_barrier",
                secondaryGoals: [],
            },
            conversation: {
                turns: [],
                currentQuestion: {
                    id: "1:budget_cents",
                    revision: 1,
                    slotCode: "budget_cents",
                    type: "number",
                    label: "Qual é o orçamento?",
                    options: [],
                    min: 0,
                    max: 100_000,
                    source: "openai",
                },
                missingSlotCodes: [],
            },
            facts: {},
            answers: [],
            flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
            status: "active",
            isOpen: true,
            revision: 1,
        });
        const replacementUploads = await createUploadedPair(
            "replacement-forbidden-new",
        );

        await expect(
            saveFacePhotos(
                userId.toString(),
                replacementUploads,
                consent,
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: {
                code: "ACTIVE_CONSULTATION_PHOTO_REPLACEMENT_FORBIDDEN",
            },
        });

        const [activeAfter, consultationAfter] = await Promise.all([
            findPhotosByStatus("active"),
            AiConsultationSession.findById(consultation._id),
        ]);
        expect(activeAfter.map(({ _id }) => _id.toString()).sort()).toEqual(
            initialPhotos.map(({ _id }) => _id.toString()).sort(),
        );
        expect(consultationAfter.flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
        );
        expect(consultationAfter.conversation.currentQuestion.id).toBe(
            "1:budget_cents",
        );
        for (const { file } of replacementUploads) {
            await expect(readFile(file.path)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }
    }, 30_000);

    it("substitui durante collecting_photos e reinicia sessão e job de forma coerente", async () => {
        const identity = await createFaceIdentity("replacement-reset");
        userId = identity.user._id;
        consent = identity.consent;
        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-reset-initial"),
            consent,
        );
        const initialPhotos = await findPhotosByStatus("active");
        const consultation = await AiConsultationSession.create({
            userId,
            consentId: consent._id,
            photoIds: initialPhotos.map(({ _id }) => _id),
            analysisId: new mongoose.Types.ObjectId(),
            reportId: new mongoose.Types.ObjectId(),
            currentReviewId: new mongoose.Types.ObjectId(),
            goalSelection: {
                primaryGoal: "hydration_barrier",
                secondaryGoals: ["sun_protection"],
            },
            conversation: {
                turns: [
                    {
                        kind: "answer",
                        questionId: "4:budget_cents",
                        slotCode: "budget_cents",
                        value: 3000,
                        at: new Date(),
                    },
                ],
                currentQuestion: null,
                missingSlotCodes: ["current_routine"],
            },
            facts: { budget_cents: 3000 },
            answers: [{ slotCode: "budget_cents", value: 3000 }],
            photoQualityAcknowledgement: {
                photoSetHash: "a".repeat(64),
                acknowledgedAt: new Date(),
            },
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            status: "active",
            isOpen: true,
            revision: 4,
            logicalOperations: 5,
        });
        const job = await AiJob.create({
            type: AI_JOB_TYPES.ANALYZE_PHOTOS,
            userId,
            consultationSessionId: consultation._id,
            resourceType: "AiConsultationSession",
            resourceId: consultation._id.toString(),
            deduplicationKey: `replacement-reset:${consultation._id}`,
            status: AI_JOB_STATUSES.QUEUED,
        });
        consultation.currentJobId = job._id;
        await consultation.save();

        const replacement = await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-reset-new"),
            consent,
        );
        const [resetSession, cancelledJob, activePhotos] = await Promise.all([
            AiConsultationSession.findById(consultation._id),
            AiJob.findById(job._id),
            findPhotosByStatus("active"),
        ]);
        const replacementIds = replacement.map(({ id }) => id).sort();

        expect(activePhotos.map(({ _id }) => _id.toString()).sort()).toEqual(
            replacementIds,
        );
        expect(resetSession).toMatchObject({
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            status: "active",
            isOpen: true,
            analysisId: null,
            reportId: null,
            currentJobId: null,
            currentReviewId: null,
            revision: 5,
            logicalOperations: 5,
            facts: {},
            answers: [],
            conversation: {
                turns: [],
                currentQuestion: null,
                missingSlotCodes: [],
            },
        });
        expect(resetSession.photoIds.map(String).sort()).toEqual(
            replacementIds,
        );
        expect(resetSession.consentId.toString()).toBe(consent._id.toString());
        expect(resetSession.photoQualityAcknowledgement).toMatchObject({
            photoSetHash: null,
            acknowledgedAt: null,
        });
        expect(cancelledJob).toMatchObject({
            status: AI_JOB_STATUSES.CANCELLED,
            cancelledAt: expect.any(Date),
            terminalAt: expect.any(Date),
        });
    }, 30_000);

    it("recusa um upload com consentimento cached quando a revogação vence", async () => {
        const identity = await createFaceIdentity("revocation-wins");
        userId = identity.user._id;
        consent = identity.consent;
        const uploads = await createUploadedPair("revocation-wins");
        const encryptedBefore = (await readdir(FACE_PHOTO_UPLOAD_DIR)).filter(
            (name) => name.endsWith(".enc"),
        ).length;

        await revokeFaceConsentForUser(userId.toString());
        await expect(
            saveFacePhotos(userId.toString(), uploads, consent),
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(await FacePhoto.countDocuments({ userId })).toBe(0);
        for (const { file } of uploads) {
            await expect(readFile(file.path)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }
        const encryptedAfter = (await readdir(FACE_PHOTO_UPLOAD_DIR)).filter(
            (name) => name.endsWith(".enc"),
        ).length;
        expect(encryptedAfter).toBe(encryptedBefore);
        const account = await User.findById(userId).select(
            "+faceProcessingBlockedAt +faceProcessingBlockReason",
        );
        expect(account.faceProcessingBlockReason).toBe("consent_revoked");
        expect(account.faceProcessingBlockedAt).toBeInstanceOf(Date);
    }, 30_000);

    it("faz o pedido esperar pelo upload vencedor e captura o par sem stragglers", async () => {
        const identity = await createFaceIdentity("privacy-race");
        userId = identity.user._id;
        consent = identity.consent;
        let releaseBarrier;
        let announceBarrier;
        const barrierReached = new Promise((resolve) => {
            announceBarrier = resolve;
        });
        const barrierRelease = new Promise((resolve) => {
            releaseBarrier = resolve;
        });

        const uploadPromise = saveFacePhotos(
            userId.toString(),
            await createUploadedPair("privacy-race"),
            consent,
            {
                afterWriteBarrier: async () => {
                    announceBarrier();
                    await barrierRelease;
                },
            },
        );
        await barrierReached;

        const requestPromise = createMyBiometricDataRequest(userId.toString(), {
            action: "delete",
            resources: ["photos"],
            reason: "Eliminar o par após a corrida.",
        });
        await new Promise((resolve) => setTimeout(resolve, 30));
        releaseBarrier();

        const [uploaded, privacyRequest] = await Promise.all([
            uploadPromise,
            requestPromise,
        ]);
        expect(uploaded).toHaveLength(2);
        const committedPhotos = await FacePhoto.find({ userId, status: "active" })
            .select("+storageKey")
            .sort({ kind: 1 });
        expect(committedPhotos).toHaveLength(2);

        const blockedAccount = await User.findById(userId).select(
            "+faceProcessingBlockedAt +faceProcessingBlockReason",
        );
        expect(blockedAccount.faceProcessingBlockReason).toBe("privacy_request");

        const completed = await processApprovedPrivacyRequest(
            privacyRequest.id,
            {
                id: new mongoose.Types.ObjectId().toString(),
                role: "administrador",
            },
            { decisionReason: "Pedido confirmado." },
        );
        expect(completed.status).toBe("completed");
        expect(await FacePhoto.countDocuments({ userId })).toBe(0);
        for (const photo of committedPhotos) {
            await expect(readFile(photo.storageKey)).rejects.toMatchObject({
                code: "ENOENT",
            });
        }

        const releasedAccount = await User.findById(userId).select(
            "+faceProcessingBlockedAt +faceProcessingBlockReason",
        );
        expect(releasedAccount.faceProcessingBlockedAt).toBeNull();
        expect(releasedAccount.faceProcessingBlockReason).toBeNull();
    }, 30_000);

    it("faz a eliminação de conta esperar pelo upload e apagar o par confirmado", async () => {
        const password = "Password-Barreira-123";
        const identity = await createFaceIdentity("account-race", {
            passwordHash: await bcrypt.hash(password, 4),
        });
        userId = identity.user._id;
        consent = identity.consent;
        const encryptedBefore = (await readdir(FACE_PHOTO_UPLOAD_DIR)).filter(
            (name) => name.endsWith(".enc"),
        ).length;
        let releaseBarrier;
        let announceBarrier;
        const barrierReached = new Promise((resolve) => {
            announceBarrier = resolve;
        });
        const barrierRelease = new Promise((resolve) => {
            releaseBarrier = resolve;
        });

        const uploadPromise = saveFacePhotos(
            userId.toString(),
            await createUploadedPair("account-race"),
            consent,
            {
                afterWriteBarrier: async () => {
                    announceBarrier();
                    await barrierRelease;
                },
            },
        );
        await barrierReached;
        const erasurePromise = eraseOwnAccount({
            userId: userId.toString(),
            password,
        });
        await new Promise((resolve) => setTimeout(resolve, 30));
        releaseBarrier();

        const [uploaded, erasure] = await Promise.all([
            uploadPromise,
            erasurePromise,
        ]);
        expect(uploaded).toHaveLength(2);
        expect(erasure).toMatchObject({
            status: "deleted",
            fileCleanupStatus: "completed",
        });
        const tombstone = await User.findById(userId).select(
            "+faceProcessingBlockedAt +faceProcessingBlockReason",
        );
        expect(tombstone.accountStatus).toBe("deleted");
        expect(tombstone.faceProcessingBlockReason).toBe("account_deleted");
        expect(await FacePhoto.countDocuments({ userId })).toBe(0);
        expect(
            await FileDeletionJob.countDocuments({
                sourceType: "account_erasure",
                sourceId: userId.toString(),
                status: { $ne: "completed" },
            }),
        ).toBe(0);
        const encryptedAfter = (await readdir(FACE_PHOTO_UPLOAD_DIR)).filter(
            (name) => name.endsWith(".enc"),
        ).length;
        expect(encryptedAfter).toBe(encryptedBefore);
    }, 30_000);

    it("remove física e logicamente um preview concluído derivado do par substituído", async () => {
        const identity = await createFaceIdentity("replacement-derived-output");
        userId = identity.user._id;
        consent = identity.consent;
        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-derived-initial"),
            consent,
        );
        const sourcePhoto = await FacePhoto.findOne({
            userId,
            kind: "frontal",
            status: "active",
        });
        const outputStorageKey = path.join(
            FACE_PHOTO_UPLOAD_DIR,
            `makeup-derived-${sourcePhoto._id}.webp.enc`,
        );
        await writeFile(outputStorageKey, Buffer.from("encrypted-derived-output"), {
            mode: 0o600,
        });
        const simulation = await MakeupSimulation.create({
            schemaVersion: 2,
            userId,
            reportId: new mongoose.Types.ObjectId(),
            facePhotoId: sourcePhoto._id,
            consentId: consent._id,
            generativeConsent: {
                noticeVersion: "generative-makeup-v1",
                acceptedAt: new Date(),
                revokedAt: null,
            },
            recommendationIds: [],
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            activeGenerationKey: `makeup:${userId}:completed-derived`,
            outputStorageKey,
            outputEncryption: {
                algorithm: "aes-256-gcm",
                keyVersion: 2,
                aadHash: "a".repeat(64),
                iv: "test-iv",
                authTag: "test-auth-tag",
            },
            outputMimeType: "image/webp",
            outputSizeBytes: 24,
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
        });

        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-derived-new"),
            consent,
        );

        await expect(readFile(outputStorageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        const retired = await MakeupSimulation.findById(simulation._id)
            .select("+outputStorageKey +outputEncryption +activeGenerationKey")
            .lean();
        expect(retired).toMatchObject({
            status: MAKEUP_SIMULATION_STATUSES.CANCELLED,
            safeErrorCode: "SOURCE_PHOTO_REPLACED",
        });
        expect(retired.outputStorageKey).toBeUndefined();
        expect(retired.outputEncryption).toBeUndefined();
        expect(retired.activeGenerationKey).toBeUndefined();
        await expect(
            readMakeupSimulationImageForUser(userId, simulation._id),
        ).rejects.toMatchObject({ statusCode: 404 });
    }, 30_000);

    it("cancela um provider em curso e não publica depois de substituir a fotografia", async () => {
        const identity = await createFaceIdentity("replacement-provider-race");
        userId = identity.user._id;
        consent = identity.consent;
        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-provider-initial"),
            consent,
        );
        const sourcePhoto = await FacePhoto.findOne({
            userId,
            kind: "frontal",
            status: "active",
        });
        const simulation = await MakeupSimulation.create({
            schemaVersion: 2,
            userId,
            reportId: new mongoose.Types.ObjectId(),
            facePhotoId: sourcePhoto._id,
            consentId: consent._id,
            generativeConsent: {
                noticeVersion: "generative-makeup-v1",
                acceptedAt: new Date(),
                revokedAt: null,
            },
            recommendationIds: [],
            status: MAKEUP_SIMULATION_STATUSES.QUEUED,
            activeGenerationKey: `makeup:${userId}:provider-race`,
            simulationSpec: {
                enabled: true,
                regions: ["complexion"],
                lookDescription: "Natural",
            },
            recommendationSnapshot: [],
        });
        const job = await AiJob.create({
            type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
            userId,
            resourceType: "makeup_simulation",
            resourceId: simulation._id.toString(),
            deduplicationKey: `makeup-race:${simulation._id}`,
            status: AI_JOB_STATUSES.PROCESSING,
        });
        simulation.jobId = job._id;
        await simulation.save();

        let announceProvider;
        let releaseProvider;
        const providerStarted = new Promise((resolve) => {
            announceProvider = resolve;
        });
        const providerRelease = new Promise((resolve) => {
            releaseProvider = resolve;
        });
        const provider = vi.fn(async () => {
            announceProvider();
            await providerRelease;
            return {
                imageBuffer: Buffer.from("must-not-be-published"),
                provenance: {
                    provider: "openai",
                    requestedModel: "gpt-image-2",
                    effectiveModel: "gpt-image-2",
                    requestId: "replacement-race-request",
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
        const generation = generateMakeupPreviewForJob(
            { resourceId: simulation._id.toString(), userId },
            { provider, storageWriter },
        );
        await providerStarted;

        await saveFacePhotos(
            userId.toString(),
            await createUploadedPair("replacement-provider-new"),
            consent,
        );
        releaseProvider();

        await expect(generation).rejects.toMatchObject({
            statusCode: 409,
            details: {
                code: "MAKEUP_SOURCE_PHOTO_REPLACED",
                retryable: false,
            },
        });
        expect(provider).toHaveBeenCalledOnce();
        expect(storageWriter).not.toHaveBeenCalled();
        const [retired, cancelledJob] = await Promise.all([
            MakeupSimulation.findById(simulation._id)
                .select("+outputStorageKey +outputEncryption")
                .lean(),
            AiJob.findById(job._id).lean(),
        ]);
        expect(retired.status).toBe(MAKEUP_SIMULATION_STATUSES.CANCELLED);
        expect(retired.outputStorageKey).toBeUndefined();
        expect(retired.outputEncryption).toBeUndefined();
        expect(cancelledJob).toMatchObject({
            status: AI_JOB_STATUSES.CANCELLED,
            cancelledAt: expect.any(Date),
            terminalAt: expect.any(Date),
        });
    }, 30_000);
});
