/**
 * Integração persistente das migrações OpenAI v2 (010-015).
 *
 * A suite usa exclusivamente um MongoDB replica set efémero e prova o
 * contrato completo do runner: registo/checksums, dry-run sem escrita,
 * aplicação ordenada, pós-validação e replay idempotente. A fixture mantém
 * produtos com e sem variantes para tornar explícita a invariante crítica de
 * que migrações de IA nunca apagam IDs nem alteram stock do catálogo.
 */
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";
import { MIGRATIONS } from "../src/migrations/index.js";
import {
    calculateMigrationChecksum,
    dryRunMigrations,
    getMigrationStatus,
    MIGRATION_COLLECTION,
    MIGRATION_LOCK_COLLECTION,
    runMigrations,
} from "../src/migrations/migration-runner.js";
import { captureCatalogInvariant } from "../src/migrations/catalog-invariant.js";

const DATABASE_NAME = "orelle_migrations_openai_v2_test";
const EXPECTED_VERSIONS = Object.freeze([
    "010_openai_only_and_consent_v2",
    "011_goal_consultation_and_ai_jobs",
    "012_product_ai_metadata_and_variants",
    "013_report_v2_and_recommendation_snapshots",
    "014_report_review_and_unlock_snapshot",
    "015_photo_quality_and_openai_simulation",
]);
const V2_MIGRATIONS = Object.freeze(
    MIGRATIONS.filter(({ version }) => EXPECTED_VERSIONS.includes(version)),
);
const FIXED_NOW = new Date("2026-07-11T12:00:00.000Z");

let replicaSet;
let client;
let db;

/** Recusa qualquer URI que não seja local, efémera e pertencente à suite. */
function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("Migrações 010-015 recusaram URI não efémera");
    }
}

/**
 * Captura documentos relevantes numa representação BSON estável.
 * É usada para provar que o dry-run não cria nem altera dados funcionais.
 */
async function captureFunctionalState() {
    const collectionNames = [
        "products",
        "faceanalyses",
        "facereports",
        "productrecommendations",
        "faceconsents",
        "aiconsultationsessions",
        "facephotos",
        "aiconsultationreviews",
        "reportunlocks",
        "makeupsimulations",
        "makeupsimulationquotas",
        "beforeaftervisualizations",
    ];
    const entries = await Promise.all(
        collectionNames.map(async (name) => [
            name,
            await db.collection(name).find({}).sort({ _id: 1 }).toArray(),
        ]),
    );
    return Object.fromEntries(entries);
}

/** Insere contratos legacy e v2 sem passar pelos schemas atuais. */
async function seedMigrationFixture() {
    const ids = {
        cleanser: new ObjectId(),
        foundation: new ObjectId(),
        customProduct: new ObjectId(),
        demoAnalysis: new ObjectId(),
        externalAnalysis: new ObjectId(),
        oldOpenAiAnalysis: new ObjectId(),
        currentOpenAiAnalysis: new ObjectId(),
        demoReport: new ObjectId(),
        externalReport: new ObjectId(),
        oldOpenAiReport: new ObjectId(),
        currentOpenAiReport: new ObjectId(),
        v1Consent: new ObjectId(),
        v2Consent: new ObjectId(),
        legacySession: new ObjectId(),
        currentSession: new ObjectId(),
        legacyPhoto: new ObjectId(),
        legacyReview: new ObjectId(),
        legacyUnlock: new ObjectId(),
        legacySimulation: new ObjectId(),
        currentSimulation: new ObjectId(),
    };
    const users = Array.from({ length: 12 }, () => new ObjectId());

    const originalFoundationVariants = [
        {
            variantId: "porcelain-neutral",
            label: "Porcelana neutro",
            colorHex: "#E8C3A8",
            undertone: "neutral",
            finish: "legacy",
            coverage: "legacy",
            imageUrl: null,
            priceCents: null,
            stock: 2,
        },
        {
            variantId: "light-warm",
            label: "Claro quente",
            colorHex: "#D9AD87",
            undertone: "warm",
            finish: "legacy",
            coverage: "legacy",
            imageUrl: null,
            priceCents: null,
            stock: 4,
        },
        {
            variantId: "medium-olive",
            label: "Médio oliva",
            colorHex: "#B9855E",
            undertone: "olive",
            finish: "legacy",
            coverage: "legacy",
            imageUrl: null,
            priceCents: null,
            stock: 5,
        },
        {
            variantId: "deep-neutral",
            label: "Profundo neutro",
            colorHex: "#754A35",
            undertone: "neutral",
            finish: "legacy",
            coverage: "legacy",
            imageUrl: null,
            priceCents: null,
            stock: 7,
        },
    ];
    const customVariants = [
        {
            variantId: "custom-one",
            label: "Única",
            colorHex: null,
            undertone: "universal",
            finish: null,
            coverage: null,
            imageUrl: null,
            priceCents: null,
            stock: 7,
        },
    ];

    await db.collection("products").insertMany([
        {
            _id: ids.cleanser,
            name: "Gel de Limpeza Suave",
            description: "Produto local curado.",
            priceCents: 1290,
            stock: 36,
            variants: [],
        },
        {
            _id: ids.foundation,
            name: "Base Liquida Mate",
            description: "Produto local curado com variantes.",
            priceCents: 2490,
            stock: 18,
            variants: originalFoundationVariants,
        },
        {
            _id: ids.customProduct,
            name: "Produto criado pelo administrador",
            description: "Não deve tornar-se elegível automaticamente.",
            priceCents: 990,
            stock: 7,
            variants: customVariants,
        },
    ]);

    await db.collection("faceanalyses").insertMany([
        {
            _id: ids.demoAnalysis,
            userId: users[0],
            mode: "demo",
            status: "completed",
        },
        {
            _id: ids.externalAnalysis,
            userId: users[1],
            mode: "external",
            status: "completed",
        },
        {
            _id: ids.oldOpenAiAnalysis,
            userId: users[2],
            mode: "openai",
            status: "completed",
            schemaVersion: 1,
        },
        {
            _id: ids.currentOpenAiAnalysis,
            userId: users[3],
            mode: "openai",
            status: "completed",
            schemaVersion: 2,
            inputFingerprint: "current-openai-analysis",
        },
    ]);

    await db.collection("facereports").insertMany([
        {
            _id: ids.demoReport,
            userId: users[0],
            analysisId: ids.demoAnalysis,
            analysisMode: "demo",
        },
        {
            _id: ids.externalReport,
            userId: users[1],
            analysisId: ids.externalAnalysis,
            analysisMode: "external",
        },
        {
            _id: ids.oldOpenAiReport,
            userId: users[2],
            analysisId: ids.oldOpenAiAnalysis,
            analysisMode: "openai",
            schemaVersion: 1,
        },
        {
            _id: ids.currentOpenAiReport,
            userId: users[3],
            analysisId: ids.currentOpenAiAnalysis,
            consultationSessionId: ids.currentSession,
            analysisMode: "openai",
            schemaVersion: 2,
            version: 1,
            lifecycleStatus: "draft",
        },
    ]);

    await db.collection("productrecommendations").insertMany([
        {
            _id: new ObjectId(),
            userId: users[0],
            analysisId: ids.demoAnalysis,
            reportId: ids.demoReport,
            productId: ids.cleanser,
            analysisMode: "demo",
            status: "accepted",
        },
        {
            _id: new ObjectId(),
            userId: users[1],
            analysisId: ids.externalAnalysis,
            reportId: ids.externalReport,
            productId: ids.foundation,
            analysisMode: "external",
            status: "dismissed",
        },
        {
            _id: new ObjectId(),
            userId: users[2],
            analysisId: ids.oldOpenAiAnalysis,
            reportId: ids.oldOpenAiReport,
            productId: ids.customProduct,
            analysisMode: "openai",
            status: "active",
            schemaVersion: 1,
        },
        {
            _id: new ObjectId(),
            userId: users[3],
            analysisId: ids.currentOpenAiAnalysis,
            reportId: ids.currentOpenAiReport,
            reportVersion: 1,
            productId: ids.foundation,
            variantId: "porcelain-neutral",
            analysisMode: "openai",
            status: "active",
            schemaVersion: 2,
        },
    ]);

    await db.collection("faceconsents").insertMany([
        {
            _id: ids.v1Consent,
            userId: users[4],
            version: "face-analysis-v1",
            grantedAt: new Date("2026-06-01T10:00:00.000Z"),
            revokedAt: null,
        },
        {
            _id: ids.v2Consent,
            userId: users[5],
            version: "face-analysis-v2",
            grantedAt: new Date("2026-07-11T10:00:00.000Z"),
            revokedAt: null,
        },
    ]);

    await db.collection("aiconsultationsessions").insertMany([
        {
            _id: ids.legacySession,
            userId: users[6],
            status: "draft",
            isOpen: true,
        },
        {
            _id: ids.currentSession,
            userId: users[3],
            status: "active",
            flowState: "asking_questions",
            isOpen: true,
            schemaVersion: 2,
        },
    ]);
    await db.collection("facephotos").insertOne({
        _id: ids.legacyPhoto,
        userId: users[6],
        kind: "frontal",
        status: "active",
    });
    await db.collection("aiconsultationreviews").insertOne({
        _id: ids.legacyReview,
        userId: users[6],
        consultationSessionId: ids.legacySession,
        status: "pending",
    });
    await db.collection("reportunlocks").insertOne({
        _id: ids.legacyUnlock,
        userId: users[2],
        reportId: ids.oldOpenAiReport,
        recommendationIds: [new ObjectId(), new ObjectId()],
        depositCents: 258,
        createdAt: new Date("2026-06-10T10:00:00.000Z"),
    });

    await db.collection("makeupsimulations").insertMany([
        {
            _id: ids.legacySimulation,
            userId: users[7],
            status: "completed",
            providerName: "legacy-conceptual",
            preview: { kind: "svg" },
        },
        {
            _id: ids.currentSimulation,
            userId: users[8],
            reportId: ids.currentOpenAiReport,
            status: "completed",
            schemaVersion: 2,
            provider: "openai",
            createdAt: new Date("2026-07-11T11:00:00.000Z"),
            generativeConsent: {
                noticeVersion: "generative-makeup-v1",
                acceptedAt: new Date("2026-07-11T11:00:00.000Z"),
                revokedAt: null,
            },
        },
    ]);
    await db.collection("beforeaftervisualizations").insertOne({
        _id: new ObjectId(),
        userId: users[9],
        beforePanel: "legacy-before",
        afterPanel: "legacy-after",
        visualComparison: "legacy-svg",
    });

    return {
        ids,
        originalFoundationVariants,
        customVariants,
    };
}

describe("migrations 010-015 OpenAI consultation v2", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralUri(uri);
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DATABASE_NAME);
    }, 120_000);

    afterEach(async () => {
        await db.dropDatabase();
    });

    afterAll(async () => {
        await client?.close();
        await replicaSet?.stop();
    }, 60_000);

    it("mantém o registry 010-015 ordenado e calcula checksums do source", async () => {
        expect(V2_MIGRATIONS.map(({ version }) => version)).toEqual(
            EXPECTED_VERSIONS,
        );
        expect(MIGRATIONS.slice(9, 15).map(({ version }) => version)).toEqual(
            EXPECTED_VERSIONS,
        );

        const status = await getMigrationStatus({
            db,
            migrations: V2_MIGRATIONS,
        });
        const directChecksums = await Promise.all(
            V2_MIGRATIONS.map(calculateMigrationChecksum),
        );

        expect(status.map(({ state }) => state)).toEqual(
            Array(EXPECTED_VERSIONS.length).fill("pending"),
        );
        expect(status.map(({ checksum }) => checksum)).toEqual(directChecksums);
        expect(directChecksums).toEqual(
            directChecksums.map(() => expect.stringMatching(/^[a-f0-9]{64}$/)),
        );
        expect(new Set(directChecksums)).toHaveLength(EXPECTED_VERSIONS.length);
    });

    it("executa dry-run 010-015 sem escrita e reporta o legado real", async () => {
        await seedMigrationFixture();
        const functionalBefore = await captureFunctionalState();
        const catalogBefore = await captureCatalogInvariant(db);

        const dryRun = await dryRunMigrations({
            db,
            migrations: V2_MIGRATIONS,
        });

        expect(dryRun.map(({ version }) => version)).toEqual(EXPECTED_VERSIONS);
        expect(dryRun.map(({ state }) => state)).toEqual(
            Array(EXPECTED_VERSIONS.length).fill("pending"),
        );
        expect(dryRun[0].analysis).toMatchObject({
            legacyAnalyses: 2,
            legacyReports: 2,
            legacyRecommendations: 2,
            activeV1Consents: 1,
        });
        expect(dryRun[1].analysis).toMatchObject({
            openLegacySessions: 1,
            photosWithoutQuality: 1,
            missingIndexes: 5,
        });
        expect(dryRun[2].analysis).toMatchObject({ pending: 3, catalog: catalogBefore });
        expect(dryRun[3].analysis).toMatchObject({
            legacyReports: 3,
            legacyRecommendations: 3,
            catalog: catalogBefore,
        });
        expect(dryRun[4].analysis).toMatchObject({
            legacyReviews: 1,
            legacyUnlocks: 1,
            catalog: catalogBefore,
        });
        expect(dryRun[5].analysis).toMatchObject({
            legacySimulations: 1,
            catalog: catalogBefore,
        });

        expect(await captureFunctionalState()).toEqual(functionalBefore);
        expect(await captureCatalogInvariant(db)).toEqual(catalogBefore);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(0);
        expect(await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments()).toBe(0);
    });

    it("aplica 010-015 sem promover legado/consentimento nem alterar catálogo", async () => {
        const fixture = await seedMigrationFixture();
        const catalogBefore = await captureCatalogInvariant(db);

        const applied = await runMigrations({
            client,
            db,
            migrations: V2_MIGRATIONS,
            now: FIXED_NOW,
            ownerId: "openai-v2-migration-test",
        });

        expect(applied.map(({ version }) => version)).toEqual(EXPECTED_VERSIONS);
        expect(applied.map(({ state }) => state)).toEqual(
            Array(EXPECTED_VERSIONS.length).fill("applied"),
        );
        expect(applied[0]).toMatchObject({
            changes: {
                analysesArchived: 3,
                reportsArchived: 2,
                recommendationsArchived: 2,
                consentsPromoted: 0,
            },
            validation: { runtimeLegacyModes: 0, consentV1Promoted: 0 },
        });
        expect(applied[1]).toMatchObject({
            changes: {
                legacySessionsArchived: 1,
                photosMarkedForReupload: 1,
                indexesCreated: 5,
            },
            validation: {
                openLegacySessions: 0,
                activeUnknownQuality: 0,
                missingIndexes: 0,
            },
        });
        for (const result of applied.slice(2)) {
            expect(result.changes.catalogPreserved).toBe(true);
            expect(result.validation.catalog).toEqual(catalogBefore);
        }
        expect(await captureCatalogInvariant(db)).toEqual(catalogBefore);

        const products = await db
            .collection("products")
            .find({})
            .sort({ _id: 1 })
            .toArray();
        expect(products.map(({ _id }) => _id.toString()).sort()).toEqual(
            [fixture.ids.cleanser, fixture.ids.foundation, fixture.ids.customProduct]
                .map((id) => id.toString())
                .sort(),
        );
        const cleanser = products.find(({ _id }) => _id.equals(fixture.ids.cleanser));
        const foundation = products.find(({ _id }) =>
            _id.equals(fixture.ids.foundation),
        );
        const customProduct = products.find(({ _id }) =>
            _id.equals(fixture.ids.customProduct),
        );
        expect(cleanser).toMatchObject({
            schemaVersion: 2,
            aiEligible: true,
            stock: 36,
            variants: [],
        });
        expect(foundation).toMatchObject({
            schemaVersion: 2,
            aiEligible: true,
            stock: 18,
        });
        expect(
            foundation.variants.map(({ variantId, stock }) => ({ variantId, stock })),
        ).toEqual(
            fixture.originalFoundationVariants.map(({ variantId, stock }) => ({
                variantId,
                stock,
            })),
        );
        expect(
            foundation.variants.reduce((sum, variant) => sum + variant.stock, 0),
        ).toBe(foundation.stock);
        expect(customProduct).toMatchObject({
            schemaVersion: 2,
            aiEligible: false,
            stock: 7,
            variants: fixture.customVariants,
        });

        const analyses = await db.collection("faceanalyses").find({}).toArray();
        expect(
            analyses.find(({ _id }) => _id.equals(fixture.ids.demoAnalysis)),
        ).toMatchObject({
            mode: "legacy_demo",
            status: "legacy_archived",
            schemaVersion: 1,
        });
        expect(
            analyses.find(({ _id }) => _id.equals(fixture.ids.externalAnalysis)),
        ).toMatchObject({
            mode: "legacy_external",
            status: "legacy_archived",
            schemaVersion: 1,
        });
        expect(
            analyses.find(({ _id }) => _id.equals(fixture.ids.oldOpenAiAnalysis)),
        ).toMatchObject({
            mode: "openai",
            status: "legacy_archived",
            schemaVersion: 1,
        });
        expect(
            analyses.find(({ _id }) => _id.equals(fixture.ids.currentOpenAiAnalysis)),
        ).toMatchObject({
            mode: "openai",
            status: "completed",
            schemaVersion: 2,
        });
        expect(analyses.some(({ mode }) => ["demo", "local", "external"].includes(mode))).toBe(false);

        const [v1Consent, v2Consent] = await Promise.all([
            db.collection("faceconsents").findOne({ _id: fixture.ids.v1Consent }),
            db.collection("faceconsents").findOne({ _id: fixture.ids.v2Consent }),
        ]);
        expect(v1Consent).toMatchObject({
            version: "face-analysis-v1",
            revokedAt: null,
        });
        expect(v1Consent).not.toHaveProperty("promotedAt");
        expect(v2Consent).toMatchObject({
            version: "face-analysis-v2",
            revokedAt: null,
        });

        expect(
            await db
                .collection("aiconsultationsessions")
                .findOne({ _id: fixture.ids.legacySession }),
        ).toMatchObject({
            schemaVersion: 1,
            status: "legacy_archived",
            flowState: "legacy_archived",
            isOpen: false,
        });
        expect(
            await db.collection("facephotos").findOne({ _id: fixture.ids.legacyPhoto }),
        ).toMatchObject({
            status: "active",
            quality: {
                profileVersion: "legacy-unmeasured",
                status: "fail",
                failures: ["legacy_quality_unknown"],
            },
        });

        const reports = await db.collection("facereports").find({}).toArray();
        expect(
            reports.find(({ _id }) => _id.equals(fixture.ids.demoReport)),
        ).toMatchObject({
            schemaVersion: 1,
            analysisMode: "legacy_demo",
            lifecycleStatus: "archived_legacy",
        });
        expect(
            reports.find(({ _id }) => _id.equals(fixture.ids.externalReport)),
        ).toMatchObject({
            schemaVersion: 1,
            analysisMode: "legacy_external",
            lifecycleStatus: "archived_legacy",
        });
        expect(
            reports.find(({ _id }) => _id.equals(fixture.ids.oldOpenAiReport)),
        ).toMatchObject({
            schemaVersion: 1,
            analysisMode: "openai",
            lifecycleStatus: "archived_legacy",
        });
        expect(
            reports.find(({ _id }) => _id.equals(fixture.ids.currentOpenAiReport)),
        ).toMatchObject({
            schemaVersion: 2,
            analysisMode: "openai",
            lifecycleStatus: "draft",
        });

        const recommendations = await db
            .collection("productrecommendations")
            .find({})
            .toArray();
        expect(recommendations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    schemaVersion: 1,
                    analysisMode: "legacy_demo",
                }),
                expect.objectContaining({
                    schemaVersion: 1,
                    analysisMode: "legacy_external",
                }),
                expect.objectContaining({
                    schemaVersion: 1,
                    analysisMode: "openai",
                }),
                expect.objectContaining({
                    schemaVersion: 2,
                    analysisMode: "openai",
                    variantId: "porcelain-neutral",
                }),
            ]),
        );

        expect(
            await db
                .collection("aiconsultationreviews")
                .findOne({ _id: fixture.ids.legacyReview }),
        ).toMatchObject({ schemaVersion: 1, reportVersion: 1, status: "pending" });
        expect(
            await db
                .collection("reportunlocks")
                .findOne({ _id: fixture.ids.legacyUnlock }),
        ).toMatchObject({
            schemaVersion: 1,
            reportVersion: 1,
            availableRecommendationCount: 2,
            recommendationSnapshots: [],
            depositCents: 258,
            frozenAt: new Date("2026-06-10T10:00:00.000Z"),
        });

        const [legacySimulation, currentSimulation] = await Promise.all([
            db
                .collection("makeupsimulations")
                .findOne({ _id: fixture.ids.legacySimulation }),
            db
                .collection("makeupsimulations")
                .findOne({ _id: fixture.ids.currentSimulation }),
        ]);
        expect(legacySimulation).toMatchObject({
            schemaVersion: 1,
            status: "cancelled",
            safeErrorCode: "LEGACY_PREVIEW_ARCHIVED",
        });
        expect(legacySimulation).not.toHaveProperty("preview");
        expect(legacySimulation).not.toHaveProperty("providerName");
        expect(currentSimulation).toMatchObject({
            schemaVersion: 2,
            status: "completed",
            provider: "openai",
            activeGenerationKey: `makeup:${currentSimulation.userId.toString()}:${fixture.ids.currentOpenAiReport.toString()}`,
            promptVersion: "legacy-unversioned",
            responseSchemaVersion: "legacy-unversioned",
        });
        expect(
            await db
                .collection("makeupsimulationquotas")
                .findOne({ userId: currentSimulation.userId }),
        ).toMatchObject({
            reservations: [
                {
                    simulationId: fixture.ids.currentSimulation,
                    createdAt: new Date("2026-07-11T11:00:00.000Z"),
                },
            ],
        });
        expect(
            await db.collection("beforeaftervisualizations").findOne({}),
        ).not.toEqual(
            expect.objectContaining({
                beforePanel: expect.anything(),
                afterPanel: expect.anything(),
                visualComparison: expect.anything(),
            }),
        );

        const migrationRecords = await db
            .collection(MIGRATION_COLLECTION)
            .find({})
            .sort({ version: 1 })
            .toArray();
        expect(migrationRecords.map(({ version }) => version)).toEqual(
            EXPECTED_VERSIONS,
        );
        expect(migrationRecords).toEqual(
            migrationRecords.map((record) =>
                expect.objectContaining({
                    version: record.version,
                    checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
                    appliedAt: FIXED_NOW,
                    durationMs: expect.any(Number),
                }),
            ),
        );
        expect(await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments()).toBe(0);

        const indexNames = async (collection) =>
            (await db.collection(collection).listIndexes().toArray()).map(
                ({ name }) => name,
            );
        await expect(indexNames("aijobs")).resolves.toEqual(
            expect.arrayContaining([
                "deduplicationKey_1",
                "status_1_availableAt_1_lease.expiresAt_1_type_1",
                "ttl_terminal_ai_jobs_30d",
            ]),
        );
        await expect(indexNames("facereports")).resolves.toEqual(
            expect.arrayContaining([
                "uniq_legacy_report_per_analysis",
                "uniq_consultation_report_version",
            ]),
        );
        await expect(indexNames("aiconsultationreviews")).resolves.toEqual(
            expect.arrayContaining([
                "uniq_legacy_consultation_review",
                "uniq_report_review",
            ]),
        );
        await expect(indexNames("makeupsimulations")).resolves.toEqual(
            expect.arrayContaining([
                "userId_1_reportId_1_createdAt_-1",
                "status_1_expiresAt_1",
                "uniq_active_makeup_generation",
            ]),
        );
        await expect(indexNames("makeupsimulationquotas")).resolves.toEqual(
            expect.arrayContaining(["userId_1"]),
        );
    }, 60_000);

    it("faz replay idempotente e mantém checksums/estado aplicado", async () => {
        await seedMigrationFixture();
        await runMigrations({
            client,
            db,
            migrations: V2_MIGRATIONS,
            now: FIXED_NOW,
            ownerId: "openai-v2-first-run",
        });
        const functionalBeforeReplay = await captureFunctionalState();
        const catalogBeforeReplay = await captureCatalogInvariant(db);

        const replay = await runMigrations({
            client,
            db,
            migrations: V2_MIGRATIONS,
            ownerId: "openai-v2-replay",
        });
        const status = await getMigrationStatus({
            db,
            migrations: V2_MIGRATIONS,
        });

        expect(replay).toEqual(
            EXPECTED_VERSIONS.map((version) => ({ version, state: "skipped" })),
        );
        expect(status.map(({ state }) => state)).toEqual(
            Array(EXPECTED_VERSIONS.length).fill("applied"),
        );
        expect(status.map(({ checksum }) => checksum)).toEqual(
            await Promise.all(V2_MIGRATIONS.map(calculateMigrationChecksum)),
        );
        expect(await captureFunctionalState()).toEqual(functionalBeforeReplay);
        expect(await captureCatalogInvariant(db)).toEqual(catalogBeforeReplay);
        expect(await db.collection(MIGRATION_COLLECTION).countDocuments()).toBe(
            EXPECTED_VERSIONS.length,
        );
        expect(await db.collection(MIGRATION_LOCK_COLLECTION).countDocuments()).toBe(0);
    }, 60_000);
});
