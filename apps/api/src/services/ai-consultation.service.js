/**
 * Orquestração da consulta cosmética OpenAI v2.
 *
 * A sessão é a fonte de verdade do fluxo. Cada operação longa é enfileirada
 * com deduplicação; cada resposta usa compare-and-set; consentimento e
 * fotografias são relidos antes e depois das chamadas externas relevantes.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { isTransactionalMongoReady } from "../config/db.js";
import {
    AI_CONSULTATION_GOALS_VERSION,
    AI_CONSULTATION_MAX_QUESTIONS,
    AI_CONSULTATION_MIN_QUESTIONS,
    buildGoalSlotPlan,
    createQuestionPlanSnapshot,
    getAiConsultationOptionLabel,
    getPublicAiConsultationGoals,
    PROFILE_RESTRICTIONS_CONFIRMATION,
    resolveApplicableQuestionPlanSlots,
    resolveQuestionPlanSlots,
} from "../constants/ai-consultation-goals.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
    AI_CONSULTATION_SCHEMA_VERSION,
    AI_CONSULTATION_STATUS,
} from "../models/ai-consultation-session.model.js";
import { AiJob, AI_JOB_STATUSES, AI_JOB_TYPES } from "../models/ai-job.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import {
    ReportPhotoGrant,
    REPORT_PHOTO_GRANT_STATUSES,
} from "../models/report-photo-grant.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { Profile } from "../models/profile.model.js";
import {
    assertOpenAiAvailable,
    getOpenAiCapabilities,
} from "../providers/openai-responses.provider.js";
import { normalizeAnswerForQuestion } from "../validators/ai-consultation.validator.js";
import { createFaceAnalysisForUser } from "./face-analysis.service.js";
import { assertFaceConsentAllowsConfiguredProvider } from "./face-photo.service.js";
import {
    buildPublicMakeupPlan,
    constrainMakeupFunctionSlot,
    resolveMakeupPlan,
} from "./makeup-plan.service.js";
import {
    cancelAiJobsForUser,
    enqueueAiJob,
    retryOwnedAiJob,
    toPublicAiJob,
} from "./ai-job.service.js";
import {
    assertConsultationRestrictionsCoveredByProfile,
} from "./consultation-report.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CONSULTATIONS_PER_DAY = 3;
const MAX_LOGICAL_OPERATIONS = 12;
const REQUIRED_CONSENT_VERSION = "face-analysis-v2";

function idString(value) {
    return value ? String(value) : null;
}

function samePhotoIdSet(left = [], right = []) {
    const normalizedLeft = left.map(idString).sort();
    const normalizedRight = right.map(idString).sort();
    return (
        normalizedLeft.length === normalizedRight.length &&
        normalizedLeft.every((value, index) => value === normalizedRight[index])
    );
}

function getConversation(session) {
    return session.conversation ?? { turns: [], currentQuestion: null };
}

/** Identifica apenas snapshots de maquilhagem anteriores à pergunta simples. */
function hasLegacyMakeupQuestionPlan(session, conversation) {
    const codes = conversation.questionPlan?.slotCodes;
    const makeupSelected = [
        session.goalSelection?.primaryGoal,
        ...(session.goalSelection?.secondaryGoals ?? []),
    ].includes("makeup");
    return (
        makeupSelected &&
        Array.isArray(codes) &&
        codes.includes("makeup_functions") &&
        !codes.includes("makeup_plan_depth")
    );
}

/** Identifica a antiga pergunta de texto livre sobre restrições do perfil. */
function hasLegacyRestrictionsQuestion(conversation) {
    return (
        conversation.currentQuestion?.slotCode ===
            "allergies_restrictions" &&
        conversation.currentQuestion?.type !== "single_select"
    );
}

/**
 * Recupera ou cria um plano determinístico sem perder a ordem já percorrida
 * por sessões v2. O snapshot permanece dentro do campo encriptado.
 */
function getSessionQuestionPlan(session, conversation = getConversation(session)) {
    const canonical = createQuestionPlanSnapshot(
        session.goalSelection?.primaryGoal,
        session.goalSelection?.secondaryGoals,
    );
    if (
        (hasLegacyMakeupQuestionPlan(session, conversation) ||
            hasLegacyRestrictionsQuestion(conversation)) &&
        session.flowState === AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS &&
        conversation.currentQuestion
    ) {
        return canonical;
    }
    if (Array.isArray(conversation.questionPlan?.slotCodes)) {
        return {
            version: conversation.questionPlan.version ?? canonical.version,
            slotCodes: resolveQuestionPlanSlots(
                session.goalSelection,
                conversation.questionPlan,
            ).map(({ code }) => code),
        };
    }

    const allowedCodes = new Set(
        buildGoalSlotPlan(
            session.goalSelection?.primaryGoal,
            session.goalSelection?.secondaryGoals,
        ).map(({ code }) => code),
    );
    const historicCodes = [
        ...(conversation.turns ?? []).map(
            (turn) => turn?.question?.slotCode ?? turn?.slotCode,
        ),
        conversation.currentQuestion?.slotCode,
    ].filter((code) => allowedCodes.has(code));
    return {
        version: canonical.version,
        slotCodes: [...new Set([...historicCodes, ...canonical.slotCodes])].slice(
            0,
            AI_CONSULTATION_MAX_QUESTIONS,
        ),
    };
}

/**
 * Troca, durante a retoma, a pergunta extensa de um snapshot legacy pela nova
 * decisão de profundidade. A mutação seguinte persiste o plano v4.
 */
function getEffectiveCurrentQuestion(session, conversation) {
    const currentQuestion = conversation.currentQuestion;
    if (
        currentQuestion &&
        hasLegacyRestrictionsQuestion(conversation) &&
        session.flowState === AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS
    ) {
        const restrictionsSlot = resolveQuestionPlanSlots(
            session.goalSelection,
            createQuestionPlanSnapshot(
                session.goalSelection?.primaryGoal,
                session.goalSelection?.secondaryGoals,
            ),
        ).find(({ code }) => code === "allergies_restrictions");
        return restrictionsSlot
            ? buildCanonicalQuestion(
                  restrictionsSlot,
                  session.revision,
                  "deterministic_plan",
              )
            : currentQuestion;
    }
    if (
        !currentQuestion ||
        !hasLegacyMakeupQuestionPlan(session, conversation) ||
        session.flowState !== AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS ||
        Object.hasOwn(session.facts ?? {}, "makeup_plan_depth")
    ) {
        return currentQuestion;
    }
    const depthSlot = resolveQuestionPlanSlots(
        session.goalSelection,
        createQuestionPlanSnapshot(
            session.goalSelection?.primaryGoal,
            session.goalSelection?.secondaryGoals,
        ),
    ).find(({ code }) => code === "makeup_plan_depth");
    return depthSlot
        ? buildCanonicalQuestion(
              depthSlot,
              session.revision,
              "deterministic_plan",
          )
        : currentQuestion;
}

/** Devolve os slots atualmente aplicáveis pela ordem de apresentação. */
function getSessionPlanSlots(
    session,
    conversation = getConversation(session),
    facts = session.facts ?? {},
) {
    return resolveApplicableQuestionPlanSlots(
        session.goalSelection,
        getSessionQuestionPlan(session, conversation),
        facts,
    ).map((slot) => constrainMakeupFunctionSlot(slot, facts));
}

/** Formata uma resposta para leitura sem alterar o valor canónico guardado. */
function formatPublicAnswer(slot, value) {
    if (slot?.code === "budget_cents" && Number.isInteger(value)) {
        return new Intl.NumberFormat("pt-PT", {
            style: "currency",
            currency: "EUR",
        }).format(value / 100);
    }
    if (Array.isArray(value)) {
        return value
            .map((item, index) => {
                try {
                    return getAiConsultationOptionLabel(item);
                } catch {
                    return `Opção ${index + 1}`;
                }
            })
            .join(", ");
    }
    if (slot?.options?.includes(value)) {
        try {
            return getAiConsultationOptionLabel(value);
        } catch {
            return "Opção selecionada";
        }
    }
    return value === null || value === undefined || value === ""
        ? "Resposta registada"
        : String(value);
}

/** Converte a pergunta persistida no contrato de apresentação PT-PT. */
function toPublicQuestion(question) {
    if (!question || typeof question !== "object") return null;
    return {
        ...question,
        options: (question.options ?? []).map((value, index) => {
            try {
                return { value, label: getAiConsultationOptionLabel(value) };
            } catch {
                return { value, label: `Opção ${index + 1}` };
            }
        }),
        presentation: question.presentation ?? {},
        provenance: undefined,
    };
}

/** Constrói a coleção pública e editável a partir dos factos atuais. */
function buildPublicAnswers(session, conversation, planSlots) {
    const facts = session.facts ?? {};
    const answerTurns = new Map(
        (conversation.turns ?? [])
            .filter((turn) => turn?.kind === "answer")
            .map((turn) => [turn.slotCode, turn]),
    );
    return planSlots
        .filter((slot) => Object.hasOwn(facts, slot.code))
        .map((slot) => ({
            slotCode: slot.code,
            questionId: answerTurns.get(slot.code)?.questionId ?? null,
            label: slot.label,
            type: slot.type,
            options: (slot.options ?? []).map((option, index) => {
                try {
                    return {
                        value: option,
                        label: getAiConsultationOptionLabel(option),
                    };
                } catch {
                    return { value: option, label: `Opção ${index + 1}` };
                }
            }),
            min: slot.min ?? null,
            max: slot.max ?? null,
            maxLength: slot.maxLength ?? null,
            presentation: slot.presentation ?? {},
            value: facts[slot.code],
            displayValue: formatPublicAnswer(slot, facts[slot.code]),
            editable: [
                AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT,
                AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
            ].includes(session.flowState),
        }));
}

/** Retorna capacidades sem lançar quando o provider está ausente. */
export function getAiConsultationCapabilities() {
    return getOpenAiCapabilities();
}

/** Retorna os sete objetivos públicos. */
export function listAiConsultationGoals() {
    return getPublicAiConsultationGoals();
}

function assertConsentV2(consent) {
    const providerConsent = consent?.externalProviderConsent;
    if (
        !consent ||
        consent.revokedAt ||
        consent.version !== REQUIRED_CONSENT_VERSION ||
        consent.purpose !== FACE_ANALYSIS_CONSENT_PURPOSE ||
        consent.purposes?.openAiAnalysis !== true ||
        !providerConsent ||
        providerConsent.revokedAt ||
        providerConsent.provider !== "openai"
    ) {
        throw new AppError(
            403,
            "Consentimento OpenAI v2 obrigatório para continuar a consulta.",
            { code: "OPENAI_CONSENT_REQUIRED" },
        );
    }
    assertFaceConsentAllowsConfiguredProvider(consent);
    return consent;
}

async function findActiveConsent(userId, databaseSession = null) {
    let query = FaceConsent.findOne({
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        version: REQUIRED_CONSENT_VERSION,
        revokedAt: null,
    });
    if (databaseSession) query = query.session(databaseSession);
    return assertConsentV2(await query);
}

async function findActivePhotos(userId, databaseSession = null) {
    let query = FacePhoto.find({ userId, status: "active" })
        .sort({ createdAt: -1 })
        .select("_id kind quality createdAt");
    if (databaseSession) query = query.session(databaseSession);
    const photos = await query;
    const byKind = new Map();
    for (const photo of photos) {
        if (!byKind.has(photo.kind)) byKind.set(photo.kind, photo);
    }
    const selected = [byKind.get("frontal"), byKind.get("perfil")].filter(Boolean);
    if (selected.length !== 2) {
        throw new AppError(400, "Fotografias frontal e de perfil obrigatórias", {
            code: "FACE_PHOTOS_REQUIRED",
        });
    }
    if (selected.some((photo) => photo.quality?.status === "fail")) {
        throw new AppError(422, "As fotografias não cumprem a qualidade técnica mínima", {
            code: "FACE_PHOTO_QUALITY_FAILED",
        });
    }
    return selected;
}

function buildPhotoQualitySetHash(photos) {
    return createHash("sha256")
        .update(
            photos
                .map((photo) =>
                    JSON.stringify({
                        id: idString(photo._id),
                        kind: photo.kind,
                        profileVersion: photo.quality?.profileVersion ?? null,
                        status: photo.quality?.status ?? null,
                        metrics: photo.quality?.metrics ?? null,
                        warnings: photo.quality?.warnings ?? [],
                    }),
                )
                .sort()
                .join("\n"),
        )
        .digest("hex");
}

async function findOwnedSession(userId, sessionId, databaseSession = null) {
    let query = AiConsultationSession.findOne({ _id: sessionId, userId });
    if (databaseSession) query = query.session(databaseSession);
    const session = await query;
    if (!session) throw new AppError(404, "Consulta não encontrada");
    return session;
}

async function runOptionalTransaction(handler) {
    if (mongoose.connection.readyState !== 1) {
        return handler(null);
    }
    if (!isTransactionalMongoReady()) {
        throw new AppError(
            503,
            "A consulta requer MongoDB com suporte transacional.",
            { code: "TRANSACTIONAL_MONGODB_REQUIRED" },
        );
    }
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await handler(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
}

/** Constrói o DTO agregado usado pelo frontend, sem conteúdo de relatório. */
export async function toPublicAiConsultationSession(session) {
    const [photos, analysis, operation] = await Promise.all([
        FacePhoto.find({ userId: session.userId, status: "active" })
            .select("_id kind quality")
            .lean(),
        session.analysisId
            ? FaceAnalysis.findOne({ _id: session.analysisId, userId: session.userId })
                  .select("userId status photoIds photoQuality providerName providerVersion provenance")
            : null,
        session.currentJobId
            ? AiJob.findOne({ _id: session.currentJobId, userId: session.userId })
            : null,
    ]);
    const conversation = getConversation(session);
    const effectiveCurrentQuestion = getEffectiveCurrentQuestion(
        session,
        conversation,
    );
    const turns = Array.isArray(conversation.turns) ? conversation.turns : [];
    const questionPlan = getSessionQuestionPlan(session, conversation);
    const planSlots = getSessionPlanSlots(session, {
        ...conversation,
        questionPlan,
    }, session.facts ?? {});
    const answeredCount = planSlots.filter((slot) =>
        Object.hasOwn(session.facts ?? {}, slot.code),
    ).length;
    const totalQuestions = planSlots.length;
    const makeupSelected = [
        session.goalSelection?.primaryGoal,
        ...(session.goalSelection?.secondaryGoals ?? []),
    ].includes("makeup");
    const currentPhotoIds = photos.map(({ _id }) => _id);
    const requiresNewPhotos = Boolean(
        analysis?.status === "inconclusive" &&
            samePhotoIdSet(currentPhotoIds, session.photoIds),
    );
    const requiresPhotoWarningConfirmation = Boolean(
        analysis?.status === "completed" &&
            analysis.photoQuality?.status === "warning" &&
            samePhotoIdSet(currentPhotoIds, session.photoIds) &&
            !session.photoQualityAcknowledgement?.acknowledgedAt,
    );

    return {
        id: idString(session._id),
        schemaVersion: session.schemaVersion ?? 1,
        revision: session.revision ?? 0,
        flowState: session.flowState,
        status: session.status,
        goals: session.goalSelection,
        makeupPlan: makeupSelected
            ? buildPublicMakeupPlan(session.facts ?? {})
            : null,
        photos: {
            required: 2,
            count: photos.length,
            ready:
                new Set(photos.map((photo) => photo.kind)).size === 2 &&
                !photos.some((photo) => photo.quality?.status === "fail") &&
                !requiresNewPhotos,
            requiresNewPhotos,
            requiresWarningConfirmation: requiresPhotoWarningConfirmation,
            items: photos.map((photo) => ({
                id: idString(photo._id),
                kind: photo.kind,
                quality: photo.quality ?? null,
            })),
        },
        analysis: analysis
            ? {
                  id: idString(analysis._id),
                  status: analysis.status,
                  photoQuality: analysis.photoQuality,
                  provider: analysis.providerName,
                  model: analysis.providerVersion,
              }
            : null,
        conversation: {
            answeredCount,
            totalQuestions,
            currentIndex: effectiveCurrentQuestion
                ? Math.min(answeredCount + 1, totalQuestions)
                : Math.min(answeredCount, totalQuestions),
            minQuestions: AI_CONSULTATION_MIN_QUESTIONS,
            maxQuestions: AI_CONSULTATION_MAX_QUESTIONS,
            currentQuestion: toPublicQuestion(effectiveCurrentQuestion),
            answers: buildPublicAnswers(session, conversation, planSlots),
            turns: turns.map((turn) =>
                turn.kind === "question"
                    ? { ...turn, question: toPublicQuestion(turn.question) }
                    : turn,
            ),
            missingSlotCodes: conversation.missingSlotCodes ?? [],
        },
        operation: operation ? toPublicAiJob(operation) : null,
        reportId: idString(session.reportId),
        canCancel: Boolean(session.isOpen),
        updatedAt: session.updatedAt,
    };
}

/** Cria uma sessão nova; não promove drafts legacy nem inventa objetivos. */
export async function createAiConsultationSession(userId, goalSelection) {
    assertOpenAiAvailable();
    const existing = await AiConsultationSession.findOne({ userId, isOpen: true });
    if (existing) {
        throw new AppError(409, "Já existe uma consulta em curso", {
            code: "OPEN_CONSULTATION_EXISTS",
            sessionId: idString(existing._id),
        });
    }
    const count = await AiConsultationSession.countDocuments({
        userId,
        schemaVersion: AI_CONSULTATION_SCHEMA_VERSION,
        createdAt: { $gte: new Date(Date.now() - DAY_MS) },
    });
    if (count >= MAX_CONSULTATIONS_PER_DAY) {
        throw new AppError(429, "Limite diário de novas consultas atingido", {
            code: "CONSULTATION_DAILY_LIMIT",
        });
    }

    try {
        const session = await AiConsultationSession.create({
            userId,
            schemaVersion: AI_CONSULTATION_SCHEMA_VERSION,
            scriptVersion: AI_CONSULTATION_GOALS_VERSION,
            goalSelection,
            conversation: {
                turns: [],
                currentQuestion: null,
                missingSlotCodes: [],
                questionPlan: createQuestionPlanSnapshot(
                    goalSelection.primaryGoal,
                    goalSelection.secondaryGoals,
                ),
            },
            facts: {},
            answers: [],
            status: AI_CONSULTATION_STATUS.ACTIVE,
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            isOpen: true,
        });
        return toPublicAiConsultationSession(session);
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError(409, "Já existe uma consulta em curso", {
                code: "OPEN_CONSULTATION_EXISTS",
            });
        }
        throw error;
    }
}

/**
 * Obtém a única consulta aberta do titular.
 * @param {string} userId - Titular autenticado.
 * @returns {Promise<object>} DTO agregado e sanitizado.
 */
export async function getCurrentAiConsultationSession(userId) {
    const session = await AiConsultationSession.findOne({ userId, isOpen: true }).sort({ updatedAt: -1 });
    if (!session) throw new AppError(404, "Não existe uma consulta em curso");
    return toPublicAiConsultationSession(session);
}

/**
 * Lista snapshots mínimos das consultas do titular para o histórico.
 *
 * Fotografias, respostas, factos e conteúdo do relatório não fazem parte
 * desta listagem; cada relatório continua sujeito ao respetivo gate de acesso.
 * @param {string} userId - Titular autenticado.
 * @param {{limit?: number}} [options] - Limite já validado.
 * @returns {Promise<{items: object[]}>} Resumos ordenados do mais recente.
 */
export async function listAiConsultationSessions(
    userId,
    { limit = 20 } = {},
) {
    const sessions = await AiConsultationSession.find({
        userId,
        schemaVersion: AI_CONSULTATION_SCHEMA_VERSION,
    })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .select(
            "userId schemaVersion goalSelection flowState status reportId isOpen createdAt updatedAt completedAt cancelledAt",
        );

    return {
        items: sessions.map((session) => ({
            id: idString(session._id),
            schemaVersion: session.schemaVersion,
            goals: session.goalSelection,
            flowState: session.flowState,
            status: session.status,
            reportId: idString(session.reportId),
            isOpen: session.isOpen,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            completedAt: session.completedAt,
            cancelledAt: session.cancelledAt,
        })),
    };
}

/**
 * Obtém uma consulta própria pelo identificador.
 * @param {string} userId - Titular autenticado.
 * @param {string} sessionId - Consulta pedida.
 * @returns {Promise<object>} DTO agregado e sanitizado.
 */
export async function getAiConsultationSession(userId, sessionId) {
    return toPublicAiConsultationSession(await findOwnedSession(userId, sessionId));
}

function assertOperationCapacity(session) {
    if (session.logicalOperations >= MAX_LOGICAL_OPERATIONS) {
        throw new AppError(429, "A consulta atingiu o limite de operações IA", {
            code: "CONSULTATION_OPERATION_LIMIT",
        });
    }
}

/**
 * Materializa um replay seguro quando o mesmo endpoint já criou o job.
 *
 * @param {object} session - Sessão própria relida da base.
 * @param {string} expectedType - Tipo de job esperado pelo endpoint.
 * @returns {Promise<object|null>} DTO agregado ou null quando não é replay.
 */
async function getOperationReplay(session, expectedType) {
    if (!session.currentJobId) return null;
    const job = await AiJob.findOne({
        _id: session.currentJobId,
        userId: session.userId,
        type: expectedType,
    });
    return job ? toPublicAiConsultationSession(session) : null;
}

/** Enfileira análise com snapshot exato do consentimento e fotografias. */
export async function beginAiConsultationAnalysis(
    userId,
    sessionId,
    { acknowledgePhotoWarnings = false } = {},
) {
    assertOpenAiAvailable();
    const initial = await findOwnedSession(userId, sessionId);
    if (initial.flowState === AI_CONSULTATION_FLOW_STATES.ANALYZING) {
        const replay = await getOperationReplay(
            initial,
            AI_JOB_TYPES.ANALYZE_PHOTOS,
        );
        if (replay) return replay;
    }
    if (
        initial.analysisId &&
        ![
            AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
            AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
        ].includes(initial.flowState)
    ) {
        return toPublicAiConsultationSession(initial);
    }

    let outcome;
    try {
        outcome = await runOptionalTransaction(async (databaseSession) => {
            const consultation = await findOwnedSession(
                userId,
                sessionId,
                databaseSession,
            );
            if (consultation.flowState === AI_CONSULTATION_FLOW_STATES.ANALYZING) {
                const replay = await getOperationReplay(
                    consultation,
                    AI_JOB_TYPES.ANALYZE_PHOTOS,
                );
                if (replay) return { replay };
            }
            if (
                !consultation.isOpen ||
                ![
                    AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
                    AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
                ].includes(consultation.flowState)
            ) {
                throw new AppError(409, "A consulta não está pronta para análise");
            }
            assertOperationCapacity(consultation);
            // O driver MongoDB não permite operações paralelas na mesma
            // ClientSession. Estas leituras pertencem à mesma transação e têm
            // de terminar sequencialmente antes de enfileirar o job.
            const consent = await findActiveConsent(userId, databaseSession);
            const photos = await findActivePhotos(userId, databaseSession);
            const currentPhotoIds = photos.map(({ _id }) => _id);
            if (consultation.analysisId) {
                let previousAnalysisQuery = FaceAnalysis.findOne({
                    _id: consultation.analysisId,
                    userId,
                    status: { $in: ["completed", "inconclusive"] },
                }).select("userId photoIds status photoQuality");
                if (databaseSession) {
                    previousAnalysisQuery = previousAnalysisQuery.session(
                        databaseSession,
                    );
                }
                const previousAnalysis = await previousAnalysisQuery;
                if (
                    previousAnalysis &&
                    samePhotoIdSet(
                        previousAnalysis.photoIds,
                        currentPhotoIds,
                    )
                ) {
                    if (previousAnalysis.status === "inconclusive") {
                        throw new AppError(
                            409,
                            "Substitui as duas fotografias antes de repetir a análise.",
                            { code: "NEW_FACE_PHOTOS_REQUIRED" },
                        );
                    }
                    if (previousAnalysis.photoQuality?.status === "warning") {
                        if (!acknowledgePhotoWarnings) {
                            throw new AppError(
                                409,
                                "Confirma os avisos da análise antes de continuar.",
                                {
                                    code: "PHOTO_WARNINGS_CONFIRMATION_REQUIRED",
                                },
                            );
                        }
                        const conversation = getConversation(consultation);
                        const revision = consultation.revision + 1;
                        const { questionPlan, question } =
                            buildNextPlannedQuestion(
                                consultation,
                                conversation,
                                consultation.facts ?? {},
                                revision,
                            );
                        if (!question) {
                            throw new Error(
                                "Não existe pergunta canónica disponível",
                            );
                        }
                        const resumed = await AiConsultationSession.updateOne(
                            {
                                _id: consultation._id,
                                userId,
                                __v: consultation.__v,
                                isOpen: true,
                            },
                            {
                                $set: {
                                    consentId: consent._id,
                                    photoIds: currentPhotoIds,
                                    photoQualityAcknowledgement: {
                                        photoSetHash:
                                            buildPhotoQualitySetHash(photos),
                                        acknowledgedAt: new Date(),
                                    },
                                    conversation: {
                                        ...conversation,
                                        questionPlan,
                                        currentQuestion: question,
                                        turns: [
                                            ...(conversation.turns ?? []),
                                            {
                                                kind: "question",
                                                question,
                                                at: new Date(),
                                            },
                                        ],
                                    },
                                    currentJobId: null,
                                    flowState:
                                        AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                                    revision,
                                },
                                $inc: { __v: 1 },
                            },
                            databaseSession
                                ? { session: databaseSession }
                                : undefined,
                        );
                        if (resumed.modifiedCount !== 1) {
                            throw new AppError(
                                409,
                                "A consulta mudou noutro pedido",
                            );
                        }
                        return { resumedWarning: true };
                    }
                }
            }
            const hasWarnings = photos.some(
                (photo) => photo.quality?.status === "warning",
            );
            if (hasWarnings && !acknowledgePhotoWarnings) {
                throw new AppError(
                    409,
                    "Confirma os avisos de qualidade antes de iniciar a análise.",
                    { code: "PHOTO_WARNINGS_CONFIRMATION_REQUIRED" },
                );
            }
            const revision = consultation.revision + 1;
            const queued = await enqueueAiJob(
                {
                    type: AI_JOB_TYPES.ANALYZE_PHOTOS,
                    userId,
                    consultationSessionId: consultation._id,
                    resourceType: "AiConsultationSession",
                    resourceId: consultation._id,
                    deduplicationKey: `analyze_photos:${consultation._id}:${revision}`,
                },
                { session: databaseSession },
            );
            const updated = await AiConsultationSession.updateOne(
                {
                    _id: consultation._id,
                    userId,
                    __v: consultation.__v,
                    isOpen: true,
                },
                {
                    $set: {
                        consentId: consent._id,
                        photoIds: currentPhotoIds,
                        photoQualityAcknowledgement: hasWarnings
                            ? {
                                  photoSetHash: buildPhotoQualitySetHash(photos),
                                  acknowledgedAt: new Date(),
                              }
                            : {
                                  photoSetHash: null,
                                  acknowledgedAt: null,
                              },
                        currentJobId: queued._id,
                        flowState: AI_CONSULTATION_FLOW_STATES.ANALYZING,
                        revision,
                    },
                    $inc: { logicalOperations: 1, __v: 1 },
                },
                databaseSession ? { session: databaseSession } : undefined,
            );
            if (updated.modifiedCount !== 1) {
                throw new AppError(409, "A consulta mudou noutro pedido");
            }
            return { job: queued };
        });
    } catch (error) {
        const current = await findOwnedSession(userId, sessionId);
        const replay = await getOperationReplay(
            current,
            AI_JOB_TYPES.ANALYZE_PHOTOS,
        );
        if (replay) return replay;
        const warningReplay = await getOperationReplay(
            current,
            AI_JOB_TYPES.SELECT_NEXT_QUESTION,
        );
        if (warningReplay) return warningReplay;
        throw error;
    }

    if (outcome.replay) return outcome.replay;
    const session = await findOwnedSession(userId, sessionId);
    if (outcome.job) session.currentJobId = outcome.job._id;
    return toPublicAiConsultationSession(session);
}

function buildCanonicalQuestion(slot, revision, source, provenance = null) {
    return {
        id: `${revision}:${slot.code}`,
        revision,
        slotCode: slot.code,
        type: slot.type,
        label: slot.label,
        options: slot.options ? [...slot.options] : [],
        min: slot.min ?? null,
        max: slot.max ?? null,
        maxLength: slot.maxLength ?? null,
        presentation: slot.presentation ? { ...slot.presentation } : {},
        source,
        provenance:
            source === "openai" && provenance
                ? {
                      provider: "openai",
                      requestedModel:
                          provenance.requestedModel ?? null,
                      effectiveModel:
                          provenance.effectiveModel ?? null,
                      requestId: provenance.requestId ?? null,
                      promptVersion:
                          provenance.promptVersion ?? null,
                      schemaVersion:
                          provenance.schemaVersion ?? null,
                      attemptCount:
                          Number.isSafeInteger(provenance.attemptCount) &&
                          provenance.attemptCount > 0
                              ? provenance.attemptCount
                              : 1,
                  }
                : null,
    };
}

/** Fallback permitido: escolhe um slot canónico, sem produzir análise. */
export function selectCanonicalFallbackQuestion(candidateSlots, revision) {
    const slot = candidateSlots.find((candidate) => candidate.required) ?? candidateSlots[0];
    return slot ? buildCanonicalQuestion(slot, revision, "canonical_fallback") : null;
}

/** Seleciona localmente a próxima pergunta do plano ainda sem resposta. */
function buildNextPlannedQuestion(session, conversation, facts, revision) {
    const questionPlan = getSessionQuestionPlan(session, conversation);
    const slot = getSessionPlanSlots(
        session,
        { ...conversation, questionPlan },
        facts,
    ).find((candidate) => !Object.hasOwn(facts, candidate.code));
    return {
        questionPlan,
        question: slot
            ? buildCanonicalQuestion(slot, revision, "deterministic_plan")
            : null,
    };
}

/** Handler durável da análise. Relê consentimento antes e depois da rede. */
export async function handleAnalyzePhotosJob(job, options = {}) {
    const session = await findOwnedSession(job.userId, job.consultationSessionId);
    if (idString(session.currentJobId) !== idString(job._id)) {
        return {
            resourceType: session.analysisId ? "FaceAnalysis" : "AiConsultationSession",
            resourceId: idString(session.analysisId ?? session._id),
            flowState: session.flowState,
        };
    }
    if (!session.isOpen || session.flowState !== AI_CONSULTATION_FLOW_STATES.ANALYZING) {
        throw Object.assign(new Error("Sessão da análise já não está ativa"), {
            code: "AI_SESSION_INACTIVE",
        });
    }
    await findActiveConsent(job.userId);
    const goals = session.goalSelection;
    const analysis = await (options.analysisRunner ?? createFaceAnalysisForUser)(
        idString(job.userId),
        {
            objectives: [goals.primaryGoal, ...(goals.secondaryGoals ?? [])],
            expectedPhotoIds: session.photoIds.map(String),
            consultationSessionId: session._id,
            providerOptions: options.providerOptions,
            signal: options.signal,
        },
    );
    // Uma revogação durante a chamada impede a transição para novo trabalho.
    await findActiveConsent(job.userId);

    if (analysis.status === "inconclusive" || analysis.photoQuality?.status === "inconclusive") {
        const updated = await AiConsultationSession.updateOne(
            { _id: session._id, userId: job.userId, isOpen: true, flowState: AI_CONSULTATION_FLOW_STATES.ANALYZING },
            {
                $set: {
                    analysisId: analysis.id,
                    currentJobId: null,
                    flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
                },
                $inc: { __v: 1 },
            },
        );
        if (updated.modifiedCount !== 1) throw new Error("Sessão mudou após a análise");
        return { resourceType: "FaceAnalysis", resourceId: analysis.id, flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS };
    }

    if (analysis.photoQuality?.status === "warning") {
        const updated = await AiConsultationSession.updateOne(
            {
                _id: session._id,
                userId: job.userId,
                isOpen: true,
                flowState: AI_CONSULTATION_FLOW_STATES.ANALYZING,
            },
            {
                $set: {
                    analysisId: analysis.id,
                    currentJobId: null,
                    flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
                    photoQualityAcknowledgement: {
                        photoSetHash: null,
                        acknowledgedAt: null,
                    },
                },
                $inc: { __v: 1 },
            },
        );
        if (updated.modifiedCount !== 1) {
            throw new Error("Sessão mudou após o warning da análise");
        }
        return {
            resourceType: "FaceAnalysis",
            resourceId: analysis.id,
            flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
        };
    }

    await runOptionalTransaction(async (databaseSession) => {
        const current = await findOwnedSession(job.userId, session._id, databaseSession);
        await findActiveConsent(job.userId, databaseSession);
        const conversation = getConversation(current);
        const revision = current.revision + 1;
        const { questionPlan, question } = buildNextPlannedQuestion(
            current,
            conversation,
            current.facts ?? {},
            revision,
        );
        if (!question) throw new Error("Não existe pergunta canónica disponível");
        const updated = await AiConsultationSession.updateOne(
            { _id: current._id, userId: job.userId, __v: current.__v, isOpen: true },
            {
                $set: {
                    analysisId: analysis.id,
                    conversation: {
                        ...conversation,
                        questionPlan,
                        currentQuestion: question,
                        turns: [
                            ...(conversation.turns ?? []),
                            { kind: "question", question, at: new Date() },
                        ],
                    },
                    currentJobId: null,
                    flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                    revision,
                },
                $inc: { __v: 1 },
            },
            databaseSession ? { session: databaseSession } : undefined,
        );
        if (updated.modifiedCount !== 1) throw new Error("Sessão mudou após a análise");
    });
    return {
        resourceType: "FaceAnalysis",
        resourceId: analysis.id,
        flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
    };
}

/** Handler de compatibilidade para jobs v2 ainda presentes na fila. */
export async function handleSelectNextQuestionJob(job) {
    const session = await findOwnedSession(job.userId, job.consultationSessionId);
    if (idString(session.currentJobId) !== idString(job._id)) {
        return {
            resourceType: "AiConsultationSession",
            resourceId: idString(session._id),
            flowState: session.flowState,
        };
    }
    if (!session.isOpen) throw Object.assign(new Error("Sessão inativa"), { code: "AI_SESSION_INACTIVE" });
    await findActiveConsent(job.userId);
    const conversation = getConversation(session);
    const facts = session.facts ?? {};
    const revision = session.revision;
    const { questionPlan, question } = buildNextPlannedQuestion(
        session,
        conversation,
        facts,
        revision,
    );
    const remainingSlots = getSessionPlanSlots(session, {
        ...conversation,
        questionPlan,
    }, facts).filter((slot) => !Object.hasOwn(facts, slot.code));
    const mustStop = !question;

    if (mustStop) {
        const missingSlotCodes = remainingSlots
            .filter((slot) => slot.required)
            .map((slot) => slot.code);
        await findActiveConsent(job.userId);
        const updated = await AiConsultationSession.updateOne(
            { _id: session._id, userId: job.userId, __v: session.__v, isOpen: true },
            {
                $set: {
                    conversation: {
                        ...conversation,
                        questionPlan,
                        currentQuestion: null,
                        missingSlotCodes,
                    },
                    currentJobId: null,
                    flowState: AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT,
                },
                $inc: { __v: 1 },
            },
        );
        if (updated.modifiedCount !== 1) throw new Error("Sessão mudou durante a pergunta");
        return { resourceType: "AiConsultationSession", resourceId: idString(session._id), flowState: AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT };
    }

    await findActiveConsent(job.userId);
    const updatedConversation = {
        ...conversation,
        questionPlan,
        currentQuestion: question,
        turns: [
            ...(conversation.turns ?? []),
            { kind: "question", question, at: new Date() },
        ],
    };
    const updated = await AiConsultationSession.updateOne(
        { _id: session._id, userId: job.userId, __v: session.__v, isOpen: true },
        {
            $set: {
                conversation: updatedConversation,
                currentJobId: null,
                flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
            },
            $inc: { __v: 1 },
        },
    );
    if (updated.modifiedCount !== 1) throw new Error("Sessão mudou durante a pergunta");
    return { resourceType: "AiConsultationSession", resourceId: idString(session._id), flowState: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS };
}

/** Persiste uma resposta e devolve imediatamente a pergunta seguinte. */
export async function answerAiConsultationQuestion(userId, sessionId, input) {
    await runOptionalTransaction(async (databaseSession) => {
        const session = await findOwnedSession(userId, sessionId, databaseSession);
        if (!session.isOpen) {
            throw new AppError(409, "A consulta não está a aguardar uma resposta");
        }
        await findActiveConsent(userId, databaseSession);
        const conversation = getConversation(session);
        const question = getEffectiveCurrentQuestion(session, conversation);
        if (
            !question ||
            question.id !== input.questionId ||
            question.revision !== input.revision ||
            session.revision !== input.revision
        ) {
            throw new AppError(409, "A pergunta mudou. Recarrega a consulta.");
        }
        const value = normalizeAnswerForQuestion(question, input.value);
        if (
            question.slotCode === "allergies_restrictions" &&
            value === PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE
        ) {
            assertConsultationRestrictionsCoveredByProfile(
                { allergies_restrictions: value },
                null,
            );
        }

        if (session.flowState === AI_CONSULTATION_FLOW_STATES.NEEDS_CLARIFICATION) {
            assertOpenAiAvailable();
            assertOperationCapacity(session);
            if (!session.currentReviewId || question.source !== "human_review") {
                throw new AppError(409, "Pedido de esclarecimento inválido");
            }
            let reviewQuery = AiConsultationReview.findOne({
                _id: session.currentReviewId,
                userId,
                consultationSessionId: session._id,
                status: "needs_clarification",
                clarificationResolvedAt: null,
            });
            if (databaseSession) reviewQuery = reviewQuery.session(databaseSession);
            const review = await reviewQuery;
            if (!review) throw new AppError(409, "O esclarecimento já foi respondido");

            const revision = session.revision + 1;
            const reportJob = await enqueueAiJob(
                {
                    type: AI_JOB_TYPES.GENERATE_REPORT,
                    userId,
                    consultationSessionId: session._id,
                    resourceType: "AiConsultationSession",
                    resourceId: session._id,
                    deduplicationKey: `generate_report:${session._id}:${revision}`,
                    // O provider já executa retry primário e fallback dentro
                    // do mesmo deadline. Repetir o job multiplicaria pedidos e
                    // custo sem acrescentar uma estratégia de recuperação nova.
                    maxAttempts: 1,
                },
                { session: databaseSession },
            );
            const resolvedAt = new Date();
            const reviewUpdate = await AiConsultationReview.updateOne(
                {
                    _id: review._id,
                    userId,
                    status: "needs_clarification",
                    clarificationResolvedAt: null,
                },
                {
                    $set: {
                        status: "cancelled",
                        clarificationResolvedAt: resolvedAt,
                        cancelledAt: resolvedAt,
                    },
                },
                databaseSession ? { session: databaseSession } : undefined,
            );
            if (reviewUpdate.modifiedCount !== 1) {
                throw new AppError(409, "O esclarecimento já foi respondido");
            }
            await ReportPhotoGrant.updateOne(
                {
                    reviewId: review._id,
                    clientUserId: userId,
                    status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                },
                {
                    $set: {
                        status: REPORT_PHOTO_GRANT_STATUSES.REVOKED,
                        revokedAt: resolvedAt,
                        revocationReason: "clarification_report_superseded",
                    },
                },
                databaseSession ? { session: databaseSession } : undefined,
            );
            const turns = [
                ...(conversation.turns ?? []),
                {
                    kind: "answer",
                    questionId: question.id,
                    slotCode: question.slotCode,
                    value,
                    at: resolvedAt,
                },
            ];
            const updated = await AiConsultationSession.updateOne(
                { _id: session._id, userId, __v: session.__v, isOpen: true },
                {
                    $set: {
                        conversation: {
                            ...conversation,
                            turns,
                            currentQuestion: null,
                        },
                        facts: {
                            ...(session.facts ?? {}),
                            [question.slotCode]: value,
                        },
                        currentJobId: reportJob._id,
                        // Mantém a referência apenas até o handler do relatório
                        // criar a revisão v2 sucessora e a substituir.
                        currentReviewId: review._id,
                        flowState: AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
                        revision,
                    },
                    $inc: { logicalOperations: 1, __v: 1 },
                },
                databaseSession ? { session: databaseSession } : undefined,
            );
            if (updated.modifiedCount !== 1) {
                throw new AppError(409, "A consulta mudou noutro pedido");
            }
            return reportJob;
        }

        if (session.flowState !== AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS) {
            throw new AppError(409, "A consulta não está a aguardar uma resposta");
        }
        const facts = { ...(session.facts ?? {}), [question.slotCode]: value };
        const turns = [
            ...(conversation.turns ?? []),
            {
                kind: "answer",
                questionId: question.id,
                slotCode: question.slotCode,
                value,
                at: new Date(),
            },
        ];
        const nextRevision = session.revision + 1;
        const { questionPlan, question: nextQuestion } = buildNextPlannedQuestion(
            session,
            conversation,
            facts,
            nextRevision,
        );
        const planSlots = getSessionPlanSlots(session, {
            ...conversation,
            questionPlan,
        }, facts);
        const remaining = planSlots.filter(
            (slot) => !Object.hasOwn(facts, slot.code),
        );
        const complete = remaining.length === 0;
        const missingSlotCodes = complete
            ? remaining.filter((slot) => slot.required).map((slot) => slot.code)
            : [];
        const nextTurns = nextQuestion
            ? [
                  ...turns,
                  { kind: "question", question: nextQuestion, at: new Date() },
              ]
            : turns;
        const updated = await AiConsultationSession.updateOne(
            { _id: session._id, userId, __v: session.__v, isOpen: true },
            {
                $set: {
                    facts,
                    conversation: {
                        ...conversation,
                        questionPlan,
                        turns: nextTurns,
                        currentQuestion: nextQuestion,
                        missingSlotCodes,
                    },
                    currentJobId: null,
                    flowState: complete
                        ? AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT
                        : AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                    revision: nextRevision,
                },
                $inc: { __v: 1 },
            },
            databaseSession ? { session: databaseSession } : undefined,
        );
        if (updated.modifiedCount !== 1) {
            throw new AppError(409, "A consulta mudou noutro pedido");
        }
    });
    const session = await findOwnedSession(userId, sessionId);
    return toPublicAiConsultationSession(session);
}

/**
 * Edita um facto já recolhido sem alterar o guião nem invalidar respostas
 * posteriores. A revisão da pergunta atual acompanha a revisão da sessão.
 */
export async function editAiConsultationAnswer(
    userId,
    sessionId,
    slotCode,
    input,
) {
    await runOptionalTransaction(async (databaseSession) => {
        const session = await findOwnedSession(userId, sessionId, databaseSession);
        if (
            !session.isOpen ||
            ![
                AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT,
                AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
            ].includes(session.flowState)
        ) {
            throw new AppError(409, "As respostas desta consulta já não podem ser alteradas");
        }
        if (session.revision !== input.revision) {
            throw new AppError(409, "A consulta mudou. Revê as respostas atuais.");
        }
        await findActiveConsent(userId, databaseSession);
        const conversation = getConversation(session);
        const questionPlan = getSessionQuestionPlan(session, conversation);
        const visiblePlanSlots = getSessionPlanSlots(
            session,
            { ...conversation, questionPlan },
            session.facts ?? {},
        );
        const slot = visiblePlanSlots.find(
            (candidate) => candidate.code === slotCode,
        );
        if (!slot || !Object.hasOwn(session.facts ?? {}, slotCode)) {
            throw new AppError(404, "Resposta não encontrada nesta consulta");
        }

        const value = normalizeAnswerForQuestion(
            buildCanonicalQuestion(slot, session.revision, "deterministic_plan"),
            input.value,
        );
        if (
            slotCode === "allergies_restrictions" &&
            value === PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE
        ) {
            assertConsultationRestrictionsCoveredByProfile(
                { allergies_restrictions: value },
                null,
            );
        }
        const revision = session.revision + 1;
        const facts = { ...(session.facts ?? {}), [slotCode]: value };
        if (
            slotCode === "makeup_regions" &&
            facts.makeup_plan_depth === "custom" &&
            Object.hasOwn(facts, "makeup_functions")
        ) {
            const retainedFunctions = resolveMakeupPlan(facts).functions;
            if (retainedFunctions.length > 0) {
                facts.makeup_functions = retainedFunctions;
            } else {
                delete facts.makeup_functions;
            }
        }
        const planSlots = getSessionPlanSlots(session, {
            ...conversation,
            questionPlan,
        }, facts);
        const currentSlot = planSlots.find(
            (candidate) =>
                candidate.code === conversation.currentQuestion?.slotCode &&
                !Object.hasOwn(facts, candidate.code),
        );
        const nextSlot = currentSlot ?? planSlots.find(
            (candidate) => !Object.hasOwn(facts, candidate.code),
        );
        const currentQuestion = nextSlot
            ? buildCanonicalQuestion(
                  nextSlot,
                  revision,
                  "deterministic_plan",
              )
            : null;
        const complete = planSlots.every((candidate) =>
            Object.hasOwn(facts, candidate.code),
        );
        const turns = [
            ...(conversation.turns ?? []),
            {
                kind: "answer",
                questionId: `edit:${revision}:${slotCode}`,
                slotCode,
                value,
                edited: true,
                at: new Date(),
            },
        ];
        const updated = await AiConsultationSession.updateOne(
            { _id: session._id, userId, __v: session.__v, isOpen: true },
            {
                $set: {
                    facts,
                    conversation: {
                        ...conversation,
                        questionPlan,
                        turns,
                        currentQuestion,
                        missingSlotCodes: [],
                    },
                    flowState: complete
                        ? AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT
                        : AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
                    ...(session.flowState === AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE
                        ? { currentJobId: null }
                        : {}),
                    revision,
                },
                $inc: { __v: 1 },
            },
            databaseSession ? { session: databaseSession } : undefined,
        );
        if (updated.modifiedCount !== 1) {
            throw new AppError(409, "A consulta mudou noutro pedido");
        }
    });
    return toPublicAiConsultationSession(
        await findOwnedSession(userId, sessionId),
    );
}

/** Enfileira geração de relatório; o handler pertence ao módulo de relatório. */
export async function submitAiConsultationSession(userId, sessionId) {
    assertOpenAiAvailable();
    const initial = await findOwnedSession(userId, sessionId);
    if (initial.flowState === AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT) {
        const replay = await getOperationReplay(
            initial,
            AI_JOB_TYPES.GENERATE_REPORT,
        );
        if (replay) return replay;
    }
    if (initial.reportId) return toPublicAiConsultationSession(initial);

    try {
        await runOptionalTransaction(async (databaseSession) => {
            const session = await findOwnedSession(
                userId,
                sessionId,
                databaseSession,
            );
            if (
                session.flowState ===
                AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT
            ) {
                const replay = await getOperationReplay(
                    session,
                    AI_JOB_TYPES.GENERATE_REPORT,
                );
                if (replay) return;
            }
            const conversation = getConversation(session);
            const answeredCount = getSessionPlanSlots(
                session,
                conversation,
                session.facts ?? {},
            ).filter((slot) =>
                Object.hasOwn(session.facts ?? {}, slot.code),
            ).length;
            if (
                !session.isOpen ||
                session.flowState !==
                    AI_CONSULTATION_FLOW_STATES.READY_FOR_REPORT ||
                answeredCount < AI_CONSULTATION_MIN_QUESTIONS
            ) {
                throw new AppError(
                    409,
                    "A consulta ainda não está pronta para relatório",
                );
            }
            assertOperationCapacity(session);
            await findActiveConsent(userId, databaseSession);
            let profileQuery = Profile.findOne({ userId });
            if (databaseSession) {
                profileQuery = profileQuery.session(databaseSession);
            }
            const profile = await profileQuery;
            if (!profile) {
                throw new AppError(
                    409,
                    "Completa o perfil antes de gerar o relatório.",
                    { code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED" },
                );
            }
            assertConsultationRestrictionsCoveredByProfile(
                session.facts,
                profile,
            );
            const revision = session.revision + 1;
            const job = await enqueueAiJob(
                {
                    type: AI_JOB_TYPES.GENERATE_REPORT,
                    userId,
                    consultationSessionId: session._id,
                    resourceType: "AiConsultationSession",
                    resourceId: session._id,
                    deduplicationKey: `generate_report:${session._id}:${revision}`,
                    // Evita multiplicar as tentativas internas do provider.
                    maxAttempts: 1,
                },
                { session: databaseSession },
            );
            const updated = await AiConsultationSession.updateOne(
                {
                    _id: session._id,
                    userId,
                    __v: session.__v,
                    isOpen: true,
                },
                {
                    $set: {
                        currentJobId: job._id,
                        flowState:
                            AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
                        submittedAt: new Date(),
                        revision,
                    },
                    $inc: { logicalOperations: 1, __v: 1 },
                },
                databaseSession ? { session: databaseSession } : undefined,
            );
            if (updated.modifiedCount !== 1) {
                throw new AppError(409, "A consulta mudou noutro pedido");
            }
        });
    } catch (error) {
        const current = await findOwnedSession(userId, sessionId);
        const replay = await getOperationReplay(
            current,
            AI_JOB_TYPES.GENERATE_REPORT,
        );
        if (replay) return replay;
        if (current.reportId) return toPublicAiConsultationSession(current);
        throw error;
    }
    return getAiConsultationSession(userId, sessionId);
}

/**
 * Reabre uma operação `failed_retryable` sem consumir uma nova quota lógica.
 * @param {string} userId - Titular autenticado.
 * @param {string} sessionId - Consulta própria.
 * @returns {Promise<object>} Sessão com a operação reativada.
 */
export async function retryAiConsultationOperation(userId, sessionId) {
    const session = await findOwnedSession(userId, sessionId);
    if (!session.isOpen || !session.currentJobId) {
        throw new AppError(409, "Não existe uma operação repetível");
    }
    await findActiveConsent(userId);
    const job = await AiJob.findOne({ _id: session.currentJobId, userId });
    if (
        !job ||
        ![
            AI_JOB_STATUSES.FAILED_RETRYABLE,
            AI_JOB_STATUSES.FAILED_TERMINAL,
        ].includes(job.status)
    ) {
        throw new AppError(409, "Não existe uma operação repetível");
    }
    await retryOwnedAiJob(userId, job._id);
    const flowStateByType = {
        [AI_JOB_TYPES.ANALYZE_PHOTOS]: AI_CONSULTATION_FLOW_STATES.ANALYZING,
        [AI_JOB_TYPES.SELECT_NEXT_QUESTION]: AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
        [AI_JOB_TYPES.GENERATE_REPORT]: AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
    };
    await AiConsultationSession.updateOne(
        { _id: session._id, userId, isOpen: true },
        { $set: { flowState: flowStateByType[job.type] ?? session.flowState } },
    );
    return getAiConsultationSession(userId, sessionId);
}

/**
 * Cancela atomicamente a consulta aberta e os jobs ainda ativos.
 * @param {string} userId - Titular autenticado.
 * @param {string} sessionId - Consulta própria.
 * @returns {Promise<object>} Estado terminal sanitizado.
 */
export async function cancelAiConsultationSession(userId, sessionId) {
    await runOptionalTransaction(async (databaseSession) => {
        const session = await findOwnedSession(userId, sessionId, databaseSession);
        if (!session.isOpen) return;
        await cancelAiJobsForUser(userId, {
            consultationSessionId: session._id,
            session: databaseSession,
        });
        const update = await AiConsultationSession.updateOne(
            { _id: session._id, userId, isOpen: true },
            {
                $set: {
                    isOpen: false,
                    status: AI_CONSULTATION_STATUS.CANCELLED,
                    flowState: AI_CONSULTATION_FLOW_STATES.CANCELLED,
                    cancelledAt: new Date(),
                    currentJobId: null,
                },
                $inc: { __v: 1 },
            },
            databaseSession ? { session: databaseSession } : undefined,
        );
        if (update.modifiedCount !== 1) throw new AppError(409, "A consulta mudou noutro pedido");
    });
    return getAiConsultationSession(userId, sessionId);
}

/** Handlers core para composição no worker do servidor. */
export function createCoreAiJobHandlers(options = {}) {
    return {
        [AI_JOB_TYPES.ANALYZE_PHOTOS]: (job, context = {}) =>
            handleAnalyzePhotosJob(job, { ...options, signal: context.signal }),
        [AI_JOB_TYPES.SELECT_NEXT_QUESTION]: (job, context = {}) =>
            handleSelectNextQuestionJob(job, {
                ...options,
                signal: context.signal,
            }),
    };
}
