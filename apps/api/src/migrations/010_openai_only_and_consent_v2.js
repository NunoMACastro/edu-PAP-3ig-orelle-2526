/**
 * Migração 010: fecha modos de IA legacy sem os converter em OpenAI v2.
 *
 * Consentimentos v1 permanecem intactos e, portanto, não autorizam o novo
 * runtime. Resultados antigos continuam preservados para auditoria, mas ficam
 * inequivocamente arquivados e não podem ser apresentados como análise atual.
 */
const ANALYSES = "faceanalyses";
const REPORTS = "facereports";
const RECOMMENDATIONS = "productrecommendations";
const CONSENTS = "faceconsents";

async function countLegacyModes(db, collection, field, session = undefined) {
    return db.collection(collection).countDocuments(
        {
            [field]: { $in: ["demo", "local", "external"] },
        },
        session ? { session } : {},
    );
}

export const migration010OpenAiOnlyAndConsentV2 = Object.freeze({
    version: "010_openai_only_and_consent_v2",
    description: "Arquiva contratos IA demo/external e exige consentimento v2 novo",

    async analyze(db) {
        return {
            legacyAnalyses: await countLegacyModes(db, ANALYSES, "mode"),
            legacyReports: await countLegacyModes(db, REPORTS, "analysisMode"),
            legacyRecommendations: await countLegacyModes(
                db,
                RECOMMENDATIONS,
                "analysisMode",
            ),
            activeV1Consents: await db.collection(CONSENTS).countDocuments({
                version: { $ne: "face-analysis-v2" },
                revokedAt: null,
            }),
        };
    },

    async up({ db, session, now }) {
        const options = { session };
        const demoAnalyses = await db.collection(ANALYSES).updateMany(
            { mode: { $in: ["demo", "local"] } },
            {
                $set: {
                    mode: "legacy_demo",
                    status: "legacy_archived",
                    schemaVersion: 1,
                    legacyArchivedAt: now,
                },
            },
            options,
        );
        const externalAnalyses = await db.collection(ANALYSES).updateMany(
            { mode: "external" },
            {
                $set: {
                    mode: "legacy_external",
                    status: "legacy_archived",
                    schemaVersion: 1,
                    legacyArchivedAt: now,
                },
            },
            options,
        );
        // OpenAI anterior era real, mas não cumpre consent/schema/provenance v2.
        const oldOpenAiAnalyses = await db.collection(ANALYSES).updateMany(
            { mode: "openai", schemaVersion: { $ne: 2 } },
            {
                $set: {
                    status: "legacy_archived",
                    schemaVersion: 1,
                    legacyArchivedAt: now,
                },
            },
            options,
        );

        const reportDemo = await db.collection(REPORTS).updateMany(
            { analysisMode: { $in: ["demo", "local"] } },
            {
                $set: {
                    analysisMode: "legacy_demo",
                    schemaVersion: 1,
                    lifecycleStatus: "archived_legacy",
                    legacyArchivedAt: now,
                },
            },
            options,
        );
        const reportExternal = await db.collection(REPORTS).updateMany(
            { analysisMode: "external" },
            {
                $set: {
                    analysisMode: "legacy_external",
                    schemaVersion: 1,
                    lifecycleStatus: "archived_legacy",
                    legacyArchivedAt: now,
                },
            },
            options,
        );
        const recommendationDemo = await db.collection(RECOMMENDATIONS).updateMany(
            { analysisMode: { $in: ["demo", "local"] } },
            {
                $set: {
                    analysisMode: "legacy_demo",
                    schemaVersion: 1,
                    status: "active",
                    legacyArchivedAt: now,
                },
            },
            options,
        );
        const recommendationExternal = await db.collection(RECOMMENDATIONS).updateMany(
            { analysisMode: "external" },
            {
                $set: {
                    analysisMode: "legacy_external",
                    schemaVersion: 1,
                    status: "active",
                    legacyArchivedAt: now,
                },
            },
            options,
        );

        return {
            analysesArchived:
                demoAnalyses.modifiedCount +
                externalAnalyses.modifiedCount +
                oldOpenAiAnalyses.modifiedCount,
            reportsArchived:
                reportDemo.modifiedCount + reportExternal.modifiedCount,
            recommendationsArchived:
                recommendationDemo.modifiedCount +
                recommendationExternal.modifiedCount,
            consentsPromoted: 0,
        };
    },

    async validate({ db, session = undefined }) {
        const [analysisModes, reportModes, recommendationModes] = await Promise.all([
            countLegacyModes(db, ANALYSES, "mode", session),
            countLegacyModes(db, REPORTS, "analysisMode", session),
            countLegacyModes(db, RECOMMENDATIONS, "analysisMode", session),
        ]);
        if (analysisModes || reportModes || recommendationModes) {
            throw new Error("Migração 010 deixou modos IA legacy executáveis");
        }
        return {
            runtimeLegacyModes: 0,
            consentV1Promoted: 0,
        };
    },
});
