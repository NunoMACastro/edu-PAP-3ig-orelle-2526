/**
 * Prova concorrente do compare-and-set de revogação de consentimento facial.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { revokeFaceConsentForUser } from "../src/services/face-photo.service.js";

const DATABASE_NAME = "orelle_face_consent_test";
let replicaSet;

describe("consentimento facial concorrente em replica set", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de consentimento não é loopback efémera");
        }

        await mongoose.connect(uri);
        await FaceConsent.syncIndexes();
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("25 revogações preservam um único instante geral e específico", async () => {
        const userId = new mongoose.Types.ObjectId();
        await FaceConsent.create({
            userId,
            acceptedAt: new Date("2026-07-10T08:00:00.000Z"),
            version: "face-analysis-v1",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: "notice-v3",
                acceptedAt: new Date("2026-07-10T08:00:00.000Z"),
                revokedAt: null,
            },
        });

        const results = await Promise.all(
            Array.from({ length: 25 }, () =>
                revokeFaceConsentForUser(userId.toString()),
            ),
        );
        const revokedAtValues = new Set(
            results.map((result) => result.revokedAt.toISOString()),
        );

        expect(revokedAtValues.size).toBe(1);
        expect(
            new Set(
                results.map((result) =>
                    result.externalProviderConsent.revokedAt.toISOString(),
                ),
            ).size,
        ).toBe(1);

        const stored = await FaceConsent.findOne({ userId }).lean();
        expect(stored.revokedAt.toISOString()).toBe([...revokedAtValues][0]);
        expect(stored.externalProviderConsent.revokedAt.toISOString()).toBe(
            stored.revokedAt.toISOString(),
        );

        const replay = await revokeFaceConsentForUser(userId.toString());
        expect(replay.revokedAt.toISOString()).toBe([...revokedAtValues][0]);
    });

    it("revogar outro titular inexistente não altera o consentimento existente", async () => {
        const existing = await FaceConsent.findOne({}).lean();
        const result = await revokeFaceConsentForUser(
            new mongoose.Types.ObjectId().toString(),
        );
        const after = await FaceConsent.findById(existing._id).lean();

        expect(result).toBeNull();
        expect(after.revokedAt.toISOString()).toBe(
            existing.revokedAt.toISOString(),
        );
    });
});
