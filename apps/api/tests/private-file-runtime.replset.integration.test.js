/**
 * Durabilidade do lifecycle de ficheiros privados sobre replica set efémero.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    FILE_DELETION_JOB_RETENTION_SECONDS,
    FILE_DELETION_JOB_STATUSES,
    FileDeletionJob,
} from "../src/models/file-deletion-job.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../src/models/makeup-simulation.model.js";
import {
    enqueueFileDeletionJobs,
    processNextFileDeletionJob,
} from "../src/services/file-deletion-job.service.js";
import { runPrivateFileMaintenanceOnce } from "../src/services/private-file-runtime.service.js";

const DATABASE_NAME = "orelle_private_file_runtime_test";
const TEMP_ROOT = path.join(
    os.tmpdir(),
    `orelle-private-runtime-${randomUUID()}`,
);
let replicaSet;

describe("worker durável de ficheiros privados", () => {
    beforeAll(async () => {
        await mkdir(TEMP_ROOT, { recursive: true });
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
            instanceOpts: [{ ip: "127.0.0.1" }],
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (
            !uri.startsWith("mongodb://127.0.0.1:") ||
            !uri.includes(`/${DATABASE_NAME}?`) ||
            uri.includes("@")
        ) {
            throw new Error("URI externa recusada no teste do worker privado");
        }
        await mongoose.connect(uri);
        await Promise.all([
            FileDeletionJob.syncIndexes(),
            MakeupSimulation.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        await Promise.all([
            FileDeletionJob.deleteMany({}),
            MakeupSimulation.deleteMany({}),
        ]);
        await rm(TEMP_ROOT, { recursive: true, force: true });
        await mkdir(TEMP_ROOT, { recursive: true });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
        await rm(TEMP_ROOT, { recursive: true, force: true });
    }, 60_000);

    it("retém apenas o tombstone terminal minimizado durante sete dias", () => {
        const terminalIndex = FileDeletionJob.schema
            .indexes()
            .find(([keys]) => keys.terminalAt === 1);

        expect(FILE_DELETION_JOB_RETENTION_SECONDS).toBe(7 * 24 * 60 * 60);
        expect(terminalIndex).toEqual([
            { terminalAt: 1 },
            expect.objectContaining({
                expireAfterSeconds: FILE_DELETION_JOB_RETENTION_SECONDS,
                name: "ttl_completed_file_deletion_jobs_7d",
            }),
        ]);
    });

    it("persiste falha/backoff e conclui o mesmo job depois do restart", async () => {
        const storageKey = path.join(TEMP_ROOT, "retry.enc");
        await writeFile(storageKey, Buffer.from("private-retry"));
        const ownerId = new mongoose.Types.ObjectId();
        await enqueueFileDeletionJobs([
            {
                sourceType: "runtime_retry",
                sourceId: new mongoose.Types.ObjectId(),
                ownerId,
                storageKey,
            },
        ]);
        // O relógio do processamento tem de ser posterior ao `availableAt`
        // criado pelo enqueue. Uma data civil fixa torna o teste dependente da
        // hora real a que a suite corre e passa a falhar ao atravessar esse
        // instante, sem existir regressão do worker.
        const now = new Date();

        const failed = await processNextFileDeletionJob({
            now,
            unlinkFile: async () => {
                throw Object.assign(new Error("permission"), { code: "EACCES" });
            },
        });
        expect(failed).toMatchObject({ claimed: true, failed: true });
        let stored = await FileDeletionJob.findOne({ ownerId })
            .select("+storageKey")
            .lean();
        expect(stored).toMatchObject({
            status: FILE_DELETION_JOB_STATUSES.FAILED,
            attempts: 1,
            availableAt: new Date(now.getTime() + 1_000),
            storageKey,
        });

        await expect(
            processNextFileDeletionJob({
                now: new Date(now.getTime() + 500),
            }),
        ).resolves.toMatchObject({ claimed: false });
        await expect(
            processNextFileDeletionJob({
                now: new Date(now.getTime() + 1_001),
            }),
        ).resolves.toMatchObject({ claimed: true, completed: true });
        stored = await FileDeletionJob.findById(stored._id)
            .select("+storageKey")
            .lean();
        expect(stored).toMatchObject({
            status: FILE_DELETION_JOB_STATUSES.COMPLETED,
            attempts: 2,
            completedAt: new Date(now.getTime() + 1_001),
            terminalAt: new Date(now.getTime() + 1_001),
        });
        expect(stored.storageKey).toBeUndefined();
        expect(stored.ownerId).toBeUndefined();
        expect(stored.sourceType).toBeUndefined();
        expect(stored.sourceId).toBeUndefined();
        await expect(readFile(storageKey)).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("reclama lease expirado deixado por outro processo", async () => {
        const now = new Date("2026-07-11T13:00:00.000Z");
        const storageKey = path.join(TEMP_ROOT, "abandoned.enc");
        await writeFile(storageKey, Buffer.from("private-abandoned"));
        const job = await FileDeletionJob.create({
            deduplicationKey: "c".repeat(64),
            sourceType: "runtime_restart",
            sourceId: new mongoose.Types.ObjectId().toString(),
            ownerId: new mongoose.Types.ObjectId(),
            storageKey,
            status: FILE_DELETION_JOB_STATUSES.PROCESSING,
            attempts: 1,
            availableAt: new Date(now.getTime() - 60_000),
            lease: {
                token: "dead-process",
                expiresAt: new Date(now.getTime() - 1),
            },
        });

        await expect(processNextFileDeletionJob({ now })).resolves.toMatchObject({
            claimed: true,
            completed: true,
        });
        expect((await FileDeletionJob.findById(job._id)).attempts).toBe(2);
        await expect(readFile(storageKey)).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("expira e elimina output sem depender de um novo POST", async () => {
        const now = new Date("2026-07-11T14:00:00.000Z");
        const storageKey = path.join(TEMP_ROOT, "expired-makeup.enc");
        await writeFile(storageKey, Buffer.from("private-expired"));
        const simulationId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId();
        await MakeupSimulation.collection.insertOne({
            _id: simulationId,
            schemaVersion: 2,
            userId: ownerId,
            reportId: new mongoose.Types.ObjectId(),
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            outputStorageKey: storageKey,
            expiresAt: new Date(now.getTime() - 1),
            activeGenerationKey: `makeup:${ownerId.toString()}:${new mongoose.Types.ObjectId().toString()}`,
            createdAt: new Date(now.getTime() - 10_000),
            updatedAt: new Date(now.getTime() - 10_000),
        });

        await expect(
            runPrivateFileMaintenanceOnce({ now }),
        ).resolves.toMatchObject({
            expiredOutputs: 1,
            claimed: 1,
            completed: 1,
            failed: 0,
        });
        const simulation = await MakeupSimulation.findById(simulationId)
            .select("+outputStorageKey +activeGenerationKey")
            .lean();
        expect(simulation.status).toBe(MAKEUP_SIMULATION_STATUSES.EXPIRED);
        expect(simulation.outputStorageKey).toBeUndefined();
        expect(simulation.activeGenerationKey).toBeUndefined();
        await expect(readFile(storageKey)).rejects.toMatchObject({ code: "ENOENT" });
        const completedDeletion = await FileDeletionJob.findOne({
            status: FILE_DELETION_JOB_STATUSES.COMPLETED,
        }).lean();
        expect(completedDeletion).toMatchObject({
            terminalAt: expect.any(Date),
        });
        expect(completedDeletion.sourceType).toBeUndefined();
        expect(completedDeletion.sourceId).toBeUndefined();
        expect(completedDeletion.ownerId).toBeUndefined();
    });
});
