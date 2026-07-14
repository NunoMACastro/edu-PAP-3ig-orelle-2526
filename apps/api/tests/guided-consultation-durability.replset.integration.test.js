/**
 * Atomicidade do enfileiramento da consulta OpenAI v2.
 *
 * Cada falha é injetada depois de criar o job e antes de atualizar a sessão;
 * o replica set deve reverter ambos os documentos e permitir um retry limpo.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
    editAiConsultationAnswer,
    getAiConsultationSession,
    handleAnalyzePhotosJob,
    handleSelectNextQuestionJob,
    submitAiConsultationSession,
} from "../src/services/ai-consultation.service.js";
import { buildFaceAnalysisInputFingerprint } from "../src/services/face-analysis.service.js";

const DATABASE_NAME = "orelle_consultation_v2_durability_test";
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

/** Cria consentimento e par fotográfico técnico para o titular de teste. */
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

    return consent;
}

/** Cria um novo par ativo depois de retirar o par anterior do fluxo. */
async function replaceActivePhotos(userId, consentId, label) {
    await FacePhoto.updateMany(
        { userId, status: "active" },
        { $set: { status: "deleted" } },
    );
    return FacePhoto.insertMany(
        ["frontal", "perfil"].map((kind) => ({
            userId,
            kind,
            storageKey: `private/test/${userId}-${label}-${kind}.webp.enc`,
            encryption: {
                algorithm: "aes-256-gcm",
                keyVersion: 2,
                aadHash: `test-aad-${label}`,
                iv: "test-iv",
                authTag: "test-auth-tag",
            },
            originalName: `${label}-${kind}.webp`,
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
            consentId,
            status: "active",
        })),
    );
}

/** Persiste um resultado OpenAI técnico para conduzir o handler sem rede. */
async function createAnalysisResult({
    userId,
    consentId,
    sessionId,
    photoIds,
    photoQualityStatus,
}) {
    return FaceAnalysis.create({
        schemaVersion: 2,
        userId,
        photoIds,
        consentId,
        consultationSessionId: sessionId,
        inputFingerprint: buildFaceAnalysisInputFingerprint({
            consultationSessionId: sessionId,
            consentId,
            photoIds,
            objectives: ["hydration_barrier"],
        }),
        providerName: "openai-responses",
        providerVersion: "gpt-test",
        mode: "openai",
        isDemo: false,
        findings:
            photoQualityStatus === "inconclusive"
                ? null
                : { skinType: { label: "mista" } },
        photoQuality: {
            status: photoQualityStatus,
            warnings:
                photoQualityStatus === "warning"
                    ? ["Luz desigual detetada pela análise OpenAI."]
                    : [],
            observations: ["Qualidade fotográfica avaliada sem diagnóstico."],
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Consulta cosmética não médica."],
        safetyFlags: [],
        provenance: {
            requestedModel: "gpt-test",
            effectiveModel: "gpt-test",
            requestId: `req-${photoQualityStatus}`,
            promptVersion: "analysis-test-v2",
            schemaVersion: "analysis-schema-test-v2",
        },
        status:
            photoQualityStatus === "inconclusive"
                ? "inconclusive"
                : "completed",
    });
}

/** Cria uma sessão canónica pronta para ser configurada pelo cenário. */
async function createSessionFixture() {
    const userId = new mongoose.Types.ObjectId();
    await createConsentAndPhotos(userId);
    await Profile.create({
        userId,
        nome: "Cliente de teste",
        idade: 30,
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivos: ["hidratar"],
    });
    await createAiConsultationSession(userId.toString(), {
        primaryGoal: "hydration_barrier",
        secondaryGoals: [],
    });
    return {
        userId,
        session: await AiConsultationSession.findOne({ userId, isOpen: true }),
    };
}

beforeAll(async () => {
    originalOpenAiKey = env.openAiApiKey;
    env.openAiApiKey = "test-openai-key-not-a-real-credential";
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
        throw new Error("URI de durabilidade v2 não é loopback efémera");
    }
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
    vi.restoreAllMocks();
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

describe("durabilidade da consulta OpenAI v2", () => {
    it("reverte job de análise se a transição da sessão falhar e permite retry", async () => {
        const { userId, session } = await createSessionFixture();
        const updateSpy = vi
            .spyOn(AiConsultationSession, "updateOne")
            .mockRejectedValueOnce(new Error("session update unavailable"));

        await expect(
            beginAiConsultationAnalysis(userId.toString(), session._id.toString()),
        ).rejects.toThrow("session update unavailable");
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(0);
        expect((await AiConsultationSession.findById(session._id)).flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
        );

        updateSpy.mockRestore();
        const retried = await beginAiConsultationAnalysis(
            userId.toString(),
            session._id.toString(),
        );
        expect(retried.operation.type).toBe(AI_JOB_TYPES.ANALYZE_PHOTOS);
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(1);
    });

    it("reverte o facto e a pergunta seguinte se o CAS da resposta falhar", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 2;
        session.conversation = {
            turns: [],
            currentQuestion: {
                id: "2:budget_cents",
                revision: 2,
                slotCode: "budget_cents",
                type: "number",
                label: "Orçamento",
                options: [],
                min: 0,
                max: 100_000,
                source: "openai",
            },
            missingSlotCodes: [],
        };
        await session.save();
        const updateSpy = vi
            .spyOn(AiConsultationSession, "updateOne")
            .mockRejectedValueOnce(new Error("answer CAS unavailable"));

        const input = { questionId: "2:budget_cents", revision: 2, value: 3000 };
        await expect(
            answerAiConsultationQuestion(
                userId.toString(),
                session._id.toString(),
                input,
            ),
        ).rejects.toThrow("answer CAS unavailable");
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(0);
        const rolledBack = await AiConsultationSession.findById(session._id);
        expect(rolledBack.facts).toEqual({});
        expect(rolledBack.conversation.currentQuestion.id).toBe(input.questionId);

        updateSpy.mockRestore();
        const retried = await answerAiConsultationQuestion(
            userId.toString(),
            session._id.toString(),
            input,
        );
        expect(retried.conversation.answeredCount).toBe(1);
        expect(retried.conversation.currentQuestion).toMatchObject({
            source: "deterministic_plan",
        });
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(0);
    });

    it("reverte job de relatório quando a submissão falha e permite retry", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT;
        session.revision = 7;
        session.facts = completedFacts("hydration_barrier");
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
        const updateSpy = vi
            .spyOn(AiConsultationSession, "updateOne")
            .mockRejectedValueOnce(new Error("submit CAS unavailable"));

        await expect(
            submitAiConsultationSession(userId.toString(), session._id.toString()),
        ).rejects.toThrow("submit CAS unavailable");
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(0);
        expect((await AiConsultationSession.findById(session._id)).flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT,
        );

        updateSpy.mockRestore();
        const retried = await submitAiConsultationSession(
            userId.toString(),
            session._id.toString(),
        );
        expect(retried.operation.type).toBe(AI_JOB_TYPES.GENERATE_REPORT);
        expect(await AiJob.countDocuments({ consultationSessionId: session._id })).toBe(1);
        expect(
            (
                await AiJob.findOne({
                    consultationSessionId: session._id,
                    type: AI_JOB_TYPES.GENERATE_REPORT,
                })
            ).maxAttempts,
        ).toBe(1);
    });

    it("bloqueia divergências do perfil antes de criar o job de relatório", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT;
        session.revision = 8;
        session.facts = {
            ...completedFacts("hydration_barrier"),
            allergies_restrictions:
                PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE,
        };
        session.conversation = {
            currentQuestion: null,
            missingSlotCodes: [],
            turns: [],
        };
        await session.save();

        await expect(
            submitAiConsultationSession(
                userId.toString(),
                session._id.toString(),
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: { code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED" },
        });
        expect(
            await AiJob.countDocuments({ consultationSessionId: session._id }),
        ).toBe(0);
        expect(
            (await AiConsultationSession.findById(session._id)).flowState,
        ).toBe(AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT);
    });

    it("permite corrigir uma confirmação legacy depois de uma falha terminal", async () => {
        const { userId, session } = await createSessionFixture();
        const failedJob = await AiJob.create({
            type: AI_JOB_TYPES.GENERATE_REPORT,
            userId,
            consultationSessionId: session._id,
            resourceType: "AiConsultationSession",
            resourceId: session._id.toString(),
            deduplicationKey: `legacy-report:${session._id}`,
            status: "failed_terminal",
            attempts: 1,
            maxAttempts: 1,
            lastError: {
                code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED",
                retryable: false,
                at: new Date(),
            },
        });
        session.flowState = AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE;
        session.currentJobId = failedJob._id;
        session.revision = 9;
        session.facts = {
            ...completedFacts("hydration_barrier"),
            allergies_restrictions: "Evito perfume intenso",
        };
        session.conversation = {
            currentQuestion: null,
            missingSlotCodes: [],
            turns: [],
        };
        await session.save();

        const corrected = await editAiConsultationAnswer(
            userId.toString(),
            session._id.toString(),
            "allergies_restrictions",
            {
                revision: 9,
                value: PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
            },
        );

        expect(corrected.flowState).toBe(
            AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT,
        );
        expect(corrected.operation).toBeNull();
        expect(
            corrected.conversation.answers.find(
                ({ slotCode }) => slotCode === "allergies_restrictions",
            ),
        ).toMatchObject({
            value: PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
            editable: true,
        });
    });

    it("resultado inconclusivo exige um par novo e nunca reutiliza o fingerprint antigo", async () => {
        const { userId, session } = await createSessionFixture();
        await beginAiConsultationAnalysis(
            userId.toString(),
            session._id.toString(),
        );
        const analyzingSession = await AiConsultationSession.findById(
            session._id,
        );
        const analysisJob = await AiJob.findById(
            analyzingSession.currentJobId,
        );
        const consent = await FaceConsent.findOne({ userId });
        const oldPhotoIds = analyzingSession.photoIds.map(String);
        const inconclusive = await createAnalysisResult({
            userId,
            consentId: consent._id,
            sessionId: session._id,
            photoIds: analyzingSession.photoIds,
            photoQualityStatus: "inconclusive",
        });

        await handleAnalyzePhotosJob(analysisJob, {
            analysisRunner: async () => ({
                id: inconclusive.id,
                status: inconclusive.status,
                photoQuality: inconclusive.photoQuality,
            }),
        });

        const waitingForNewPhotos = await getAiConsultationSession(
            userId.toString(),
            session._id.toString(),
        );
        expect(waitingForNewPhotos).toMatchObject({
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            photos: { ready: false, requiresNewPhotos: true },
        });
        expect(waitingForNewPhotos.conversation.currentQuestion).toBeNull();
        await expect(
            beginAiConsultationAnalysis(
                userId.toString(),
                session._id.toString(),
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: { code: "NEW_FACE_PHOTOS_REQUIRED" },
        });
        expect(
            await AiJob.countDocuments({
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
            }),
        ).toBe(0);

        const newPhotos = await replaceActivePhotos(
            userId,
            consent._id,
            "replacement",
        );
        const resumed = await beginAiConsultationAnalysis(
            userId.toString(),
            session._id.toString(),
        );
        const refreshedSession = await AiConsultationSession.findById(
            session._id,
        );
        const newPhotoIds = newPhotos.map(({ _id }) => String(_id)).sort();
        expect(refreshedSession.photoIds.map(String).sort()).toEqual(
            newPhotoIds,
        );
        expect(resumed.operation.type).toBe(AI_JOB_TYPES.ANALYZE_PHOTOS);
        expect(newPhotoIds).not.toEqual([...oldPhotoIds].sort());
        expect(
            buildFaceAnalysisInputFingerprint({
                consultationSessionId: session._id,
                consentId: consent._id,
                photoIds: refreshedSession.photoIds,
                objectives: ["hydration_barrier"],
            }),
        ).not.toBe(
            (
                await FaceAnalysis.findById(inconclusive._id).select(
                    "+inputFingerprint",
                )
            ).inputFingerprint,
        );
    });

    it("warning OpenAI exige confirmação antes de enfileirar a primeira pergunta", async () => {
        const { userId, session } = await createSessionFixture();
        await beginAiConsultationAnalysis(
            userId.toString(),
            session._id.toString(),
        );
        const analyzingSession = await AiConsultationSession.findById(
            session._id,
        );
        const analysisJob = await AiJob.findById(
            analyzingSession.currentJobId,
        );
        const consent = await FaceConsent.findOne({ userId });
        const warningAnalysis = await createAnalysisResult({
            userId,
            consentId: consent._id,
            sessionId: session._id,
            photoIds: analyzingSession.photoIds,
            photoQualityStatus: "warning",
        });

        await handleAnalyzePhotosJob(analysisJob, {
            analysisRunner: async () => ({
                id: warningAnalysis.id,
                status: warningAnalysis.status,
                photoQuality: warningAnalysis.photoQuality,
            }),
        });

        const awaitingAcknowledgement = await getAiConsultationSession(
            userId.toString(),
            session._id.toString(),
        );
        expect(awaitingAcknowledgement).toMatchObject({
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            photos: {
                ready: true,
                requiresWarningConfirmation: true,
            },
        });
        expect(awaitingAcknowledgement.conversation.currentQuestion).toBeNull();
        expect(
            await AiJob.countDocuments({
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
            }),
        ).toBe(0);

        await expect(
            beginAiConsultationAnalysis(
                userId.toString(),
                session._id.toString(),
            ),
        ).rejects.toMatchObject({
            statusCode: 409,
            details: { code: "PHOTO_WARNINGS_CONFIRMATION_REQUIRED" },
        });
        const confirmed = await beginAiConsultationAnalysis(
            userId.toString(),
            session._id.toString(),
            { acknowledgePhotoWarnings: true },
        );
        expect(confirmed).toMatchObject({
            flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
            operation: null,
            conversation: {
                currentQuestion: { source: "deterministic_plan" },
            },
        });
        const persisted = await AiConsultationSession.findById(session._id);
        expect(persisted.photoQualityAcknowledgement.acknowledgedAt).toBeInstanceOf(
            Date,
        );
        expect(persisted.photoQualityAcknowledgement.photoSetHash).toMatch(
            /^[a-f0-9]{64}$/,
        );
        expect(
            await AiJob.countDocuments({
                consultationSessionId: session._id,
                type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
            }),
        ).toBe(0);
    });

    it("converte jobs legacy numa pergunta local sem provenance externa", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 2;
        const job = await AiJob.create({
            type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
            userId,
            consultationSessionId: session._id,
            resourceType: "AiConsultationSession",
            resourceId: session._id.toString(),
            deduplicationKey: `question-provenance:${session._id}:2`,
        });
        session.currentJobId = job._id;
        await session.save();
        await handleSelectNextQuestionJob(job);

        const persisted = await AiConsultationSession.findById(session._id);
        expect(persisted.conversation.currentQuestion).toMatchObject({
            source: "deterministic_plan",
            provenance: null,
        });
        expect(persisted.conversation.turns).toHaveLength(1);
        expect(persisted.conversation.turns[0]).toMatchObject({
            kind: "question",
            question: { source: "deterministic_plan", provenance: null },
        });
    });

    it("edita uma resposta sem invalidar a pergunta seguinte", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 2;
        session.facts = { budget_cents: 3000 };
        session.conversation = {
            turns: [
                {
                    kind: "answer",
                    questionId: "1:budget_cents",
                    slotCode: "budget_cents",
                    value: 3000,
                    at: new Date(),
                },
            ],
            currentQuestion: {
                id: "2:current_routine",
                revision: 2,
                slotCode: "current_routine",
                type: "short_text",
                label: "Rotina atual",
                options: [],
                maxLength: 600,
                source: "deterministic_plan",
            },
            missingSlotCodes: [],
        };
        await session.save();

        const edited = await editAiConsultationAnswer(
            userId.toString(),
            session._id.toString(),
            "budget_cents",
            { revision: 2, value: 5000 },
        );

        expect(edited.revision).toBe(3);
        expect(
            edited.conversation.answers.find(
                ({ slotCode }) => slotCode === "budget_cents",
            ),
        ).toMatchObject({ value: 5000, displayValue: "50,00 €" });
        expect(edited.conversation.currentQuestion).toMatchObject({
            slotCode: "current_routine",
            revision: 3,
        });
    });

    it("substitui uma pergunta legacy de restrições pela confirmação do perfil", async () => {
        const { userId, session } = await createSessionFixture();
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 5;
        session.facts = {};
        session.conversation = {
            turns: [],
            questionPlan: {
                version: "guided-question-plan-v4",
                slotCodes: buildDeterministicQuestionPlan(
                    "hydration_barrier",
                ).map(({ code }) => code),
            },
            currentQuestion: {
                id: "5:allergies_restrictions",
                revision: 5,
                slotCode: "allergies_restrictions",
                type: "short_text",
                label: "Tens alergias ou restrições?",
                options: [],
                maxLength: 400,
                source: "deterministic_plan",
            },
            missingSlotCodes: [],
        };
        await session.save();

        const resumed = await getAiConsultationSession(
            userId.toString(),
            session._id.toString(),
        );
        expect(resumed.conversation.currentQuestion).toMatchObject({
            id: "5:allergies_restrictions",
            slotCode: "allergies_restrictions",
            type: "single_select",
        });
        expect(resumed.conversation.currentQuestion.options).toEqual([
            expect.objectContaining({
                value: PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
            }),
            expect.objectContaining({
                value: PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE,
            }),
        ]);

        await answerAiConsultationQuestion(
            userId.toString(),
            session._id.toString(),
            {
                questionId: "5:allergies_restrictions",
                revision: 5,
                value: PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
            },
        );
        const persisted = await AiConsultationSession.findById(session._id);
        expect(persisted.facts.allergies_restrictions).toBe(
            PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED,
        );
        expect(persisted.conversation.questionPlan.version).toBe(
            "guided-question-plan-v5",
        );
    });

    it("atualiza uma consulta de maquilhagem aberta sem voltar a mostrar 18 checkboxes", async () => {
        const userId = new mongoose.Types.ObjectId();
        await createConsentAndPhotos(userId);
        await createAiConsultationSession(userId.toString(), {
            primaryGoal: "makeup",
            secondaryGoals: [
                "hydration_barrier",
                "spots_tone_luminosity",
            ],
        });
        const session = await AiConsultationSession.findOne({
            userId,
            isOpen: true,
        });
        const legacySlotCodes = buildDeterministicQuestionPlan(
            "makeup",
            ["hydration_barrier", "spots_tone_luminosity"],
        )
            .map(({ code }) => code)
            .filter((code) => code !== "makeup_plan_depth");
        session.flowState = AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS;
        session.revision = 7;
        session.facts = {
            makeup_context: "event",
            makeup_style: "soft_glam",
            makeup_regions: ["complexion", "eyes"],
        };
        session.conversation = {
            turns: [],
            questionPlan: {
                version: "guided-question-plan-v3",
                slotCodes: legacySlotCodes,
            },
            currentQuestion: {
                id: "7:makeup_functions",
                revision: 7,
                slotCode: "makeup_functions",
                type: "multi_select",
                label: "Que elementos queres incluir no plano?",
                options: ["primer", "foundation", "eyeshadow", "mascara"],
                source: "deterministic_plan",
            },
            missingSlotCodes: [],
        };
        await session.save();

        const resumed = await getAiConsultationSession(
            userId.toString(),
            session._id.toString(),
        );
        expect(resumed.conversation.currentQuestion).toMatchObject({
            id: "7:makeup_plan_depth",
            slotCode: "makeup_plan_depth",
            type: "single_select",
        });
        expect(resumed.conversation.currentQuestion.options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: "balanced" }),
                expect.objectContaining({ value: "custom" }),
            ]),
        );
        expect(resumed.conversation.totalQuestions).toBe(16);

        const answered = await answerAiConsultationQuestion(
            userId.toString(),
            session._id.toString(),
            {
                questionId: "7:makeup_plan_depth",
                revision: 7,
                value: "balanced",
            },
        );
        expect(answered.makeupPlan).toMatchObject({
            depth: "balanced",
            customized: false,
        });
        expect(answered.conversation.currentQuestion?.slotCode).not.toBe(
            "makeup_functions",
        );
        const persisted = await AiConsultationSession.findById(session._id);
        expect(persisted.facts.makeup_plan_depth).toBe("balanced");
        expect(persisted.conversation.questionPlan).toMatchObject({
            version: "guided-question-plan-v5",
        });
    });
});
