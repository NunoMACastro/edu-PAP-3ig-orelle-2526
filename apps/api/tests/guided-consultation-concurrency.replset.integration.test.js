/**
 * Concorrência real do fluxo OpenAI v2 em MongoDB replica set efémero.
 *
 * As operações apenas enfileiram jobs; nenhum pedido de rede é feito aqui.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    buildDeterministicQuestionPlan,
    PROFILE_RESTRICTIONS_CONFIRMATION,
} from "../src/constants/ai-consultation-goals.js";
import {
    AI_CONSULTATION_FLOW_STATES,
    AiConsultationSession,
} from "../src/models/ai-consultation-session.model.js";
import { AiJob, AI_JOB_TYPES } from "../src/models/ai-job.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { Profile } from "../src/models/profile.model.js";
import {
    answerAiConsultationQuestion,
    beginAiConsultationAnalysis,
    createAiConsultationSession,
    listAiConsultationSessions,
    submitAiConsultationSession,
} from "../src/services/ai-consultation.service.js";

const DATABASE_NAME = "orelle_consultation_v2_concurrency_test";
const TEST_KEY = "test-openai-key-not-a-real-credential";
let replicaSet;
let originalOpenAiKey;

/** Constrói dez respostas canónicas suficientes para submeter a consulta. */
function completedFacts(primaryGoal) {
    return Object.fromEntries(
        buildDeterministicQuestionPlan(primaryGoal)
            .slice(0, 10)
            .map(({ code }, index) => [
                code,
                code === "allergies_restrictions"
                    ? PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED
                    : `fixture_${index}`,
            ]),
    );
}

/** Garante que nenhum teste pode apontar para uma base remota. */
function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("URI externa recusada no teste concorrente v2");
    }
}

/** Cria consentimento v2 e o par técnico de fotografias sem guardar bytes reais. */
async function createConsentAndPhotos(userId) {
    const acceptedAt = new Date();
    const consent = await FaceConsent.create({
        userId,
        acceptedAt,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: env.openAiNoticeVersion,
            acceptedAt,
            revokedAt: null,
        },
    });
    await FacePhoto.insertMany(
        ["frontal", "perfil"].map((kind) => ({
            userId,
            kind,
            storageKey: `private/test/${userId}-${kind}.webp.enc`,
            encryption: {
                algorithm: "aes-256-gcm",
                keyVersion: 2,
                aadHash: "test-aad-hash",
                iv: "test-iv",
                authTag: "test-auth-tag",
            },
            originalName: `${kind}.webp`,
            mimeType: "image/webp",
            sizeBytes: 1024,
            quality: {
                profileVersion: "face-photo-quality-v1",
                status: "pass",
                failures: [],
                warnings: [],
                metrics: {
                    lumaMean: 128,
                    darkClippedRatio: 0.01,
                    lightClippedRatio: 0.01,
                    blurVariance: 500,
                },
            },
            consentId: consent._id,
            status: "active",
        })),
    );
}

/** Cria a sessão v2 através do mesmo service usado pelo HTTP. */
async function createSessionFixture() {
    const userId = new mongoose.Types.ObjectId();
    await createConsentAndPhotos(userId);
    await Profile.create({
        userId,
        nome: "Cliente de teste",
        idade: 30,
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivos: ["equilibrar"],
    });
    await createAiConsultationSession(userId.toString(), {
        primaryGoal: "acne_imperfections",
        secondaryGoals: [],
    });
    return {
        userId,
        session: await AiConsultationSession.findOne({ userId, isOpen: true }),
    };
}

beforeAll(async () => {
    originalOpenAiKey = env.openAiApiKey;
    env.openAiApiKey = TEST_KEY;
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    assertEphemeralUri(uri);
    await mongoose.connect(uri);
    await Promise.all([
        AiConsultationSession.syncIndexes(),
        AiJob.syncIndexes(),
        FaceAnalysis.syncIndexes(),
        FaceConsent.syncIndexes(),
        FacePhoto.syncIndexes(),
        Profile.syncIndexes(),
    ]);
}, 120_000);

afterEach(async () => {
    await Promise.all([
        AiConsultationSession.deleteMany({}),
        AiJob.deleteMany({}),
        FaceAnalysis.deleteMany({}),
        FaceConsent.deleteMany({}),
        FacePhoto.deleteMany({}),
        Profile.deleteMany({}),
    ]);
});

afterAll(async () => {
    env.openAiApiKey = originalOpenAiKey;
    await mongoose.disconnect();
    await replicaSet?.stop();
}, 60_000);

describe("consulta OpenAI v2 concorrente", () => {
    it("mantém uma sessão aberta e um job de análise sob 25 duplos cliques", async () => {
        const userId = new mongoose.Types.ObjectId();
        await createConsentAndPhotos(userId);
        const creations = await Promise.allSettled(
            Array.from({ length: 25 }, () =>
                createAiConsultationSession(userId.toString(), {
                    primaryGoal: "hydration_barrier",
                    secondaryGoals: ["sun_protection"],
                }),
            ),
        );

        expect(creations.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
        expect(
            creations
                .filter(({ status }) => status === "rejected")
                .every(({ reason }) => reason.statusCode === 409),
        ).toBe(true);
        const session = await AiConsultationSession.findOne({ userId, isOpen: true });
        expect(session).not.toBeNull();

        const starts = await Promise.all(
            Array.from({ length: 25 }, () =>
                beginAiConsultationAnalysis(
                    userId.toString(),
                    session._id.toString(),
                ),
            ),
        );
        expect(new Set(starts.map(({ operation }) => operation.id)).size).toBe(1);
        expect(
            await AiJob.countDocuments({
                userId,
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.ANALYZE_PHOTOS,
            }),
        ).toBe(1);
        const stored = await AiConsultationSession.findById(session._id);
        expect(stored.logicalOperations).toBe(1);
        expect(stored.flowState).toBe(AI_CONSULTATION_FLOW_STATES.ANALYZING);
    });

    it("aceita uma única resposta concorrente e preserva um único facto/job", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 3;
        session.conversation = {
            turns: [],
            currentQuestion: {
                id: "3:budget_cents",
                revision: 3,
                slotCode: "budget_cents",
                type: "number",
                label: "Orçamento",
                min: 0,
                max: 100_000,
                options: [],
                source: "openai",
            },
            missingSlotCodes: [],
        };
        await session.save();

        const outcomes = await Promise.allSettled(
            Array.from({ length: 25 }, () =>
                answerAiConsultationQuestion(
                    userId.toString(),
                    session._id.toString(),
                    { questionId: "3:budget_cents", revision: 3, value: 2500 },
                ),
            ),
        );
        expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
        expect(
            outcomes
                .filter(({ status }) => status === "rejected")
                .every(({ reason }) => reason.statusCode === 409),
        ).toBe(true);
        const stored = await AiConsultationSession.findById(session._id);
        expect(stored.facts).toEqual({ budget_cents: 2500 });
        expect(
            stored.conversation.turns.filter(({ kind }) => kind === "answer"),
        ).toHaveLength(1);
        expect(
            await AiJob.countDocuments({
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
            }),
        ).toBe(0);
        expect(stored.conversation.currentQuestion).toMatchObject({
            source: "deterministic_plan",
        });
    });

    it("reutiliza um único job de relatório sob 25 submissões", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT;
        session.revision = 8;
        session.facts = completedFacts("acne_imperfections");
        session.conversation = {
            currentQuestion: null,
            missingSlotCodes: [],
            turns: Array.from({ length: 10 }, (_, index) => ({
                kind: "answer",
                questionId: `${index}:slot_${index}`,
                slotCode: `slot_${index}`,
                value: `value_${index}`,
                at: new Date(),
            })),
        };
        await session.save();

        const submissions = await Promise.all(
            Array.from({ length: 25 }, () =>
                submitAiConsultationSession(
                    userId.toString(),
                    session._id.toString(),
                ),
            ),
        );
        expect(new Set(submissions.map(({ operation }) => operation.id)).size).toBe(1);
        expect(
            await AiJob.countDocuments({
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.GENERATE_REPORT,
            }),
        ).toBe(1);
        expect((await AiConsultationSession.findById(session._id)).flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
        );
    });

    it("lista apenas metadata própria e não inclui transcript ou fotografias", async () => {
        const { userId, session } = await createSessionFixture();
        const other = await createSessionFixture();

        const history = await listAiConsultationSessions(userId.toString(), {
            limit: 10,
        });
        expect(history.items).toHaveLength(1);
        expect(history.items[0]).toMatchObject({
            id: session._id.toString(),
            goals: {
                primaryGoal: "acne_imperfections",
                secondaryGoals: [],
            },
        });
        expect(history.items[0].id).not.toBe(other.session._id.toString());
        expect(history.items[0]).not.toHaveProperty("conversation");
        expect(history.items[0]).not.toHaveProperty("answers");
        expect(history.items[0]).not.toHaveProperty("photoIds");
        expect(history.items[0]).not.toHaveProperty("userId");
    });
});
