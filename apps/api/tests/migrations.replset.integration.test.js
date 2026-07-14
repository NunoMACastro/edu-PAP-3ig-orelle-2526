/**
 * Integração real do runner e das migrações num replica set efémero.
 * Nenhuma URI externa ou variável da aplicação é lida por esta suite.
 */
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MIGRATIONS } from "../src/migrations/index.js";
import { migration007RetentionAndAuditIndexes } from "../src/migrations/007_retention_and_audit_indexes.js";
import {
    dryRunMigrations,
    getMigrationStatus,
    MIGRATION_COLLECTION,
    MIGRATION_LOCK_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";

const DATABASE_NAME = "orelle_migrations_test";
const RETENTION_DATABASE_NAME = "orelle_migrations_retention_test";
const MIGRATION_007_WITH_SOURCE = Object.freeze({
    ...migration007RetentionAndAuditIndexes,
    sourcePath: fileURLToPath(
        new URL(
            "../src/migrations/007_retention_and_audit_indexes.js",
            import.meta.url,
        ),
    ),
});
let replicaSet;
let client;
let db;
let paidOrderId;
let cancelledOrderId;
let provenVoucherId;
let unrelatedVoucherId;
let validOpaqueSessionId;

/**
 * Insere contratos legados diretamente, contornando deliberadamente schemas
 * atuais para reproduzir a base anterior à migração.
 *
 * @returns {Promise<void>}
 */
async function seedLegacyState() {
    const orders = db.collection("orders");
    const vouchers = db.collection("vouchers");
    paidOrderId = new mongoose.mongo.ObjectId();
    cancelledOrderId = new mongoose.mongo.ObjectId();
    provenVoucherId = new mongoose.mongo.ObjectId();
    unrelatedVoucherId = new mongoose.mongo.ObjectId();
    const userId = new mongoose.mongo.ObjectId();
    const createdAt = new Date("2026-06-01T10:00:00.000Z");

    await orders.insertMany([
        {
            _id: paidOrderId,
            userId,
            items: [],
            status: "pendente",
            payment: {
                status: "paid",
                gateway: "legacy-gateway",
                checkoutUrl: "https://payments.invalid/legacy",
                externalReference: "external-secret-reference",
            },
            stockReserved: true,
            createdAt,
            updatedAt: createdAt,
        },
        {
            _id: cancelledOrderId,
            userId,
            items: [],
            status: "pendente",
            payment: {
                status: "manual",
                provider: "manual-provider",
            },
            voucher: {
                voucherId: provenVoucherId,
                code: "LEGACY-VOUCHER",
                amountCents: 1000,
            },
            stockReserved: true,
            createdAt,
            updatedAt: createdAt,
        },
    ]);
    await vouchers.insertMany([
        {
            _id: provenVoucherId,
            userId,
            code: "LEGACY-VOUCHER",
            amountCents: 1000,
            remainingCents: 0,
            appliedOrderIds: [cancelledOrderId],
            status: "used",
        },
        {
            _id: unrelatedVoucherId,
            userId,
            code: "UNRELATED-VOUCHER",
            amountCents: 500,
            remainingCents: 0,
            appliedOrderIds: [],
            status: "used",
        },
    ]);

    const authSessions = db.collection("authsessions");
    validOpaqueSessionId = new mongoose.mongo.ObjectId();
    const duplicateHash = "d".repeat(64);
    await authSessions.insertMany([
        {
            _id: validOpaqueSessionId,
            tokenHash: "a".repeat(64),
            userId,
            expiresAt: new Date("2027-06-01T10:00:00.000Z"),
        },
        {
            tokenHash: "b".repeat(64),
            userId,
            expiresAt: new Date("2025-06-01T10:00:00.000Z"),
        },
        {
            tokenHash: "hash-invalido",
            userId,
            expiresAt: new Date("2027-06-01T10:00:00.000Z"),
        },
        {
            tokenHash: "c".repeat(64),
            userId,
            expiresAt: new Date("2027-06-01T10:00:00.000Z"),
            jwt: "credencial-legada-nao-promovivel",
        },
        {
            tokenHash: duplicateHash,
            userId,
            expiresAt: new Date("2027-06-01T10:00:00.000Z"),
        },
        {
            tokenHash: duplicateHash,
            userId: new mongoose.mongo.ObjectId(),
            expiresAt: new Date("2027-06-01T10:00:00.000Z"),
        },
    ]);
}

describe("migrations locais canónicas 001-015", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de migrations não é loopback efémera");
        }

        client = new mongoose.mongo.MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
        await seedLegacyState();
    }, 120_000);

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("faz status e dry-run sem criar registos nem alterar dados", async () => {
        const before = await db.collection("orders").find({}).toArray();
        const status = await getMigrationStatus({ db });
        const dryRun = await dryRunMigrations({ db });
        const after = await db.collection("orders").find({}).toArray();

        expect(status.map(({ state }) => state)).toEqual(
            Array(MIGRATIONS.length).fill("pending"),
        );
        expect(dryRun[0].analysis).toMatchObject({
            legacyPaid: 1,
            legacyUnpaid: 1,
            externalMetadata: 2,
        });
        expect(dryRun[1].analysis).toMatchObject({
            missingCheckoutKey: 2,
            missingPaymentAttempts: 2,
        });
        expect(dryRun[2].analysis).toMatchObject({
            legacyCredentialDocuments: 1,
            structurallyInvalidSessions: 1,
            expiredOpaqueSessions: 1,
            duplicateOpaqueSessions: 2,
            missingIndexes: 5,
        });
        expect(dryRun[3].analysis).toMatchObject({
            unverifiedCompletedRequests: 0,
            completedJobsWithSensitiveMetadata: 0,
            missingIndexes: 8,
        });
        expect(dryRun[4].analysis).toMatchObject({
            documentsNeedingEncryption: 0,
            fieldsNeedingEncryption: 0,
        });
        expect(dryRun[5].analysis).toMatchObject({
            legacyRecommendations: 0,
            legacyReviews: 0,
            missingIndexes: 3,
        });
        expect(dryRun[6].analysis).toMatchObject({
            metricsWithoutCreatedAt: 0,
            missingIndexes: 9,
        });
        expect(dryRun[7].analysis).toMatchObject({
            documentsNeedingEncryption: 0,
            fieldsNeedingEncryption: 0,
            reviewsNeedingOverride: 0,
        });
        expect(dryRun[8].analysis).toMatchObject({
            barrierUsers: 0,
            legacyFacePhotoFiles: 0,
            duplicateFaceReports: 0,
            duplicateGuidedDrafts: 0,
            missingIndexes: 2,
            privacyReasonFieldsNeedingEncryption: 0,
        });
        expect(after).toEqual(before);
        expect(
            await db.collection(MIGRATION_COLLECTION).countDocuments(),
        ).toBe(0);
        expect(
            await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments(),
        ).toBe(0);
    });

    it("aplica 001-015 sem promover estados/credenciais e cria índices canónicos", async () => {
        const applied = await runMigrations({
            client,
            db,
            now: new Date("2026-07-09T23:00:00.000Z"),
            ownerId: "migration-test-owner",
        });
        const [paidOrder, cancelledOrder, provenVoucher, unrelatedVoucher] =
            await Promise.all([
                db.collection("orders").findOne({ _id: paidOrderId }),
                db.collection("orders").findOne({ _id: cancelledOrderId }),
                db.collection("vouchers").findOne({ _id: provenVoucherId }),
                db.collection("vouchers").findOne({ _id: unrelatedVoucherId }),
            ]);

        expect(applied.map(({ state }) => state)).toEqual(
            Array(MIGRATIONS.length).fill("applied"),
        );
        expect(paidOrder.payment).toMatchObject({
            mode: "simulated_legacy",
            status: "simulated_paid",
        });
        expect(paidOrder.payment.simulationReference).toBe(
            `SIM-LEGACY-${paidOrderId}`,
        );
        expect(paidOrder.payment).not.toHaveProperty("gateway");
        expect(paidOrder.payment).not.toHaveProperty("checkoutUrl");
        expect(paidOrder.payment).not.toHaveProperty("externalReference");
        expect(cancelledOrder).toMatchObject({
            status: "cancelled",
            stockReserved: false,
            checkoutKey: `LEGACY-${cancelledOrderId}`,
            paymentAttempts: [],
            payment: {
                mode: "simulated_legacy",
                status: "cancelled_legacy",
                simulationReference: null,
            },
        });
        expect(cancelledOrder.payment).not.toHaveProperty("provider");
        expect(provenVoucher).toMatchObject({
            remainingCents: 1000,
            status: "active",
            appliedOrderIds: [],
        });
        expect(unrelatedVoucher).toMatchObject({
            remainingCents: 0,
            status: "used",
            appliedOrderIds: [],
        });
        expect(
            await db.collection(MIGRATION_COLLECTION).countDocuments(),
        ).toBe(MIGRATIONS.length);
        expect(
            await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments(),
        ).toBe(0);

        const remainingSessions = await db
            .collection("authsessions")
            .find({})
            .toArray();
        expect(remainingSessions).toHaveLength(1);
        expect(remainingSessions[0]).toMatchObject({
            _id: validOpaqueSessionId,
            tokenHash: "a".repeat(64),
            revokedAt: null,
            csrfHash: null,
        });
        expect(remainingSessions[0].lastSeenAt).toBeInstanceOf(Date);
        const sessionIndexes = await db
            .collection("authsessions")
            .listIndexes()
            .toArray();
        expect(sessionIndexes.find(({ name }) => name === "tokenHash_1")).toMatchObject({
            unique: true,
        });
        expect(sessionIndexes.find(({ name }) => name === "expiresAt_1")).toMatchObject({
            expireAfterSeconds: 0,
        });
        expect(
            sessionIndexes.some(
                ({ name }) => name === "userId_1_revokedAt_1_expiresAt_1",
            ),
        ).toBe(true);
    }, 30_000);

    it("é idempotente e deteta checksum alterado", async () => {
        const voucherBefore = await db
            .collection("vouchers")
            .findOne({ _id: provenVoucherId });
        const replay = await runMigrations({
            client,
            db,
            ownerId: "migration-replay-owner",
        });
        const voucherAfter = await db
            .collection("vouchers")
            .findOne({ _id: provenVoucherId });

        expect(replay.map(({ state }) => state)).toEqual(
            Array(MIGRATIONS.length).fill("skipped"),
        );
        expect(voucherAfter).toEqual(voucherBefore);

        const records = db.collection(MIGRATION_COLLECTION);
        const original = await records.findOne({ version: MIGRATIONS[0].version });
        await records.updateOne(
            { version: MIGRATIONS[0].version },
            { $set: { checksum: "checksum-adulterado" } },
        );
        await expect(
            runMigrations({ client, db, ownerId: "checksum-owner" }),
        ).rejects.toThrow(`Checksum divergente na migração ${MIGRATIONS[0].version}`);
        await records.updateOne(
            { version: MIGRATIONS[0].version },
            { $set: { checksum: original.checksum } },
        );
    });

    it("recusa lock ativo e liberta lock após rollback de validação", async () => {
        const locks = db.collection(MIGRATION_LOCK_COLLECTION);
        await locks.insertOne({
            _id: "global",
            ownerId: "outro-runner",
            acquiredAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
        });
        await expect(
            runMigrations({ client, db, ownerId: "blocked-owner" }),
        ).rejects.toThrow("Lock de migração ocupado");
        await locks.deleteOne({ _id: "global" });

        const failingMigration = {
            version: "999_validation_failure_probe",
            description: "Prova rollback do runner",
            sourcePath: MIGRATIONS.at(-1).sourcePath,
            analyze: async () => ({ probes: 0 }),
            up: async ({ db: currentDb, session }) => {
                await currentDb
                    .collection("migration_probe")
                    .insertOne({ state: "must_rollback" }, { session });
                return { probes: 1 };
            },
            validate: async () => {
                throw new Error("validação injetada falhou");
            },
        };

        await expect(
            runMigrations({
                client,
                db,
                migrations: [...MIGRATIONS, failingMigration],
                ownerId: "rollback-owner",
            }),
        ).rejects.toThrow("validação injetada falhou");
        expect(
            await db.collection("migration_probe").countDocuments(),
        ).toBe(0);
        expect(
            await db
                .collection(MIGRATION_COLLECTION)
                .countDocuments({ version: failingMigration.version }),
        ).toBe(0);
        expect(await locks.countDocuments()).toBe(0);
    });

    it("renova o lease e impede executar a mesma versão duas vezes", async () => {
        const probeId = "lease-heartbeat";
        const slowMigration = {
            version: "999_lease_heartbeat_probe",
            description: "Prova heartbeat e unicidade do runner",
            sourcePath: MIGRATIONS.at(-1).sourcePath,
            analyze: async () => ({ probes: 0 }),
            up: async ({ db: currentDb, session }) => {
                await new Promise((resolve) => setTimeout(resolve, 1_800));
                await currentDb.collection("migration_probe").updateOne(
                    { _id: probeId },
                    { $inc: { count: 1 } },
                    { upsert: true, session },
                );
                return { probes: 1 };
            },
            validate: async ({ db: currentDb, session }) => {
                const probe = await currentDb
                    .collection("migration_probe")
                    .findOne({ _id: probeId }, { session });
                if (probe?.count !== 1) {
                    throw new Error("heartbeat permitiu execução duplicada");
                }
                return { probeCount: probe.count };
            },
        };
        const migrations = [...MIGRATIONS, slowMigration];
        const firstRun = runMigrations({
            client,
            db,
            migrations,
            ownerId: "heartbeat-owner-primary",
            lockTtlMs: 1_000,
        });

        await new Promise((resolve) => setTimeout(resolve, 1_100));
        const secondRun = runMigrations({
            client,
            db,
            migrations,
            ownerId: "heartbeat-owner-secondary",
            lockTtlMs: 1_000,
        });
        const [primary, secondary] = await Promise.allSettled([
            firstRun,
            secondRun,
        ]);

        expect(primary.status).toBe("fulfilled");
        expect(secondary.status).toBe("rejected");
        expect(secondary.reason).toMatchObject({
            message: "Lock de migração ocupado",
        });
        expect(
            await db.collection("migration_probe").findOne({ _id: probeId }),
        ).toMatchObject({ count: 1 });
        expect(
            await db
                .collection(MIGRATION_COLLECTION)
                .countDocuments({ version: slowMigration.version }),
        ).toBe(1);
        expect(
            (
                await db
                    .collection(MIGRATION_COLLECTION)
                    .listIndexes()
                    .toArray()
            ).find(({ name }) => name === "version_1_unique"),
        ).toMatchObject({ unique: true });

        await db.collection("migration_probe").deleteOne({ _id: probeId });
        await db
            .collection(MIGRATION_COLLECTION)
            .deleteOne({ version: slowMigration.version });
    }, 10_000);

    it("aplica 007 numa base de retenção separada e preserva audit trails", async () => {
        const retentionDb = client.db(RETENTION_DATABASE_NAME);
        const metricId = new mongoose.mongo.ObjectId();
        const actorId = new mongoose.mongo.ObjectId();
        const userId = new mongoose.mongo.ObjectId();
        const sessionId = new mongoose.mongo.ObjectId();
        await retentionDb.collection("performancemetrics").insertOne({
            _id: metricId,
            operation: "http_request",
            status: "success",
            updatedAt: new Date("2026-07-10T09:00:00.000Z"),
        });
        await retentionDb.collection("biometricaccesslogs").insertOne({
            actorId,
            subjectUserId: userId,
            alertRaised: false,
            createdAt: new Date("2026-07-10T09:00:00.000Z"),
        });
        await retentionDb.collection("aiinteractionhistories").insertOne({
            userId,
            sessionId,
            eventType: "consultation_submitted",
            createdAt: new Date("2026-07-10T09:00:00.000Z"),
        });
        await retentionDb
            .collection("performancemetrics")
            .createIndex(
                { createdAt: 1 },
                { name: "createdAt_1", expireAfterSeconds: 86_400 },
            );
        await retentionDb
            .collection("biometricaccesslogs")
            .createIndex(
                { createdAt: -1 },
                { name: "createdAt_-1", expireAfterSeconds: 86_400 },
            );
        const auditBefore = await Promise.all([
            retentionDb.collection("biometricaccesslogs").find({}).toArray(),
            retentionDb.collection("aiinteractionhistories").find({}).toArray(),
        ]);

        const statusBefore = await getMigrationStatus({
            db: retentionDb,
            migrations: [MIGRATION_007_WITH_SOURCE],
        });
        const dryRun = await dryRunMigrations({
            db: retentionDb,
            migrations: [MIGRATION_007_WITH_SOURCE],
        });
        expect(statusBefore[0].state).toBe("pending");
        expect(dryRun[0].analysis).toMatchObject({
            metricsWithoutCreatedAt: 1,
            mismatchedIndexes: 2,
        });

        const applied = await runMigrations({
            client,
            db: retentionDb,
            migrations: [MIGRATION_007_WITH_SOURCE],
            now: new Date("2026-07-10T10:00:00.000Z"),
            ownerId: "retention-migration-owner",
        });
        expect(applied[0].state).toBe("applied");
        expect(
            await retentionDb.collection("performancemetrics").findOne({ _id: metricId }),
        ).toMatchObject({ createdAt: new Date("2026-07-10T09:00:00.000Z") });
        expect(
            await Promise.all([
                retentionDb.collection("biometricaccesslogs").find({}).toArray(),
                retentionDb.collection("aiinteractionhistories").find({}).toArray(),
            ]),
        ).toEqual(auditBefore);

        const metricIndexes = await retentionDb
            .collection("performancemetrics")
            .listIndexes()
            .toArray();
        const biometricIndexes = await retentionDb
            .collection("biometricaccesslogs")
            .listIndexes()
            .toArray();
        expect(metricIndexes.find(({ name }) => name === "createdAt_1")).toMatchObject({
            expireAfterSeconds: 2_592_000,
        });
        expect(
            biometricIndexes.find(({ name }) => name === "createdAt_-1"),
        ).not.toHaveProperty("expireAfterSeconds");

        const replay = await runMigrations({
            client,
            db: retentionDb,
            migrations: [MIGRATION_007_WITH_SOURCE],
            ownerId: "retention-migration-replay",
        });
        expect(replay).toEqual([
            { version: MIGRATION_007_WITH_SOURCE.version, state: "skipped" },
        ]);
        const statusAfter = await getMigrationStatus({
            db: retentionDb,
            migrations: [MIGRATION_007_WITH_SOURCE],
        });
        expect(statusAfter[0]).toMatchObject({
            state: "applied",
            checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
        });
    });

    it("retoma uma fase DDL interrompida sem registar migração incompleta", async () => {
        const resumeDb = client.db("orelle_migrations_phase_resume_test");
        let finalizeAttempts = 0;
        const resumableMigration = {
            version: "900_resumable_ddl_probe",
            description: "Prova replay idempotente entre DML e DDL",
            sourcePath: MIGRATIONS.at(-1).sourcePath,
            executionMode: "transaction_then_finalize",
            analyze: async () => ({ pending: 1 }),
            up: async ({ db: currentDb, session }) => {
                await currentDb.collection("phase_probe").updateOne(
                    { _id: "singleton" },
                    { $set: { normalized: true } },
                    { upsert: true, session },
                );
                return { normalized: 1 };
            },
            finalize: async ({ db: currentDb }) => {
                finalizeAttempts += 1;
                if (finalizeAttempts === 1) {
                    throw new Error("falha DDL injetada");
                }
                await currentDb
                    .collection("phase_probe")
                    .createIndex({ normalized: 1 }, { name: "normalized_1" });
                return { indexesCreated: 1 };
            },
            validate: async ({ db: currentDb }) => {
                const document = await currentDb
                    .collection("phase_probe")
                    .findOne({ _id: "singleton" });
                const indexes = await currentDb
                    .collection("phase_probe")
                    .listIndexes()
                    .toArray();
                if (
                    document?.normalized !== true ||
                    !indexes.some(({ name }) => name === "normalized_1")
                ) {
                    throw new Error("fase retomável incompleta");
                }
                return { pending: 0 };
            },
        };

        await expect(
            runMigrations({
                client,
                db: resumeDb,
                migrations: [resumableMigration],
                ownerId: "resume-first-attempt",
            }),
        ).rejects.toThrow("falha DDL injetada");
        expect(
            await resumeDb.collection(MIGRATION_COLLECTION).countDocuments(),
        ).toBe(0);
        expect(
            await resumeDb.collection(MIGRATION_LOCK_COLLECTION).countDocuments(),
        ).toBe(0);
        expect(
            await resumeDb.collection("phase_probe").countDocuments(),
        ).toBe(1);

        const resumed = await runMigrations({
            client,
            db: resumeDb,
            migrations: [resumableMigration],
            ownerId: "resume-second-attempt",
        });
        expect(resumed[0]).toMatchObject({
            state: "applied",
            changes: { normalized: 1, indexesCreated: 1 },
            validation: { pending: 0 },
        });
        expect(finalizeAttempts).toBe(2);
        expect(
            await resumeDb.collection(MIGRATION_COLLECTION).countDocuments(),
        ).toBe(1);
        expect(
            await resumeDb.collection("phase_probe").countDocuments(),
        ).toBe(1);
    });
});
