/**
 * Concorrência e rollback dos alertas de rotina num replica set efémero.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { Notification } from "../src/models/notification.model.js";
import { RoutineAlertPreference } from "../src/models/routine-alert-preference.model.js";
import { createDueRoutineAlerts } from "../src/services/routine-alert.service.js";

const DATABASE_NAME = "orelle_routine_alerts_test";
const NOW = new Date("2026-07-10T21:30:00.000Z");
let replicaSet;
let userId;

async function seedDueRoutine(label) {
    userId = new mongoose.Types.ObjectId();
    await RoutineAlertPreference.create({
        userId,
        enabled: true,
        eveningTime: "21:00",
        lastNotificationKey: null,
    });
    await DailyRoutine.create({
        userId,
        source: "recommendations",
        steps: [],
        limitations: [`Fixture ${label}`],
    });
}

describe("alertas de rotina transacionais", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de alertas não é loopback efémera");
        }
        await mongoose.connect(uri);
        await Promise.all([
            RoutineAlertPreference.syncIndexes(),
            Notification.syncIndexes(),
            DailyRoutine.syncIndexes(),
        ]);
    }, 120_000);

    afterEach(async () => {
        vi.restoreAllMocks();
        await Promise.all([
            RoutineAlertPreference.deleteMany({}),
            Notification.deleteMany({}),
            DailyRoutine.deleteMany({}),
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("vinte execuções concorrentes criam exatamente um alerta diário", async () => {
        await seedDueRoutine("concorrência");
        const results = await Promise.all(
            Array.from({ length: 20 }, () => createDueRoutineAlerts(NOW)),
        );

        expect(results.reduce((sum, item) => sum + item.createdCount, 0)).toBe(1);
        expect(await Notification.countDocuments({ userId })).toBe(1);
        expect(await RoutineAlertPreference.findOne({ userId })).toMatchObject({
            lastNotificationKey: "2026-07-10",
        });
    });

    it("falha da notificação reverte o claim e permite retry", async () => {
        await seedDueRoutine("rollback");
        const createSpy = vi
            .spyOn(Notification, "create")
            .mockRejectedValueOnce(new Error("notification unavailable"));

        await expect(createDueRoutineAlerts(NOW)).rejects.toThrow(
            "notification unavailable",
        );
        expect(await Notification.countDocuments({ userId })).toBe(0);
        expect(await RoutineAlertPreference.findOne({ userId })).toMatchObject({
            lastNotificationKey: null,
        });

        createSpy.mockRestore();
        await expect(createDueRoutineAlerts(NOW)).resolves.toEqual({ createdCount: 1 });
        expect(await Notification.countDocuments({ userId })).toBe(1);
    });
});
