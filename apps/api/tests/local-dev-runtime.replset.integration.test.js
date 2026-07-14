/**
 * Prova real de readiness/transações do runtime local efémero.
 */
import { rm, stat } from "node:fs/promises";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalReplicaSet } from "../scripts/local-dev-runtime.core.mjs";
import { createApp } from "../src/app.js";
import {
    connectDB,
    disconnectDB,
    getDatabase,
    getDatabaseClient,
    isTransactionalMongoReady,
} from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { FACE_PHOTO_UPLOAD_DIR } from "../src/middlewares/face-photo-upload.middleware.js";
import { runMigrations } from "../src/migrations/migration-runner.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { getCurrentAiConsultationSession } from "../src/services/ai-consultation.service.js";
import { listAiConsultationReviewsForConsultant } from "../src/services/ai-consultation-review.service.js";
import { getDailyRoutineForUser } from "../src/services/daily-routine.service.js";
import { readEncryptedFacePhotoFile } from "../src/services/face-secure-storage.service.js";
import { listMyNotifications } from "../src/services/notification.service.js";
import { listMyOrders } from "../src/services/order.service.js";
import { getMyProfile } from "../src/services/profile.service.js";
import { getPersonalSkinHistory } from "../src/services/skin-history.service.js";
import { seedLocalData } from "../src/scripts/seed-local.js";

/** @type {Awaited<ReturnType<typeof startLocalReplicaSet>>|undefined} */
let runtime;
let previousMongoUri;

/**
 * Lê apenas as identidades estáveis e o stock necessários para provar que o
 * bootstrap local é idempotente. Passwords, hashes e outros dados de conta não
 * entram no snapshot do teste.
 *
 * @returns {Promise<{counts: {users: number, categories: number, products: number}, userIds: string[], categoryIds: string[], products: Array<{id: string, key: string, stock: number, variants: Array<{variantId: string, stock: number}>}>}>} Snapshot minimizado do seed local.
 */
async function readLocalSeedSnapshot() {
    const database = getDatabase();
    const trackedClientCollections = [
        "profiles",
        "preferences",
        "aiconsultationsessions",
        "faceanalyses",
        "facereports",
        "productrecommendations",
        "reportunlocks",
        "aiconsultationreviews",
        "aiinteractionhistories",
        "skincomparisons",
        "dailyroutines",
        "routinealertpreferences",
        "orders",
        "carts",
        "reviews",
        "notifications",
        "vouchers",
        "faceconsents",
        "facephotos",
    ];
    const [users, categories, products, clientRecords] = await Promise.all([
        database
            .collection("users")
            .find({}, { projection: { _id: 1 } })
            .sort({ _id: 1 })
            .toArray(),
        database
            .collection("categories")
            .find({}, { projection: { _id: 1 } })
            .sort({ _id: 1 })
            .toArray(),
        database
            .collection("products")
            .find(
                {},
                {
                    projection: {
                        _id: 1,
                        brandName: 1,
                        name: 1,
                        stock: 1,
                        "variants.variantId": 1,
                        "variants.stock": 1,
                    },
                },
            )
            .sort({ brandName: 1, name: 1, _id: 1 })
            .toArray(),
        Promise.all(
            trackedClientCollections.map(async (collectionName) => ({
                collectionName,
                ids: (
                    await database
                        .collection(collectionName)
                        .find({}, { projection: { _id: 1 } })
                        .sort({ _id: 1 })
                        .toArray()
                ).map(({ _id }) => _id.toString()),
            })),
        ),
    ]);

    return {
        counts: {
            users: users.length,
            categories: categories.length,
            products: products.length,
        },
        userIds: users.map(({ _id }) => _id.toString()),
        categoryIds: categories.map(({ _id }) => _id.toString()),
        products: products.map((product) => ({
            id: product._id.toString(),
            key: `${product.brandName}:${product.name}`,
            stock: product.stock,
            variants: [...(product.variants ?? [])]
                .map(({ variantId, stock }) => ({ variantId, stock }))
                .sort((left, right) =>
                    left.variantId.localeCompare(right.variantId),
                ),
        })),
        clientRecords: Object.fromEntries(
            clientRecords.map(({ collectionName, ids }) => [collectionName, ids]),
        ),
    };
}

describe("runtime dev:local num MongoMemoryReplSet real", () => {
    beforeAll(async () => {
        runtime = await startLocalReplicaSet();
        previousMongoUri = env.mongoUri;
        env.mongoUri = runtime.mongo.uri;
        await connectDB();
    }, 180_000);

    afterAll(async () => {
        await disconnectDB().catch(() => undefined);
        env.mongoUri = previousMongoUri;
        await runtime?.replSet?.stop();
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
    }, 60_000);

    it("só anuncia ready com primary e confirma rollback multi-documento", async () => {
        expect(isTransactionalMongoReady()).toBe(true);
        expect(mongoose.connection.readyState).toBe(1);

        const readiness = await request(createApp()).get("/api/health/ready");
        expect(readiness.status).toBe(200);
        expect(readiness.body).toEqual({
            status: "ready",
            app: "orelle",
            checks: { mongodb: "ok" },
        });

        const collection = getDatabase().collection("local_runtime_probe");
        const session = await mongoose.startSession();
        try {
            await expect(
                session.withTransaction(async () => {
                    await collection.insertMany(
                        [{ marker: "one" }, { marker: "two" }],
                        { session },
                    );
                    throw new Error("rollback-probe");
                }),
            ).rejects.toThrow("rollback-probe");
        } finally {
            await session.endSession();
        }

        expect(await collection.countDocuments()).toBe(0);
    });

    it("faz bootstrap completo e preserva IDs, stock e utilização manual no replay", async () => {
        expect(process.env.DOTENV_CONFIG_PATH).toBe("/dev/null");
        expect(runtime.mongo.uri).toMatch(
            /^mongodb:\/\/127\.0\.0\.1:\d+\/orelle_local_dev\?replicaSet=orelle-local-rs$/,
        );

        const previousNodeEnv = env.nodeEnv;
        const previousLocalRuntime = env.localRuntime;
        const previousDataEncryptionKey = env.dataEncryptionKey;
        const previousSeedPassword = process.env.SEED_USER_PASSWORD;

        env.nodeEnv = "development";
        env.localRuntime = true;
        env.dataEncryptionKey = "test-local-client-seed-encryption-key-123456789";
        process.env.SEED_USER_PASSWORD = "local-seed-integration-only-123!";

        try {
            await runMigrations({
                client: getDatabaseClient(),
                db: getDatabase(),
            });

            const firstResult = await seedLocalData();
            const firstSnapshot = await readLocalSeedSnapshot();

            expect({
                users: firstResult.users.length,
                categories: firstResult.categories.length,
                products: firstResult.products.length,
            }).toEqual({ users: 8, categories: 4, products: 68 });
            expect(firstSnapshot.counts).toEqual({
                users: 8,
                categories: 4,
                products: 68,
            });
            expect(firstResult.clientData).toEqual({
                scenarios: 5,
                profiles: 4,
                preferences: 4,
                consultations: 5,
                analyses: 4,
                reports: 4,
                recommendations: 12,
                orders: 10,
                reviews: 11,
                notifications: 22,
                activeFacePhotos: 4,
            });
            expect(
                Object.fromEntries(
                    Object.entries(firstSnapshot.clientRecords).map(
                        ([collectionName, ids]) => [collectionName, ids.length],
                    ),
                ),
            ).toMatchObject({
                profiles: 4,
                preferences: 4,
                aiconsultationsessions: 5,
                faceanalyses: 4,
                facereports: 4,
                productrecommendations: 12,
                reportunlocks: 4,
                aiconsultationreviews: 4,
                aiinteractionhistories: 12,
                skincomparisons: 1,
                dailyroutines: 1,
                routinealertpreferences: 1,
                orders: 10,
                carts: 2,
                reviews: 11,
                notifications: 22,
                vouchers: 1,
                faceconsents: 3,
                facephotos: 4,
            });

            const database = getDatabase();
            const mainClient = await database.collection("users").findOne({
                email: "cliente@orelle.test",
            });
            const firstUnreadNotification = await database
                .collection("notifications")
                .findOne({ userId: mainClient._id, isRead: false });
            const mainCart = await database.collection("carts").findOne({
                userId: mainClient._id,
            });
            const mainRecommendation = await database
                .collection("productrecommendations")
                .findOne({ userId: mainClient._id });
            const manualFeedbackAt = new Date("2026-07-12T20:00:00.000Z");
            await Promise.all([
                database.collection("notifications").updateOne(
                    { _id: firstUnreadNotification._id },
                    { $set: { isRead: true, readAt: manualFeedbackAt } },
                ),
                database.collection("carts").updateOne(
                    { _id: mainCart._id },
                    { $set: { "items.0.quantity": 3 } },
                ),
                database.collection("productrecommendations").updateOne(
                    { _id: mainRecommendation._id },
                    {
                        $set: {
                            feedback: {
                                value: "nao_relevante",
                                submittedAt: manualFeedbackAt,
                            },
                        },
                    },
                ),
            ]);
            const [stableProfileBeforeReplay, stableOrderBeforeReplay] =
                await Promise.all([
                    database.collection("profiles").findOne({
                        userId: mainClient._id,
                    }),
                    database.collection("orders").findOne({
                        userId: mainClient._id,
                    }),
                ]);

            const mutableProduct = firstSnapshot.products.find((product) =>
                product.variants.some(({ stock }) => stock > 0),
            );
            const mutableVariant = mutableProduct?.variants.find(
                ({ stock }) => stock > 0,
            );
            expect(mutableProduct).toBeDefined();
            expect(mutableVariant).toBeDefined();
            const stockMutation = await getDatabase()
                .collection("products")
                .updateOne(
                    {
                        _id: new mongoose.Types.ObjectId(mutableProduct.id),
                        "variants.variantId": mutableVariant.variantId,
                    },
                    {
                        $inc: {
                            stock: -1,
                            "variants.$.stock": -1,
                        },
                    },
                );
            expect(stockMutation.modifiedCount).toBe(1);
            const deliberatelyChangedSnapshot = await readLocalSeedSnapshot();
            expect(deliberatelyChangedSnapshot).not.toEqual(firstSnapshot);

            const secondResult = await seedLocalData();
            const secondSnapshot = await readLocalSeedSnapshot();

            expect({
                users: secondResult.users.length,
                categories: secondResult.categories.length,
                products: secondResult.products.length,
            }).toEqual({ users: 8, categories: 4, products: 68 });
            expect(secondSnapshot).toEqual(deliberatelyChangedSnapshot);
            expect(secondSnapshot.userIds).toEqual(firstSnapshot.userIds);
            expect(secondSnapshot.categoryIds).toEqual(
                firstSnapshot.categoryIds,
            );
            expect(secondSnapshot.products.map(({ id }) => id)).toEqual(
                firstSnapshot.products.map(({ id }) => id),
            );
            expect(secondSnapshot.clientRecords).toEqual(firstSnapshot.clientRecords);
            expect(secondResult.clientData).toEqual(firstResult.clientData);

            const [preservedNotification, preservedCart, preservedRecommendation] =
                await Promise.all([
                    database.collection("notifications").findOne({
                        _id: firstUnreadNotification._id,
                    }),
                    database.collection("carts").findOne({ _id: mainCart._id }),
                    database.collection("productrecommendations").findOne({
                        _id: mainRecommendation._id,
                    }),
                ]);
            expect(preservedNotification).toMatchObject({ isRead: true });
            expect(preservedNotification.readAt).toEqual(manualFeedbackAt);
            expect(preservedCart.items[0].quantity).toBe(3);
            expect(preservedRecommendation.feedback).toEqual({
                value: "nao_relevante",
                submittedAt: manualFeedbackAt,
            });

            const [rawProfile, rawAnalysis, rawReport, rawSession, rawHistory] =
                await Promise.all([
                    database.collection("profiles").findOne({ userId: mainClient._id }),
                    database.collection("faceanalyses").findOne({ userId: mainClient._id }),
                    database.collection("facereports").findOne({ userId: mainClient._id }),
                    database.collection("aiconsultationsessions").findOne({
                        userId: mainClient._id,
                    }),
                    database.collection("aiinteractionhistories").findOne({
                        userId: mainClient._id,
                    }),
                ]);
            const stableOrderAfterReplay = await database.collection("orders").findOne({
                _id: stableOrderBeforeReplay._id,
            });
            expect(rawProfile.createdAt).toEqual(stableProfileBeforeReplay.createdAt);
            expect(rawProfile.updatedAt).toEqual(stableProfileBeforeReplay.updatedAt);
            expect(stableOrderAfterReplay.createdAt).toEqual(
                stableOrderBeforeReplay.createdAt,
            );
            expect(stableOrderAfterReplay.updatedAt).toEqual(
                stableOrderBeforeReplay.updatedAt,
            );
            for (const encryptedValue of [
                rawProfile.avoidIngredients,
                rawAnalysis.findings,
                rawReport.cosmeticSummary,
                rawSession.goalSelection,
                preservedRecommendation.explanation,
                rawHistory.safeSummary,
            ]) {
                expect(encryptedValue).toMatchObject({
                    encrypted: true,
                    algorithm: "aes-256-gcm",
                    keyVersion: 2,
                });
            }
            expect(JSON.stringify(secondResult.clientData)).not.toMatch(
                /password|storageKey|ciphertext|authTag/i,
            );

            const activePhotos = await FacePhoto.find({ status: "active" })
                .select("+storageKey +encryption +encryption.iv +encryption.authTag")
                .sort({ userId: 1, kind: 1 });
            expect(activePhotos).toHaveLength(4);
            for (const photo of activePhotos) {
                expect(photo.storageKey).toMatch(/\.enc$/);
                expect((await stat(photo.storageKey)).size).toBeGreaterThan(0);
                await expect(stat(photo.storageKey.slice(0, -4))).rejects.toThrow();
                expect((await readEncryptedFacePhotoFile(photo)).byteLength).toBeGreaterThan(0);
            }

            const [profile, skinHistory, routine, orders, notifications] =
                await Promise.all([
                    getMyProfile(mainClient._id.toString()),
                    getPersonalSkinHistory(mainClient._id.toString()),
                    getDailyRoutineForUser(mainClient._id.toString()),
                    listMyOrders(mainClient._id.toString()),
                    listMyNotifications(mainClient._id.toString()),
                ]);
            expect(profile.nome).toBe("Cliente Demo");
            expect(skinHistory.length).toBeGreaterThanOrEqual(6);
            expect(routine.steps).toHaveLength(3);
            expect(orders).toHaveLength(6);
            expect(notifications).toHaveLength(8);

            const ines = await database.collection("users").findOne({
                email: "cliente.ines@orelle.test",
            });
            const joao = await database.collection("users").findOne({
                email: "cliente.joao@orelle.test",
            });
            const sofia = await database.collection("users").findOne({
                email: "cliente.sofia@orelle.test",
            });
            const consultant = await database.collection("users").findOne({
                email: "consultor@orelle.test",
            });
            expect((await getCurrentAiConsultationSession(ines._id.toString())).flowState)
                .toBe("collecting_photos");
            expect((await getCurrentAiConsultationSession(joao._id.toString())).flowState)
                .toBe("review_pending");
            expect(await database.collection("profiles").findOne({ userId: sofia._id }))
                .toBeNull();
            const reviewQueue = await listAiConsultationReviewsForConsultant({
                id: consultant._id.toString(),
                role: "consultor",
            }, { requestId: "seed-integration-check" });
            expect(reviewQueue).toHaveLength(1);
            expect(reviewQueue[0].status).toBe("pending");
        } finally {
            env.nodeEnv = previousNodeEnv;
            env.localRuntime = previousLocalRuntime;
            env.dataEncryptionKey = previousDataEncryptionKey;
            if (previousSeedPassword === undefined) {
                delete process.env.SEED_USER_PASSWORD;
            } else {
                process.env.SEED_USER_PASSWORD = previousSeedPassword;
            }
        }
    }, 120_000);
});
