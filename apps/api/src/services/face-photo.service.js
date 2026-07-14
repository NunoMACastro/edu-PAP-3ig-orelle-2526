/**
 * Service de consentimento e fotografias faciais.
 */
import { unlink } from "node:fs/promises";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../models/makeup-simulation.model.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../models/ai-job.model.js";
import { ReportPhotoGrant } from "../models/report-photo-grant.model.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../models/ai-consultation-session.model.js";
import { normalizeUploadedFacePhotos } from "./face-photo-normalization.service.js";
import {
    encryptFacePhotoFile,
    removeEncryptedFacePhotoFiles,
} from "./face-secure-storage.service.js";
import {
    enqueueFileDeletionJobs,
    processFileDeletionJobs,
} from "./file-deletion-job.service.js";
import {
    allowFaceDataWritesAfterConsent,
    blockFaceDataWritesForConsentRevocation,
    claimFaceDataWrite,
} from "./face-data-write-barrier.service.js";
import { assertAbortSignalActive } from "../utils/abort-signal.util.js";
import { cancelAiJobsForUser } from "./ai-job.service.js";

const FACE_PHOTO_REPLACEMENT_FILE_SOURCE = "face_photo_replacement";
const REPLACED_PHOTO_SIMULATION_ERROR = "SOURCE_PHOTO_REPLACED";

/**
 * Retira da operação normal todos os previews derivados do par substituído.
 *
 * Os bytes já publicados entram no mesmo outbox do par antigo, enquanto jobs
 * ainda ativos e documentos de simulação são cancelados na própria transação
 * da substituição. Assim, depois do commit, nenhum endpoint consegue voltar a
 * servir um output cuja fotografia de origem deixou de estar ativa.
 *
 * @param {object} input - Contexto transacional da substituição.
 * @param {unknown} input.userId - Titular das fotografias.
 * @param {unknown[]} input.photoIds - Fotografias que deixam de estar ativas.
 * @param {unknown} input.cleanupSourceId - Origem comum do outbox.
 * @param {import("mongoose").ClientSession} input.session - Transação ativa.
 * @param {Date} [input.now] - Instante comum de cancelamento.
 * @returns {Promise<void>} Conclui depois de preparar a limpeza durável.
 */
async function retireMakeupSimulationsForReplacedPhotos({
    userId,
    photoIds,
    cleanupSourceId,
    session,
    now = new Date(),
}) {
    if (!session || photoIds.length === 0) return;

    const simulations = await MakeupSimulation.find({
        userId,
        schemaVersion: { $gte: 2 },
        facePhotoId: { $in: photoIds },
    })
        .select("+outputStorageKey jobId")
        .session(session)
        .lean();
    if (simulations.length === 0) return;

    const simulationsWithOutput = simulations.filter(
        ({ outputStorageKey }) => Boolean(outputStorageKey),
    );
    await enqueueFileDeletionJobs(
        simulationsWithOutput.map((simulation) => ({
            sourceType: FACE_PHOTO_REPLACEMENT_FILE_SOURCE,
            sourceId: cleanupSourceId,
            ownerId: userId,
            storageKey: simulation.outputStorageKey,
        })),
        { session },
    );

    const simulationIds = simulations.map(({ _id }) => _id);
    const simulationIdStrings = simulationIds.map(String);
    const jobIds = simulations.map(({ jobId }) => jobId).filter(Boolean);
    await AiJob.updateMany(
        {
            userId,
            type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
            status: {
                $in: [
                    AI_JOB_STATUSES.QUEUED,
                    AI_JOB_STATUSES.PROCESSING,
                    AI_JOB_STATUSES.FAILED_RETRYABLE,
                ],
            },
            $or: [
                ...(jobIds.length > 0 ? [{ _id: { $in: jobIds } }] : []),
                {
                    resourceType: {
                        $in: ["makeup_simulation", "cosmetic_visualization"],
                    },
                    resourceId: { $in: simulationIdStrings },
                },
            ],
        },
        {
            $set: {
                status: AI_JOB_STATUSES.CANCELLED,
                cancelledAt: now,
                terminalAt: now,
                "lease.token": null,
                "lease.workerId": null,
                "lease.expiresAt": null,
            },
        },
        { session },
    );

    await MakeupSimulation.updateMany(
        {
            _id: { $in: simulationIds },
            userId,
            facePhotoId: { $in: photoIds },
        },
        {
            $set: {
                status: MAKEUP_SIMULATION_STATUSES.CANCELLED,
                safeErrorCode: REPLACED_PHOTO_SIMULATION_ERROR,
                failedAt: now,
                expiresAt: now,
            },
            $unset: {
                activeGenerationKey: "",
                outputStorageKey: "",
                outputEncryption: "",
                outputMimeType: "",
                outputSizeBytes: "",
            },
        },
        { session },
    );
}

function assertSensitiveFaceStorageConfigured() {
    if (
        env.nodeEnv !== "test" &&
        String(env.dataEncryptionKey ?? "").trim().length < 32
    ) {
        throw new AppError(
            503,
            "A cifra dos dados faciais não está configurada.",
            { code: "SENSITIVE_STORAGE_NOT_CONFIGURED" },
        );
    }
}

/**
 * Converte uma fotografia facial para resposta segura.
 *
 * @function toFacePhotoResponse
 * @param {object} photo - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, kind: string, originalName: string, mimeType: string, sizeBytes: number, status: string, createdAt: Date|undefined}} Metadados publicos.
 */
function toFacePhotoResponse(photo) {
    return {
        id: photo._id.toString(),
        kind: photo.kind,
        originalName: photo.originalName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        quality: photo.quality ?? null,
        status: photo.status,
        createdAt: photo.createdAt,
    };
}

/**
 * Converte um consentimento facial para o contrato publico minimo.
 *
 * O DTO omite deliberadamente o identificador do documento e o `userId`: o
 * endpoint autenticado representa sempre o titular da sessao, pelo que esses
 * campos nao acrescentam informacao funcional e aumentariam a exposicao de
 * metadados internos.
 *
 * @function toFaceConsentResponse
 * @param {object|null|undefined} consent - Documento Mongoose ou mock equivalente.
 * @returns {{status: "active"|"revoked", version: string, purpose: string, acceptedAt: Date, revokedAt: Date|null}|null} Consentimento seguro ou null.
 */
function toFaceConsentResponse(consent) {
    if (!consent) return null;

    return {
        status: consent.revokedAt ? "revoked" : "active",
        version: consent.version,
        purpose: consent.purpose,
        acceptedAt: consent.acceptedAt,
        revokedAt: consent.revokedAt ?? null,
        externalProviderConsent: consent.externalProviderConsent
            ? {
                  status: consent.externalProviderConsent.revokedAt
                      ? "revoked"
                      : "active",
                  provider: consent.externalProviderConsent.provider,
                  noticeVersion:
                      consent.externalProviderConsent.noticeVersion,
                  acceptedAt: consent.externalProviderConsent.acceptedAt,
                  revokedAt:
                      consent.externalProviderConsent.revokedAt ?? null,
              }
            : null,
        purposes: {
            openAiAnalysis: consent.purposes?.openAiAnalysis === true,
            generativeEdit: consent.purposes?.generativeEdit === true,
            consultantPhotoAccess:
                consent.purposes?.consultantPhotoAccess === true,
        },
    };
}

/**
 * Expõe apenas a decisão necessária para a UI pedir consentimento específico.
 *
 * @function getFaceProviderConsentRequirement
 * @returns {{required: boolean, provider: string|null, noticeVersion: string|null}} Requisito público sem configuração sensível.
 */
export function getFaceProviderConsentRequirement() {
    return {
        required: true,
        provider: "openai",
        noticeVersion: env.openAiNoticeVersion,
        consentVersion: "face-analysis-v2",
    };
}

/**
 * Valida que a decisão explícita corresponde ao provider configurado.
 *
 * @function buildExternalProviderConsent
 * @param {object} input - Input normalizado pelo validator.
 * @param {Date} acceptedAt - Instante comum da decisão.
 * @returns {object|null} Subdocumento específico ou `null` sem aceitação.
 * @throws {AppError} Quando um modo real não tem consentimento exato.
 */
function buildExternalProviderConsent(input, acceptedAt) {
    const requirement = getFaceProviderConsentRequirement();
    if (
        input.providerConsentAccepted !== true ||
        input.provider !== requirement.provider ||
        input.noticeVersion !== requirement.noticeVersion
    ) {
        throw new AppError(
            400,
            "Consentimento específico do provider de IA obrigatório",
        );
    }

    return {
        provider: requirement.provider,
        noticeVersion: requirement.noticeVersion,
        acceptedAt,
        revokedAt: null,
    };
}

/**
 * Garante que o consentimento ativo autoriza o modo real configurado.
 *
 * @function assertFaceConsentAllowsConfiguredProvider
 * @param {object} consent - Consentimento facial encontrado para o titular.
 * @returns {void}
 * @throws {AppError} Quando o consentimento real está ausente, revogado ou desatualizado.
 */
export function assertFaceConsentAllowsConfiguredProvider(consent) {
    const requirement = getFaceProviderConsentRequirement();
    const providerConsent = consent?.externalProviderConsent;
    if (
        consent?.version !== "face-analysis-v2" ||
        consent?.purposes?.openAiAnalysis !== true ||
        !providerConsent ||
        providerConsent.revokedAt ||
        providerConsent.provider !== requirement.provider ||
        providerConsent.noticeVersion !== requirement.noticeVersion
    ) {
        throw new AppError(
            403,
            "Consentimento específico do provider de IA em falta",
        );
    }
}

/**
 * Remove ficheiros recem-recebidos quando a persistencia falha.
 *
 * @async
 * @function removeUploadedFiles
 * @param {{file?: {path?: string}}[]} uploadedFiles - Ficheiros a limpar.
 * @returns {Promise<void>} Conclui mesmo que algum ficheiro ja nao exista.
 */
export async function removeUploadedFiles(uploadedFiles = []) {
    await Promise.all(
        uploadedFiles.map(({ file }) => {
            if (!file?.path) return undefined;
            return unlink(file.path).catch(() => undefined);
        }),
    );
}

/**
 * Indica se a ligacao ativa suporta a transacao exigida para trocar o par.
 *
 * Em testes unitarios sem MongoDB, o service usa a via compensatoria para
 * permitir mocks focais. Num runtime ligado, um standalone e recusado: fazer
 * `inativar antigo -> inserir novo` sem transacao poderia deixar zero ou quatro
 * fotografias ativas sob concorrencia.
 *
 * @function createFacePhotoSession
 * @returns {Promise<import("mongoose").ClientSession|null>} Sessao transacional ou null em teste isolado.
 * @throws {AppError} Quando o MongoDB ligado nao suporta transacoes.
 */
async function createFacePhotoSession() {
    if (mongoose.connection.readyState !== 1) return null;

    const topologyType =
        mongoose.connection?.client?.topology?.description?.type ?? "";
    const transactionTopologies = new Set([
        "ReplicaSetWithPrimary",
        "Sharded",
        "LoadBalanced",
    ]);

    if (!transactionTopologies.has(topologyType)) {
        throw new AppError(
            503,
            "Upload facial requer MongoDB com suporte transacional",
        );
    }

    return mongoose.startSession();
}

/**
 * Carrega todas as fotografias ativas com os metadados privados necessarios
 * para apagar fisicamente o par substituido.
 *
 * @async
 * @function findActiveFacePhotos
 * @param {string} userId - Proprietario autenticado.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<object[]>} Fotografias ativas, incluindo storage privado.
 */
async function findActiveFacePhotos(userId, session) {
    let query = FacePhoto.find({ userId, status: "active" }).select(
        "+storageKey +encryption",
    );
    if (session) query = query.session(session);
    return query;
}

/**
 * Persiste exatamente um novo documento por tipo e inativa todos os ativos
 * anteriores na mesma transacao.
 *
 * @async
 * @function replaceActiveFacePhotos
 * @param {object} input - Dados completos da substituicao.
 * @param {string} input.userId - Proprietario autenticado.
 * @param {object} input.consent - Consentimento ativo.
 * @param {{kind: string, file: object}[]} input.normalizedFiles - Par WebP normalizado.
 * @param {{storageKey: string, encryption: object}[]} input.encryptedFiles - Par cifrado.
 * @param {import("mongoose").ClientSession|null} input.session - Sessao transacional opcional.
 * @returns {Promise<{photos: object[], previousFiles: object[], cleanupSourceId: string|null}>} Novos documentos e cleanup durável.
 */
async function replaceActiveFacePhotos({
    userId,
    consent,
    normalizedFiles,
    encryptedFiles,
    session,
    afterWriteBarrier,
    signal,
}) {
    assertAbortSignalActive(signal, "Upload facial cancelado.");
    let effectiveConsent = consent;
    if (session) {
        await claimFaceDataWrite(userId, session);
        assertAbortSignalActive(signal, "Upload facial cancelado.");
        effectiveConsent = await FaceConsent.findOne({
            userId,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            revokedAt: null,
        }).session(session);
        if (!effectiveConsent) {
            throw new AppError(403, "Consentimento facial em falta");
        }
        if (afterWriteBarrier) await afterWriteBarrier(session);
        assertAbortSignalActive(signal, "Upload facial cancelado.");
    }

    const activePhotos = await findActiveFacePhotos(userId, session);
    assertAbortSignalActive(signal, "Upload facial cancelado.");
    const activePhotoIds = activePhotos.map((photo) => photo._id);
    const sessionOptions = session ? { session } : undefined;
    const openConsultation = session
        ? await AiConsultationSession.findOne({ userId, isOpen: true }).session(
              session,
          )
        : null;
    if (
        openConsultation &&
        openConsultation.flowState !==
            AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS
    ) {
        throw new AppError(
            409,
            "Cancela ou conclui a consulta atual antes de substituir as fotografias.",
            { code: "ACTIVE_CONSULTATION_PHOTO_REPLACEMENT_FORBIDDEN" },
        );
    }

    if (activePhotoIds.length > 0) {
        const filter = {
            _id: { $in: activePhotoIds },
            userId,
            status: "active",
        };
        const update = { $set: { status: "deleted" } };

        if (sessionOptions) {
            await FacePhoto.updateMany(filter, update, sessionOptions);
        } else {
            await FacePhoto.updateMany(filter, update);
        }
        assertAbortSignalActive(signal, "Upload facial cancelado.");
    }

    try {
        const documents = normalizedFiles.map(({ kind, file }, index) => ({
            _id: encryptedFiles[index].photoId,
            userId,
            kind,
            storageKey: encryptedFiles[index].storageKey,
            encryption: encryptedFiles[index].encryption,
            originalName: `${kind}.webp`,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            quality: file.quality,
            consentId: effectiveConsent._id,
        }));
        const photos = sessionOptions
            ? await FacePhoto.insertMany(documents, sessionOptions)
            : await FacePhoto.insertMany(documents);
        assertAbortSignalActive(signal, "Upload facial cancelado.");
        if (openConsultation) {
            await cancelAiJobsForUser(userId, {
                consultationSessionId: openConsultation._id,
                session,
            });
            const reset = await AiConsultationSession.updateOne(
                {
                    _id: openConsultation._id,
                    userId,
                    isOpen: true,
                    __v: openConsultation.__v,
                    flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
                },
                {
                    $set: {
                        analysisId: null,
                        reportId: null,
                        photoIds: photos.map(({ _id }) => _id),
                        consentId: effectiveConsent._id,
                        currentJobId: null,
                        currentReviewId: null,
                        photoQualityAcknowledgement: {
                            photoSetHash: null,
                            acknowledgedAt: null,
                        },
                        conversation: {
                            turns: [],
                            currentQuestion: null,
                            missingSlotCodes: [],
                        },
                        facts: {},
                        answers: [],
                    },
                    $inc: { revision: 1, __v: 1 },
                },
                { session },
            );
            if (reset.modifiedCount !== 1) {
                throw new AppError(
                    409,
                    "A consulta mudou durante a substituição das fotografias.",
                );
            }
        }
        const cleanupSourceId =
            session && activePhotos.length > 0
                ? photos[0]._id.toString()
                : null;

        if (cleanupSourceId) {
            await enqueueFileDeletionJobs(
                activePhotos.map((photo) => ({
                    sourceType: FACE_PHOTO_REPLACEMENT_FILE_SOURCE,
                    sourceId: cleanupSourceId,
                    ownerId: userId,
                    storageKey: photo.storageKey,
                })),
                { session },
            );
            await retireMakeupSimulationsForReplacedPhotos({
                userId,
                photoIds: activePhotoIds,
                cleanupSourceId,
                session,
            });
            assertAbortSignalActive(signal, "Upload facial cancelado.");
        }

        return {
            photos,
            previousFiles: activePhotos.map((photo) => ({
                storageKey: photo.storageKey,
            })),
            cleanupSourceId,
        };
    } catch (error) {
        // Esta compensacao serve apenas a execucao unitária sem ligacao. Em
        // runtime, `withTransaction` faz rollback deste update automaticamente.
        if (!session && activePhotoIds.length > 0) {
            await FacePhoto.updateMany(
                { _id: { $in: activePhotoIds }, userId, status: "deleted" },
                { $set: { status: "active" } },
            ).catch(() => undefined);
        }
        throw error;
    }
}

/**
 * Executa a troca do par numa transacao quando existe ligacao MongoDB real.
 *
 * @async
 * @function persistFacePhotoReplacement
 * @param {object} input - Dados validados e cifrados da troca.
 * @returns {Promise<{photos: object[], previousFiles: object[], cleanupSourceId: string|null}>} Resultado persistido.
 */
async function persistFacePhotoReplacement(input) {
    assertAbortSignalActive(input.signal, "Upload facial cancelado.");
    const session = await createFacePhotoSession();
    if (!session) return replaceActiveFacePhotos({ ...input, session: null });

    try {
        let result;
        await session.withTransaction(async () => {
            result = await replaceActiveFacePhotos({ ...input, session });
            assertAbortSignalActive(input.signal, "Upload facial cancelado.");
        });
        return result;
    } finally {
        await session.endSession();
    }
}

/**
 * Executa uma alteração de consentimento na mesma topologia transacional
 * exigida pelos uploads faciais. A via sem sessão existe apenas para fixtures
 * unitárias sem MongoDB ligado.
 *
 * @param {(session: import("mongoose").ClientSession|null) => Promise<unknown>} handler - Mutação a executar.
 * @returns {Promise<unknown>} Resultado da mutação.
 */
async function runFaceConsentMutation(handler) {
    const session = await createFacePhotoSession();
    if (!session) return handler(null);

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

/**
 * Aceita ou renova consentimento facial do utilizador.
 *
 * @async
 * @function acceptFaceConsent
 * @param {string} userId - Utilizador autenticado.
 * @param {{version: string}} input - Consentimento validado.
 * @returns {Promise<object>} Consentimento seguro.
 */
export async function acceptFaceConsent(userId, input) {
    assertSensitiveFaceStorageConfigured();
    const acceptedAt = new Date();
    const externalProviderConsent = buildExternalProviderConsent(
        input,
        acceptedAt,
    );
    const consent = await runFaceConsentMutation(async (session) => {
        if (session) await allowFaceDataWritesAfterConsent(userId, session);

        const options = {
            upsert: true,
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        };
        return FaceConsent.findOneAndUpdate(
            { userId },
            {
                $set: {
                    version: input.version,
                    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    acceptedAt,
                    revokedAt: null,
                    externalProviderConsent,
                    purposes: {
                        openAiAnalysis: true,
                        generativeEdit: input.generativeEditAccepted === true,
                        consultantPhotoAccess:
                            input.consultantPhotoAccessAccepted === true,
                    },
                },
            },
            options,
        );
    });

    return toFaceConsentResponse(consent);
}

/**
 * Consulta o estado atual do consentimento facial do titular autenticado.
 *
 * A pesquisa inclui consentimentos revogados para que a revogacao nao apague
 * o historial da decisao nem seja confundida com uma aceitacao inexistente.
 *
 * @async
 * @function getFaceConsentForUser
 * @param {string} userId - Titular autenticado.
 * @returns {Promise<object|null>} DTO seguro ou null quando nunca houve consentimento.
 */
export async function getFaceConsentForUser(userId) {
    const consent = await FaceConsent.findOne({
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    });

    return toFaceConsentResponse(consent);
}

/**
 * Revoga idempotentemente o consentimento facial do titular autenticado.
 *
 * O compare-and-set altera apenas um consentimento ainda ativo. Num replay, a
 * segunda leitura devolve o documento ja revogado e preserva o `revokedAt`
 * original em vez de criar uma nova decisao aparente.
 *
 * @async
 * @function revokeFaceConsentForUser
 * @param {string} userId - Titular autenticado.
 * @returns {Promise<object|null>} DTO revogado ou null quando nunca houve consentimento.
 */
export async function revokeFaceConsentForUser(userId) {
    const revokedAt = new Date();
    const consent = await runFaceConsentMutation(async (session) => {
        const currentQuery = FaceConsent.findOne({
            userId,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        });
        const current = session
            ? await currentQuery.session(session)
            : await currentQuery;
        if (!current || current.revokedAt) return current;

        if (session) {
            await blockFaceDataWritesForConsentRevocation(userId, {
                session,
                at: revokedAt,
            });
            await cancelAiJobsForUser(userId, { session, now: revokedAt });
            await ReportPhotoGrant.updateMany(
                { clientUserId: userId, status: "active" },
                {
                    $set: {
                        status: "revoked",
                        revokedAt,
                        revocationReason: "face_consent_revoked",
                    },
                },
                { session },
            );
            await MakeupSimulation.updateMany(
                {
                    userId,
                    schemaVersion: { $gte: 2 },
                    status: { $in: ["queued", "processing", "failed_retryable"] },
                },
                {
                    $set: { status: "cancelled", failedAt: revokedAt },
                    $unset: { activeGenerationKey: "" },
                },
                { session },
            );
        }

        const revokedConsent = await FaceConsent.findOneAndUpdate(
            {
                userId,
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
            },
            [
                {
                    $set: {
                        revokedAt,
                        externalProviderConsent: {
                            $cond: [
                                { $ne: ["$externalProviderConsent", null] },
                                {
                                    $mergeObjects: [
                                        "$externalProviderConsent",
                                        { revokedAt },
                                    ],
                                },
                                null,
                            ],
                        },
                    },
                },
            ],
            {
                new: true,
                runValidators: true,
                ...(session ? { session } : {}),
            },
        );

        if (revokedConsent) return revokedConsent;
        const replayQuery = FaceConsent.findOne({
            userId,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        });
        return session ? replayQuery.session(session) : replayQuery;
    });

    return toFaceConsentResponse(consent);
}

/**
 * Guarda metadados de fotografias faciais com ownership da sessao.
 *
 * @async
 * @function saveFacePhotos
 * @param {string} userId - Utilizador autenticado.
 * @param {{kind: string, file: object}[]} uploadedFiles - Temporarios validados pelo boundary Busboy.
 * @param {object|undefined} activeConsent - Consentimento ja confirmado na rota.
 * @param {{fileDeletionProcessor?: Function, afterWriteBarrier?: Function, signal?: AbortSignal}} [options] - Cancelamento e adaptadores estritamente internos de teste.
 * @returns {Promise<object[]>} Fotografias seguras.
 * @throws {AppError} Quando falta consentimento ativo ou algum ficheiro e invalido.
 */
export async function saveFacePhotos(
    userId,
    uploadedFiles,
    activeConsent,
    {
        fileDeletionProcessor = processFileDeletionJobs,
        afterWriteBarrier,
        signal,
    } = {},
) {
    assertSensitiveFaceStorageConfigured();
    const encryptedFiles = [];
    let normalizedFiles = [];
    let persistenceCommitted = false;

    try {
        assertAbortSignalActive(signal, "Upload facial cancelado.");
        const consent =
            activeConsent ??
            (await FaceConsent.findOne({
                userId,
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
            }));

        if (!consent) {
            throw new AppError(403, "Consentimento facial em falta");
        }
        assertAbortSignalActive(signal, "Upload facial cancelado.");

        normalizedFiles = await normalizeUploadedFacePhotos(uploadedFiles, {
            signal,
        });

        for (const { kind, file } of normalizedFiles) {
            assertAbortSignalActive(signal, "Upload facial cancelado.");
            const photoId = new mongoose.Types.ObjectId();
            encryptedFiles.push({
                photoId,
                ...(await encryptFacePhotoFile(file, {
                    userId,
                    photoId,
                    kind,
                }, { signal })),
            });
        }
        assertAbortSignalActive(signal, "Upload facial cancelado.");

        const { photos, previousFiles, cleanupSourceId } = await persistFacePhotoReplacement({
            userId,
            consent,
            normalizedFiles,
            encryptedFiles,
            afterWriteBarrier,
            signal,
        });
        persistenceCommitted = true;

        if (cleanupSourceId) {
            // A falha operacional ocorre depois do commit: nunca se apaga o
            // novo par nem se finge rollback. O outbox fica disponível para retry.
            await fileDeletionProcessor({
                sourceType: FACE_PHOTO_REPLACEMENT_FILE_SOURCE,
                sourceId: cleanupSourceId,
            }).catch(() => undefined);
        } else {
            // Via compensatória exclusiva de testes unitários sem Mongo ligado.
            await removeEncryptedFacePhotoFiles(previousFiles);
        }

        return photos.map(toFacePhotoResponse);
    } catch (err) {
        if (!persistenceCommitted) {
            await removeUploadedFiles(uploadedFiles);
            await removeUploadedFiles(normalizedFiles);
            await removeEncryptedFacePhotoFiles(encryptedFiles);
        }
        throw err;
    }
}
