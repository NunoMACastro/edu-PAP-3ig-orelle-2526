/**
 * Integração real da eliminação terminal da conta num replica set efémero.
 *
 * A suite nunca lê `MONGODB_URI`: usa exclusivamente loopback gerado por
 * `MongoMemoryReplSet` e prova transação, rollback, concorrência, CSRF,
 * anonimização de encomendas pagas e outbox de ficheiros privados.
 */
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { authRoutes } from "../src/routes/auth.routes.js";
import { meAccountRoutes } from "../src/routes/me-account.routes.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";
import { createRateLimiters } from "../src/middlewares/rate-limit.middleware.js";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { AiInteractionHistory } from "../src/models/ai-interaction-history.model.js";
import { AiJob } from "../src/models/ai-job.model.js";
import { AuthSession } from "../src/models/auth-session.model.js";
import { BeforeAfterVisualization } from "../src/models/before-after-visualization.model.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { Cart } from "../src/models/cart.model.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { FileDeletionJob } from "../src/models/file-deletion-job.model.js";
import { MakeupSimulation } from "../src/models/makeup-simulation.model.js";
import { MakeupSimulationQuota } from "../src/models/makeup-simulation-quota.model.js";
import { Notification } from "../src/models/notification.model.js";
import { Order } from "../src/models/order.model.js";
import { Preference } from "../src/models/preference.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { ReportPhotoGrant } from "../src/models/report-photo-grant.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { Review } from "../src/models/review.model.js";
import { RoutineAlertPreference } from "../src/models/routine-alert-preference.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { User } from "../src/models/user.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import {
    ACCOUNT_ERASURE_FILE_SOURCE,
    eraseOwnAccount,
} from "../src/services/account-erasure.service.js";
import { processFileDeletionJobs } from "../src/services/file-deletion-job.service.js";
import { setUserAccountStatus } from "../src/services/admin-users.service.js";
import { loginUser } from "../src/services/auth.service.js";
import { createSessionToken, resetTestSessions } from "../src/services/session.service.js";
import { encryptJsonWithContext } from "../src/utils/encryption.util.js";

const DATABASE_NAME = "orelle_account_erasure_test";
const LOCAL_ORIGIN = "http://127.0.0.1:5173";
const PASSWORD = "PalavraPasse123";

/** Modelos cujo documento pertence integralmente ao utilizador. */
const OWNED_MODELS = Object.freeze([
    AiConsultationReview,
    AiConsultationSession,
    AiInteractionHistory,
    AiJob,
    BeforeAfterVisualization,
    Cart,
    DailyRoutine,
    FaceAnalysis,
    FaceConsent,
    FaceReport,
    MakeupSimulation,
    MakeupSimulationQuota,
    Notification,
    Preference,
    ProductRecommendation,
    Profile,
    ReportUnlock,
    Review,
    RoutineAlertPreference,
    SkinComparison,
    Voucher,
]);

/** @type {MongoMemoryReplSet|null} */
let replicaSet = null;
const temporaryFiles = new Set();

/**
 * Cria uma conta real com hash bcrypt e email único.
 *
 * @param {string} label - Sufixo do cenário.
 * @returns {Promise<import("mongoose").Document>} Conta criada.
 */
async function createUser(label) {
    return User.create({
        email: `${label}-${randomUUID()}@orelle.test`,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        role: "cliente",
        isActive: true,
        accountStatus: "active",
    });
}

/**
 * Insere documentos mínimos diretamente nas coleções para provar a cascata.
 * O objetivo não é voltar a testar cada schema, mas garantir que nenhum model
 * atualmente ligado por `userId` fica esquecido pelo workflow.
 *
 * @param {mongoose.Types.ObjectId} userId - Titular.
 * @returns {Promise<{ownedReviewId: mongoose.Types.ObjectId}>}
 */
async function seedEveryOwnedCollection(userId) {
    const ownedReviewId = new mongoose.Types.ObjectId();

    for (const model of OWNED_MODELS) {
        await model.collection.insertOne({
            ...(model === AiConsultationReview ? { _id: ownedReviewId } : {}),
            userId,
            testMarker: randomUUID(),
        });
    }

    await BiometricDataRequest.collection.insertOne({
        requesterId: userId,
        testMarker: randomUUID(),
    });
    await RecommendationReview.collection.insertOne({
        clientUserId: userId,
        testMarker: randomUUID(),
    });
    await ReportPhotoGrant.collection.insertOne({
        clientUserId: userId,
        reportId: new mongoose.Types.ObjectId(),
        reviewId: ownedReviewId,
        testMarker: randomUUID(),
    });
    await AiConsultationAuditLog.collection.insertOne({
        actorId: new mongoose.Types.ObjectId(),
        actorRole: "consultor",
        action: "detail",
        reviewId: ownedReviewId,
        occurredAt: new Date(),
    });

    return { ownedReviewId };
}

/**
 * Cria uma sessão persistida que tem de ser revogada pela transação.
 *
 * @param {mongoose.Types.ObjectId} userId - Titular.
 * @returns {Promise<import("mongoose").Document>} Sessão criada.
 */
async function createPersistedSession(userId) {
    return AuthSession.create({
        tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
        userId,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        lastSeenAt: new Date(),
        csrfHash: "a".repeat(64),
    });
}

/**
 * Cria uma app mínima que monta o router exatamente sob `/api/me`.
 *
 * @returns {import("express").Express} Aplicação isolada para o contrato HTTP.
 */
function createAccountTestApp() {
    const app = express();
    app.locals.rateLimiters = createRateLimiters();
    app.locals.csrfAllowedOrigins = [LOCAL_ORIGIN];
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRoutes);
    app.use("/api/me", meAccountRoutes);
    app.use(errorMiddleware);
    return app;
}

/**
 * Emite CSRF para uma sessão de teste que exige proteção completa.
 *
 * @param {import("express").Express} app - App mínima.
 * @param {string} token - Cookie opaco.
 * @returns {Promise<string>} Token CSRF.
 */
async function fetchCsrf(app, token) {
    const response = await request(app)
        .get("/api/auth/csrf")
        .set("Cookie", [`orelle_session=${token}`]);

    expect(response.status).toBe(200);
    return response.body.csrfToken;
}

describe("ORELLE-AUD-P1-004 - eliminação terminal da conta", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            throw new Error("O teste de conta exige Mongoose desligado");
        }

        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);

        if (
            !uri.startsWith("mongodb://127.0.0.1:") ||
            !uri.includes(`/${DATABASE_NAME}?`) ||
            !uri.includes("replicaSet=") ||
            uri.includes("@")
        ) {
            throw new Error("URI recusada: não é replica set loopback efémero");
        }

        await mongoose.connect(uri);

        for (const modelName of mongoose.modelNames()) {
            await mongoose.model(modelName).createCollection();
        }

        await Promise.all([
            User.syncIndexes(),
            Order.syncIndexes(),
            AuthSession.syncIndexes(),
            FacePhoto.syncIndexes(),
            FileDeletionJob.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        vi.restoreAllMocks();
        resetTestSessions();

        if (mongoose.connection.readyState === 1) {
            for (const collection of Object.values(
                mongoose.connection.collections,
            )) {
                await collection.deleteMany({});
            }
        }

        for (const filePath of temporaryFiles) {
            await rm(filePath, { force: true });
        }
        temporaryFiles.clear();
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        await replicaSet?.stop();
        replicaSet = null;
    }, 60_000);

    it("apaga dados pessoais, anonimiza encomenda paga e confirma a ausência física dos bytes", async () => {
        const user = await createUser("complete");
        const otherUser = await createUser("other");
        const oldEmail = user.email;
        const oldPasswordHash = (
            await User.findById(user._id).select("+passwordHash")
        ).passwordHash;
        const { ownedReviewId } = await seedEveryOwnedCollection(user._id);
        const persistedSession = await createPersistedSession(user._id);
        const secondPersistedSession = await createPersistedSession(user._id);
        const storageKey = path.join(
            tmpdir(),
            `orelle-account-erasure-${randomUUID()}.enc`,
        );
        temporaryFiles.add(storageKey);
        await writeFile(storageKey, Buffer.from("encrypted-test-bytes"));
        await FacePhoto.collection.insertOne({
            userId: user._id,
            storageKey,
            status: "active",
            testMarker: randomUUID(),
        });
        const makeupOutputStorageKey = path.join(
            tmpdir(),
            `orelle-account-erasure-makeup-${randomUUID()}.webp.enc`,
        );
        temporaryFiles.add(makeupOutputStorageKey);
        await writeFile(
            makeupOutputStorageKey,
            Buffer.from("encrypted-makeup-output"),
        );
        await MakeupSimulation.collection.insertOne({
            userId: user._id,
            schemaVersion: 2,
            outputStorageKey: makeupOutputStorageKey,
            status: "completed",
            testMarker: randomUUID(),
        });

        const paidOrderId = new mongoose.Types.ObjectId();
        const unpaidOrderId = new mongoose.Types.ObjectId();
        await Order.collection.insertMany([
            {
                _id: paidOrderId,
                userId: user._id,
                checkoutKey: "sensitive-checkout-key",
                payment: {
                    status: "simulated_paid",
                    idempotencyKeyHash: "sensitive-idempotency-hash",
                },
                paymentAttempts: [{ idempotencyKeyHash: "attempt-hash" }],
                voucher: {
                    voucherId: new mongoose.Types.ObjectId(),
                    code: "PRIVATE-VOUCHER",
                    amountCents: 500,
                },
            },
            {
                _id: unpaidOrderId,
                userId: user._id,
                checkoutKey: "unpaid-checkout-key",
                payment: { status: "awaiting_simulation" },
            },
        ]);

        const productId = new mongoose.Types.ObjectId();
        const moderatedReviewId = new mongoose.Types.ObjectId();
        const consultationReviewId = new mongoose.Types.ObjectId();
        const productRecommendationId = new mongoose.Types.ObjectId();
        const recommendationReviewId = new mongoose.Types.ObjectId();
        const biometricRequestId = new mongoose.Types.ObjectId();
        const biometricLogId = new mongoose.Types.ObjectId();
        await Product.collection.insertOne({
            _id: productId,
            createdBy: user._id,
            testMarker: randomUUID(),
        });
        await Review.collection.insertOne({
            _id: moderatedReviewId,
            userId: otherUser._id,
            moderatedBy: user._id,
            testMarker: randomUUID(),
        });
        await ProductRecommendation.collection.insertOne({
            _id: productRecommendationId,
            userId: otherUser._id,
            humanOverride: encryptJsonWithContext(
                {
                    decision: "approved",
                    reviewerId: user._id,
                    reviewId: recommendationReviewId,
                    reviewedAt: new Date("2026-07-10T12:00:00.000Z"),
                },
                {
                    collection: "productrecommendations",
                    owner: otherUser._id,
                    field: "humanOverride",
                },
            ),
        });
        await AiConsultationReview.collection.insertOne({
            _id: consultationReviewId,
            userId: otherUser._id,
            reviewedBy: user._id,
            auditTrail: [{ actorId: user._id, actorRole: "consultor" }],
            humanOverride: encryptJsonWithContext(
                {
                    decision: "approved",
                    reviewerId: user._id,
                    reviewId: consultationReviewId,
                    reviewedAt: new Date("2026-07-10T12:00:00.000Z"),
                },
                {
                    collection: "aiconsultationreviews",
                    owner: otherUser._id,
                    field: "humanOverride",
                },
            ),
        });
        await RecommendationReview.collection.insertOne({
            _id: recommendationReviewId,
            clientUserId: otherUser._id,
            consultantId: user._id,
        });
        await BiometricDataRequest.collection.insertOne({
            _id: biometricRequestId,
            requesterId: otherUser._id,
            reviewerId: user._id,
        });
        await BiometricAccessLog.collection.insertOne({
            _id: biometricLogId,
            actorId: user._id,
            actorRole: "consultor",
            subjectUserId: user._id,
        });

        const result = await eraseOwnAccount({
            userId: user._id.toString(),
            password: PASSWORD,
        });

        expect(result).toMatchObject({
            status: "deleted",
            fileCleanupStatus: "completed",
        });
        const tombstone = await User.findById(user._id).select("+passwordHash");
        expect(tombstone.accountStatus).toBe("deleted");
        expect(tombstone.isActive).toBe(false);
        expect(tombstone.email).not.toBe(oldEmail);
        expect(tombstone.email).not.toContain(user._id.toString());
        expect(tombstone.passwordHash).not.toBe(oldPasswordHash);
        expect(tombstone.deletedAt).toBeInstanceOf(Date);

        for (const model of OWNED_MODELS) {
            expect(await model.countDocuments({ userId: user._id })).toBe(0);
        }
        expect(await FacePhoto.countDocuments({ userId: user._id })).toBe(0);
        expect(
            await BiometricDataRequest.countDocuments({ requesterId: user._id }),
        ).toBe(0);
        expect(
            await RecommendationReview.countDocuments({ clientUserId: user._id }),
        ).toBe(0);
        expect(
            await ReportPhotoGrant.countDocuments({ clientUserId: user._id }),
        ).toBe(0);
        expect(
            await AiConsultationAuditLog.countDocuments({
                reviewId: ownedReviewId,
            }),
        ).toBe(0);

        const paidOrder = await Order.findById(paidOrderId).select(
            "+payment.idempotencyKeyHash +paymentAttempts",
        );
        expect(paidOrder.userId).toBeNull();
        expect(paidOrder.ownerErasedAt).toBeInstanceOf(Date);
        expect(paidOrder.checkoutKey).toBe(
            `account-erased:${paidOrderId.toString()}`,
        );
        expect(paidOrder.voucher.voucherId).toBeNull();
        expect(paidOrder.voucher.code).toBeNull();
        expect(paidOrder.payment.idempotencyKeyHash).toBeNull();
        expect(paidOrder.paymentAttempts).toHaveLength(0);
        expect(await Order.findById(unpaidOrderId)).toBeNull();

        for (const sessionId of [
            persistedSession._id,
            secondPersistedSession._id,
        ]) {
            const revokedSession = await AuthSession.findById(sessionId).select(
                "+csrfHash",
            );
            expect(revokedSession.revokedAt).toBeInstanceOf(Date);
            expect(revokedSession.csrfHash).toBeNull();
        }

        const fileJobs = await FileDeletionJob.find({
            status: "completed",
        }).select("+storageKey");
        expect(fileJobs.length).toBeGreaterThanOrEqual(2);
        expect(
            fileJobs.every(
                (job) =>
                    job.storageKey === undefined &&
                    job.ownerId === undefined &&
                    job.sourceType === undefined &&
                    job.sourceId === undefined &&
                    job.terminalAt instanceof Date,
            ),
        ).toBe(true);
        await expect(readFile(storageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        await expect(readFile(makeupOutputStorageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });

        expect((await Product.findById(productId)).createdBy).toBeNull();
        expect((await Review.findById(moderatedReviewId)).moderatedBy).toBeNull();
        const sharedConsultation = await AiConsultationReview.findById(
            consultationReviewId,
        );
        expect(sharedConsultation.reviewedBy).toBeNull();
        expect(sharedConsultation.auditTrail[0].actorId).toBeNull();
        expect(sharedConsultation.humanOverride).toMatchObject({
            decision: "approved",
            reviewId: consultationReviewId.toString(),
        });
        expect(sharedConsultation.humanOverride).not.toHaveProperty("reviewerId");
        const sharedRecommendation = await ProductRecommendation.findById(
            productRecommendationId,
        );
        expect(sharedRecommendation.humanOverride).toMatchObject({
            decision: "approved",
            reviewId: recommendationReviewId.toString(),
        });
        expect(sharedRecommendation.humanOverride).not.toHaveProperty(
            "reviewerId",
        );
        expect(
            (await RecommendationReview.findById(recommendationReviewId))
                .consultantId,
        ).toBeNull();
        expect(
            (await BiometricDataRequest.findById(biometricRequestId)).reviewerId,
        ).toBeNull();
        const anonymizedLog = await BiometricAccessLog.findById(biometricLogId);
        expect(anonymizedLog.actorId).toBeNull();
        expect(anonymizedLog.subjectUserId).toBeNull();

        await expect(
            loginUser({ email: oldEmail, password: PASSWORD }),
        ).rejects.toMatchObject({ statusCode: 401 });
        await expect(
            setUserAccountStatus({
                targetUserId: user._id.toString(),
                status: "active",
                actorUserId: otherUser._id.toString(),
            }),
        ).rejects.toMatchObject({ statusCode: 409 });
    }, 30_000);

    it("reverte toda a eliminação quando um override cifrado foi adulterado", async () => {
        const user = await createUser("tampered-override");
        const owner = await createUser("tampered-owner");
        const reviewId = new mongoose.Types.ObjectId();
        const validOverride = encryptJsonWithContext(
            {
                decision: "approved",
                reviewerId: user._id,
                reviewId,
                reviewedAt: new Date("2026-07-10T12:00:00.000Z"),
            },
            {
                collection: "aiconsultationreviews",
                owner: owner._id,
                field: "humanOverride",
            },
        );
        const tamperedOverride = {
            ...validOverride,
            authTag: `${validOverride.authTag.slice(0, -2)}AA`,
        };
        const consultationReviewId = new mongoose.Types.ObjectId();
        await AiConsultationReview.collection.insertOne({
            _id: consultationReviewId,
            userId: owner._id,
            reviewedBy: user._id,
            humanOverride: tamperedOverride,
        });

        await expect(
            eraseOwnAccount({
                userId: user._id.toString(),
                password: PASSWORD,
            }),
        ).rejects.toThrow("Conteúdo contextual encriptado inválido");

        const [unchangedUser, unchangedReview] = await Promise.all([
            User.findById(user._id),
            AiConsultationReview.collection.findOne({
                _id: consultationReviewId,
            }),
        ]);
        expect(unchangedUser.accountStatus).toBe("active");
        expect(unchangedUser.isActive).toBe(true);
        expect(unchangedReview.reviewedBy).toEqual(user._id);
        expect(unchangedReview.humanOverride).toEqual(tamperedOverride);
    });

    it("reverte tombstone e dados quando o outbox não pode ser persistido", async () => {
        const user = await createUser("rollback");
        await Profile.collection.insertOne({
            userId: user._id,
            testMarker: "must-survive",
        });
        await FacePhoto.collection.insertOne({
            userId: user._id,
            storageKey: path.join(tmpdir(), `rollback-${randomUUID()}.enc`),
            status: "active",
        });
        const sessionRecord = await createPersistedSession(user._id);
        vi.spyOn(FileDeletionJob, "bulkWrite").mockRejectedValueOnce(
            new Error("outbox unavailable"),
        );

        await expect(
            eraseOwnAccount({
                userId: user._id.toString(),
                password: PASSWORD,
            }),
        ).rejects.toThrow("outbox unavailable");

        const unchangedUser = await User.findById(user._id);
        expect(unchangedUser.accountStatus).toBe("active");
        expect(unchangedUser.isActive).toBe(true);
        expect(await Profile.countDocuments({ userId: user._id })).toBe(1);
        expect(await FacePhoto.countDocuments({ userId: user._id })).toBe(1);
        expect((await AuthSession.findById(sessionRecord._id)).revokedAt).toBeNull();
        expect(await FileDeletionJob.countDocuments({})).toBe(0);
    });

    it("mantém um job durável e permite retry quando o filesystem falha depois do commit", async () => {
        const user = await createUser("filesystem-retry");
        const storageKey = path.join(
            tmpdir(),
            `orelle-account-retry-${randomUUID()}.enc`,
        );
        temporaryFiles.add(storageKey);
        await writeFile(storageKey, Buffer.from("retry-private-bytes"));
        await FacePhoto.collection.insertOne({
            userId: user._id,
            storageKey,
            status: "active",
        });
        const persistedSession = await createPersistedSession(user._id);

        const result = await eraseOwnAccount(
            { userId: user._id.toString(), password: PASSWORD },
            {
                fileDeletionProcessor: (input) =>
                    processFileDeletionJobs({
                        ...input,
                        unlinkFile: async () => {
                            throw new Error("filesystem temporarily unavailable");
                        },
                    }),
            },
        );

        expect(result.fileCleanupStatus).toBe("pending");
        expect((await User.findById(user._id)).accountStatus).toBe("deleted");
        expect(
            (await AuthSession.findById(persistedSession._id)).revokedAt,
        ).toBeInstanceOf(Date);
        expect(await FacePhoto.countDocuments({ userId: user._id })).toBe(0);
        await expect(readFile(storageKey)).resolves.toEqual(
            Buffer.from("retry-private-bytes"),
        );

        const pendingJob = await FileDeletionJob.findOne({
            sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
            sourceId: user._id.toString(),
        });
        expect(pendingJob.status).toBe("failed");
        expect(pendingJob.attempts).toBe(1);

        const retry = await processFileDeletionJobs({
            sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
            sourceId: user._id,
        });

        expect(retry).toMatchObject({
            claimed: 1,
            completed: 1,
            failed: 0,
            outstanding: 0,
        });
        await expect(readFile(storageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        expect((await FileDeletionJob.findById(pendingJob._id)).status).toBe(
            "completed",
        );
    });

    it("não transforma uma falha operacional pós-commit numa falsa falha da eliminação", async () => {
        const user = await createUser("processor-unavailable");
        const storageKey = path.join(
            tmpdir(),
            `orelle-account-pending-${randomUUID()}.enc`,
        );
        temporaryFiles.add(storageKey);
        await writeFile(storageKey, Buffer.from("pending-private-bytes"));
        await FacePhoto.collection.insertOne({
            userId: user._id,
            storageKey,
            status: "active",
        });
        await Profile.collection.insertOne({ userId: user._id });
        const persistedSession = await createPersistedSession(user._id);

        const result = await eraseOwnAccount(
            { userId: user._id.toString(), password: PASSWORD },
            {
                fileDeletionProcessor: async () => {
                    throw new Error("outbox processor unavailable");
                },
            },
        );

        expect(result).toMatchObject({
            status: "deleted",
            fileCleanupStatus: "pending",
        });
        expect((await User.findById(user._id)).accountStatus).toBe("deleted");
        expect(await Profile.countDocuments({ userId: user._id })).toBe(0);
        expect(
            (await AuthSession.findById(persistedSession._id)).revokedAt,
        ).toBeInstanceOf(Date);
        expect(
            await FileDeletionJob.countDocuments({
                sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
                sourceId: user._id.toString(),
                status: "pending",
            }),
        ).toBe(1);
        await expect(readFile(storageKey)).resolves.toEqual(
            Buffer.from("pending-private-bytes"),
        );
    });

    it("reclama um job antigo sem metadata facial e elimina os bytes", async () => {
        const user = await createUser("legacy-outbox");
        const storageKey = path.join(
            tmpdir(),
            `orelle-account-legacy-job-${randomUUID()}.enc`,
        );
        temporaryFiles.add(storageKey);
        await writeFile(storageKey, Buffer.from("orphan-private-bytes"));
        const legacyJob = await FileDeletionJob.create({
            deduplicationKey: `${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`,
            sourceType: "face_photo_replacement",
            sourceId: new mongoose.Types.ObjectId().toString(),
            ownerId: user._id,
            storageKey,
            status: "failed",
            attempts: 2,
            lastError: "Falha operacional anterior.",
        });

        const result = await eraseOwnAccount({
            userId: user._id.toString(),
            password: PASSWORD,
        });

        expect(result).toMatchObject({
            status: "deleted",
            fileCleanupStatus: "completed",
        });
        await expect(readFile(storageKey)).rejects.toMatchObject({
            code: "ENOENT",
        });
        expect(await FileDeletionJob.findById(legacyJob._id)).toBeNull();
        const reclaimed = await FileDeletionJob.findOne({
            status: "completed",
        }).select("+storageKey");
        expect(reclaimed.status).toBe("completed");
        expect(reclaimed.ownerId).toBeUndefined();
        expect(reclaimed.storageKey).toBeUndefined();
        expect(reclaimed.sourceType).toBeUndefined();
        expect(reclaimed.sourceId).toBeUndefined();
        expect(reclaimed.terminalAt).toBeInstanceOf(Date);
        expect(
            await FileDeletionJob.countDocuments({
                ownerId: user._id,
                status: { $ne: "completed" },
            }),
        ).toBe(0);
    });

    it("serializa dois pedidos concorrentes: uma eliminação vence e a outra recebe 409", async () => {
        const user = await createUser("concurrent");

        const results = await Promise.allSettled([
            eraseOwnAccount({ userId: user._id.toString(), password: PASSWORD }),
            eraseOwnAccount({ userId: user._id.toString(), password: PASSWORD }),
        ]);
        const fulfilled = results.filter((entry) => entry.status === "fulfilled");
        const rejected = results.filter((entry) => entry.status === "rejected");

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect(rejected[0].reason).toMatchObject({ statusCode: 409 });
        expect((await User.findById(user._id)).accountStatus).toBe("deleted");
    }, 30_000);

    it("endpoint exige Origin/CSRF, password atual e confirmação literal", async () => {
        const user = await createUser("http");
        const app = createAccountTestApp();
        const token = createSessionToken(
            { id: user._id.toString(), email: user.email, role: user.role },
            { enforceCsrf: true },
        );
        const csrfToken = await fetchCsrf(app, token);
        const baseRequest = () =>
            request(app)
                .delete("/api/me/account")
                .set("Cookie", [`orelle_session=${token}`])
                .set("X-CSRF-Token", csrfToken);

        const missingOrigin = await baseRequest().send({
            password: PASSWORD,
            confirmation: "ELIMINAR",
        });
        expect(missingOrigin.status).toBe(403);

        const wrongConfirmation = await baseRequest()
            .set("Origin", LOCAL_ORIGIN)
            .send({ password: PASSWORD, confirmation: "Eliminar" });
        expect(wrongConfirmation.status).toBe(400);

        const wrongPassword = await baseRequest()
            .set("Origin", LOCAL_ORIGIN)
            .send({ password: "PasswordErrada123", confirmation: "ELIMINAR" });
        expect(wrongPassword.status).toBe(403);
        expect((await User.findById(user._id)).accountStatus).toBe("active");

        const deleted = await baseRequest()
            .set("Origin", LOCAL_ORIGIN)
            .send({ password: PASSWORD, confirmation: "ELIMINAR" });
        expect(deleted.status).toBe(200);
        expect(deleted.body).toEqual({
            account: {
                status: "deleted",
                deletedAt: expect.any(String),
            },
            fileCleanup: { status: "not_required" },
            message: "Conta eliminada.",
        });
        expect(deleted.headers["cache-control"]).toBe("no-store");
        expect(deleted.headers["set-cookie"]?.join(";")).toMatch(
            /orelle_session=;/,
        );
        expect(JSON.stringify(deleted.body)).not.toContain(user.email);
    }, 30_000);
});
