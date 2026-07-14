/** Prova unitária da classificação legacy da migração 010. */
import { describe, expect, it } from "vitest";
import { migration010OpenAiOnlyAndConsentV2 } from "../src/migrations/010_openai_only_and_consent_v2.js";

function matches(document, filter) {
    return Object.entries(filter).every(([field, expected]) => {
        const value = document[field];
        if (expected && typeof expected === "object" && "$in" in expected) {
            return expected.$in.includes(value);
        }
        if (expected && typeof expected === "object" && "$ne" in expected) {
            return value !== expected.$ne;
        }
        return value === expected;
    });
}

function collection(documents) {
    return {
        async countDocuments(filter) {
            return documents.filter((document) => matches(document, filter)).length;
        },
        async updateMany(filter, update) {
            let modifiedCount = 0;
            for (const document of documents) {
                if (!matches(document, filter)) continue;
                Object.assign(document, update.$set);
                modifiedCount += 1;
            }
            return { modifiedCount };
        },
    };
}

describe("migration 010 OpenAI-only", () => {
    it("mapeia recommendations demo/external sem as converter em OpenAI", async () => {
        const data = {
            faceanalyses: [
                { mode: "demo", status: "completed" },
                { mode: "external", status: "completed" },
            ],
            facereports: [
                { analysisMode: "demo" },
                { analysisMode: "external" },
            ],
            productrecommendations: [
                { analysisMode: "demo", status: "accepted" },
                { analysisMode: "external", status: "dismissed" },
            ],
            faceconsents: [{ version: "face-analysis-v1", revokedAt: null }],
        };
        const db = { collection: (name) => collection(data[name]) };
        const changes = await migration010OpenAiOnlyAndConsentV2.up({
            db,
            session: {},
            now: new Date("2026-07-11T10:00:00.000Z"),
        });
        const validation = await migration010OpenAiOnlyAndConsentV2.validate({ db });

        expect(changes.recommendationsArchived).toBe(2);
        expect(data.productrecommendations).toEqual([
            expect.objectContaining({
                analysisMode: "legacy_demo",
                schemaVersion: 1,
            }),
            expect.objectContaining({
                analysisMode: "legacy_external",
                schemaVersion: 1,
            }),
        ]);
        expect(data.productrecommendations.some((item) => item.analysisMode === "openai")).toBe(false);
        expect(data.facereports.every((report) => report.lifecycleStatus === "archived_legacy")).toBe(true);
        expect(validation.runtimeLegacyModes).toBe(0);
        expect(changes.consentsPromoted).toBe(0);
    });
});
