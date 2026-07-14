/**
 * Serviço canónico dos pedidos de privacidade sobre dados faciais.
 *
 * A aprovação usa compare-and-set, lease e uma transação MongoDB para retirar
 * os recursos da operação normal e criar o outbox de ficheiros. O estado
 * `completed` só é gravado depois de o filesystem confirmar a ausência dos
 * bytes e de os documentos pessoais terem sido removidos.
 */
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
} from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import { AiConsultationAuditLog } from "../models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../models/ai-consultation-session.model.js";
import { AiInteractionHistory } from "../models/ai-interaction-history.model.js";
import { AiJob } from "../models/ai-job.model.js";
import { BeforeAfterVisualization } from "../models/before-after-visualization.model.js";
import { BiometricDataRequest } from "../models/biometric-data-request.model.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { MakeupSimulationQuota } from "../models/makeup-simulation-quota.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";
import { ReportPhotoGrant } from "../models/report-photo-grant.model.js";
import { ReportUnlock } from "../models/report-unlock.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    BIOMETRIC_AUDIT_RESULTS,
    recordBiometricAccess,
} from "./biometric-audit.service.js";
import {
    areFileDeletionJobsCompleted,
    enqueueFileDeletionJobs,
    processFileDeletionJobs,
    reclaimFileDeletionJobsForOwner,
} from "./file-deletion-job.service.js";
import {
    blockFaceDataWritesForPrivacy,
    releaseResolvedPrivacyBarrier,
} from "./face-data-write-barrier.service.js";
import { cancelAiJobsForUser } from "./ai-job.service.js";

export const PRIVACY_FILE_DELETION_SOURCE = "privacy_request";

const REQUEST_LEASE_MS = 5 * 60 * 1000;
const RECOVERABLE_DECISION_ERROR =
    "Falha operacional ao aplicar pedido de privacidade. Pode ser reprocessado.";

/**
 * Coleções pessoais que compõem o grafo de consulta/relatório v2.
 *
 * A ordem evita referências úteis depois de o relatório raiz desaparecer.
 * `MakeupSimulation` é tratada separadamente porque os respetivos ficheiros
 * precisam de entrar primeiro no outbox físico.
 */
const REPORT_DERIVED_USER_MODELS = Object.freeze([
    AiInteractionHistory,
    BeforeAfterVisualization,
    DailyRoutine,
    ProductRecommendation,
    ReportUnlock,
    SkinComparison,
    MakeupSimulationQuota,
    AiJob,
    AiConsultationSession,
    FaceAnalysis,
    FaceReport,
    AiConsultationReview,
]);

/**
 * Converte um ID para texto sem expor o documento associado.
 *
 * @function idToString
 * @param {unknown} value - ObjectId ou string.
 * @returns {string|null} ID textual ou null.
 */
function idToString(value) {
    return value ? value.toString() : null;
}

/** Indica se o pedido pode invalidar uma análise/consulta facial em curso. */
function affectsFaceProcessing(resources = []) {
    return (
        resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS) ||
        resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)
    );
}

/**
 * Converte o pedido para um DTO sem lease token, paths ou dados faciais.
 *
 * @function toPrivacyRequestResponse
 * @param {object} request - Documento Mongoose ou objeto equivalente.
 * @returns {object} Metadados seguros do workflow.
 */
export function toPrivacyRequestResponse(request) {
    return {
        id: idToString(request._id),
        requesterId: idToString(request.requesterId),
        scope: request.scope ?? "biometric",
        action: request.action,
        resources: request.resources,
        reason: request.reason ?? "",
        status: request.status,
        attempts: Number(request.attempts ?? 0),
        reviewerId: idToString(request.reviewerId),
        decisionReason: request.decisionReason ?? "",
        decisionError: request.decisionError ?? "",
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt ?? null,
        lastAttemptAt: request.lastAttemptAt ?? null,
        leaseExpiresAt: request.lease?.expiresAt ?? null,
        completedAt: request.completedAt ?? null,
    };
}

/**
 * Confirma que o runtime tem um replica set pronto para a operação atómica.
 *
 * @function assertTransactionalRuntime
 * @returns {void}
 * @throws {AppError} Em MongoDB standalone ou sem ligação pronta.
 */
function assertTransactionalRuntime() {
    const topologyType =
        mongoose.connection?.client?.topology?.description?.type ?? "";

    if (
        mongoose.connection.readyState !== 1 ||
        topologyType === "Single" ||
        topologyType === "Unknown"
    ) {
        throw new AppError(
            503,
            "Processamento de privacidade temporariamente indisponível.",
        );
    }
}

/**
 * Executa trabalho numa transação MongoDB obrigatória.
 *
 * @async
 * @function runPrivacyTransaction
 * @template T
 * @param {(session: import("mongoose").ClientSession) => Promise<T>} handler - Trabalho atómico.
 * @returns {Promise<T>} Resultado da transação.
 */
async function runPrivacyTransaction(handler) {
    assertTransactionalRuntime();
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

/**
 * Cria um pedido sempre associado ao cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequest
 * @param {string} userId - Titular autenticado.
 * @param {{action: string, resources: string[], reason: string}} input - Dados validados.
 * @returns {Promise<object>} Pedido criado.
 */
export async function createMyBiometricDataRequest(userId, input) {
    const document = {
        requesterId: userId,
        scope: "biometric",
        action: input.action,
        resources: input.resources,
        reason: input.reason,
    };
    let request;

    if (mongoose.connection.readyState !== 1) {
        // Fixtures unitárias sem persistência conservam o boundary simples. O
        // runtime ligado nunca pode criar um pedido fora da write barrier.
        request = await BiometricDataRequest.create(document);
    } else {
        request = await runPrivacyTransaction(async (session) => {
            if (affectsFaceProcessing(input.resources)) {
                await blockFaceDataWritesForPrivacy(userId, {
                    session,
                    at: new Date(),
                    requireActive: true,
                });
            }
            const [created] = await BiometricDataRequest.create([document], {
                session,
            });
            return created;
        });
    }

    return toPrivacyRequestResponse(request);
}

/**
 * Lista apenas os pedidos do titular autenticado.
 *
 * @async
 * @function listMyBiometricDataRequests
 * @param {string} userId - Titular autenticado.
 * @returns {Promise<object[]>} Histórico minimizado do próprio cliente.
 */
export async function listMyBiometricDataRequests(userId) {
    const requests = await BiometricDataRequest.find({ requesterId: userId })
        .sort({ createdAt: -1 })
        .limit(100);

    return requests.map(toPrivacyRequestResponse);
}

/**
 * Lista metadados para revisão e regista a leitura administrativa.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @param {{id: string, role: string}} actor - Revisor autenticado.
 * @returns {Promise<object[]>} Pedidos mais recentes.
 */
export async function listBiometricDataRequestsForReview(actor) {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.LIST_REQUESTS,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
        reason: "Listagem de pedidos de privacidade para revisão.",
    });

    return requests.map(toPrivacyRequestResponse);
}

/**
 * Regista uma decisão sem incluir conteúdo ou falhas internas.
 *
 * @async
 * @function recordDecisionAudit
 * @param {{id: string, role: string}} actor - Revisor.
 * @param {object|null} request - Pedido afetado.
 * @param {{resourceId: string, result: string, reason: string}} event - Resultado seguro.
 * @param {{session?: import("mongoose").ClientSession|null}} [options] - Sessão da decisão auditada.
 * @returns {Promise<void>} Conclui após o log append-only.
 */
async function recordDecisionAudit(
    actor,
    request,
    event,
    { session = null } = {},
) {
    await recordBiometricAccess(
        {
            actorId: actor.id,
            actorRole: actor.role,
            subjectUserId: idToString(request?.requesterId),
            action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
            resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
            resourceId: event.resourceId,
            result: event.result,
            reason: event.reason,
        },
        { session },
    );
}

/**
 * Obtém um pedido apenas para distinguir 404 de conflito de estado.
 *
 * @async
 * @function loadRequestOrThrow
 * @param {string} requestId - ID já validado.
 * @returns {Promise<object>} Pedido existente.
 */
async function loadRequestOrThrow(requestId) {
    const request = await BiometricDataRequest.findById(requestId);
    if (!request) throw new AppError(404, "Pedido não encontrado.");
    return request;
}

/**
 * Rejeita uma única vez através de compare-and-set.
 *
 * @async
 * @function rejectPrivacyRequest
 * @param {string} requestId - Pedido pendente.
 * @param {{id: string}} actor - Revisor.
 * @param {{decisionReason: string}} input - Justificação validada.
 * @returns {Promise<object>} Pedido rejeitado.
 */
async function rejectPrivacyRequest(requestId, actor, input) {
    const now = new Date();
    const applyRejection = async (session = null) => {
        const candidateQuery = BiometricDataRequest.findById(requestId).select(
            "requesterId resources",
        );
        const candidate = session
            ? await candidateQuery.session(session)
            : await candidateQuery;
        if (!candidate) return null;
        const request = await BiometricDataRequest.findOneAndUpdate(
            {
                _id: requestId,
                requesterId: candidate.requesterId,
                status: BIOMETRIC_REQUEST_STATUSES.PENDING,
            },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.REJECTED,
                    reviewerId: actor.id,
                    decisionReason: input.decisionReason,
                    reviewedAt: now,
                    completedAt: null,
                    erasureVerifiedAt: null,
                    decisionError: "",
                    "lease.token": null,
                    "lease.expiresAt": null,
                },
            },
            { new: true, ...(session ? { session } : {}) },
        );

        if (
            request &&
            session &&
            affectsFaceProcessing(request.resources)
        ) {
            await releaseResolvedPrivacyBarrier(request.requesterId, {
                session,
                excludeRequestId: request._id,
            });
        }

        if (request) {
            await recordDecisionAudit(
                actor,
                request,
                {
                    resourceId: idToString(request._id) ?? requestId,
                    result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                    reason: "Pedido de privacidade rejeitado por revisor autorizado.",
                },
                { session },
            );
        }
        return request;
    };
    const request =
        mongoose.connection.readyState === 1
            ? await runPrivacyTransaction(applyRejection)
            : await applyRejection();

    if (request) return request;
    await loadRequestOrThrow(requestId);
    throw new AppError(409, "Pedido já foi decidido.");
}

/**
 * Constrói o filtro CAS para aprovação inicial ou retry explícito.
 *
 * @function buildClaimFilter
 * @param {string} requestId - Pedido a reclamar.
 * @param {boolean} retry - Indica reprocessamento.
 * @param {Date} now - Instante comum ao lease.
 * @returns {object} Filtro atómico.
 */
function buildClaimFilter(requestId, requesterId, retry, now) {
    if (!retry) {
        return {
            _id: requestId,
            requesterId,
            status: BIOMETRIC_REQUEST_STATUSES.PENDING,
        };
    }

    return {
        _id: requestId,
        requesterId,
        $or: [
            { status: BIOMETRIC_REQUEST_STATUSES.FAILED },
            {
                // Pedidos `completed` anteriores ao outbox não provam que os
                // bytes desapareceram. Um retry explícito pode recuperá-los;
                // a migração 004 deverá também identificá-los em lote.
                status: BIOMETRIC_REQUEST_STATUSES.COMPLETED,
                erasureVerifiedAt: null,
            },
            {
                status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
                "lease.expiresAt": { $lte: now },
            },
        ],
    };
}

/**
 * Retira simulações e previews derivados antes de eliminar as respetivas
 * referências MongoDB. Os bytes cifrados são sempre copiados para o outbox na
 * mesma transação; se faltar metadata necessária, a operação inteira reverte.
 *
 * @param {object} request - Pedido já reclamado.
 * @param {import("mongoose").ClientSession} session - Transação ativa.
 * @returns {Promise<void>}
 */
async function prepareMakeupSimulationErasure(request, session) {
    const simulations = await MakeupSimulation.find({
        userId: request.requesterId,
    })
        .select("+outputStorageKey jobId")
        .session(session)
        .lean();
    const simulationsWithOutput = simulations.filter(
        ({ outputStorageKey }) => Boolean(outputStorageKey),
    );

    await enqueueFileDeletionJobs(
        simulationsWithOutput.map((simulation) => ({
            sourceType: PRIVACY_FILE_DELETION_SOURCE,
            sourceId: request._id,
            ownerId: request.requesterId,
            storageKey: simulation.outputStorageKey,
        })),
        { session },
    );

    const simulationIds = simulations.map(({ _id }) => _id);
    if (simulationIds.length > 0) {
        await BeforeAfterVisualization.deleteMany(
            { simulationId: { $in: simulationIds } },
            { session },
        );
    }

    const simulationJobIds = simulations
        .map(({ jobId }) => jobId)
        .filter(Boolean);
    await AiJob.deleteMany(
        {
            userId: request.requesterId,
            $or: [
                { type: "generate_makeup_preview" },
                ...(simulationJobIds.length > 0
                    ? [{ _id: { $in: simulationJobIds } }]
                    : []),
            ],
        },
        { session },
    );
    await MakeupSimulation.deleteMany(
        { userId: request.requesterId },
        { session },
    );
    await MakeupSimulationQuota.deleteMany(
        { userId: request.requesterId },
        { session },
    );
}

/**
 * Elimina o grafo pessoal da consulta OpenAI quando o pedido abrange
 * relatórios. `delete` e `anonymize` têm a mesma semântica porque o runtime não
 * conserva um agregado demonstravelmente anónimo destes dados cosméticos.
 *
 * @param {object} request - Pedido já reclamado.
 * @param {import("mongoose").ClientSession} session - Transação ativa.
 * @returns {Promise<void>}
 */
async function deleteConsultationReportGraph(request, session) {
    const reviews = await AiConsultationReview.find({
        userId: request.requesterId,
    })
        .select("_id")
        .session(session)
        .lean();
    const reviewIds = reviews.map(({ _id }) => _id);

    if (reviewIds.length > 0) {
        await AiConsultationAuditLog.deleteMany(
            { reviewId: { $in: reviewIds } },
            { session },
        );
    }
    await ReportPhotoGrant.deleteMany(
        { clientUserId: request.requesterId },
        { session },
    );
    await RecommendationReview.deleteMany(
        { clientUserId: request.requesterId },
        { session },
    );

    for (const model of REPORT_DERIVED_USER_MODELS) {
        await model.deleteMany({ userId: request.requesterId }, { session });
    }
}

/**
 * Reclama o pedido e prepara eliminação de documentos/outbox na mesma transação.
 *
 * @async
 * @function claimAndPreparePrivacyRequest
 * @param {string} requestId - Pedido a processar.
 * @param {{id: string}} actor - Revisor.
 * @param {{decisionReason?: string}} input - Metadados da decisão.
 * @param {{retry: boolean, leaseToken: string, now: Date}} workflow - Controlo do lease.
 * @returns {Promise<object>} Pedido reclamado.
 */
async function claimAndPreparePrivacyRequest(
    requestId,
    actor,
    input,
    { retry, leaseToken, now },
) {
    return runPrivacyTransaction(async (session) => {
        const candidate = await BiometricDataRequest.findById(requestId)
            .select("requesterId")
            .session(session);
        if (!candidate) return null;
        const request = await BiometricDataRequest.findOneAndUpdate(
            buildClaimFilter(requestId, candidate.requesterId, retry, now),
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
                    reviewerId: actor.id,
                    ...(input.decisionReason
                        ? { decisionReason: input.decisionReason }
                        : {}),
                    reviewedAt: now,
                    lastAttemptAt: now,
                    completedAt: null,
                    erasureVerifiedAt: null,
                    decisionError: "",
                    "lease.token": leaseToken,
                    "lease.expiresAt": new Date(
                        now.getTime() + REQUEST_LEASE_MS,
                    ),
                },
                $inc: { attempts: 1 },
            },
            { new: true, session },
        ).select("+lease.token");

        if (!request) return null;

        if (affectsFaceProcessing(request.resources)) {
            // Um worker já reclamado perde o lease nesta mesma transação. O
            // heartbeat aborta o provider e os CAS finais impedem recriação do
            // grafo depois de a privacidade ter sido aplicada.
            await cancelAiJobsForUser(request.requesterId, {
                now,
                session,
            });
            await reclaimFileDeletionJobsForOwner(
                {
                    ownerId: request.requesterId,
                    sourceType: PRIVACY_FILE_DELETION_SOURCE,
                    sourceId: request._id,
                },
                { session },
            );
            await prepareMakeupSimulationErasure(request, session);
        }

        if (affectsFaceProcessing(request.resources)) {
            await blockFaceDataWritesForPrivacy(request.requesterId, {
                session,
                at: now,
                requireActive: false,
            });
        }

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
            const photos = await FacePhoto.find({ userId: request.requesterId })
                .select("+storageKey")
                .session(session)
                .lean();

            await enqueueFileDeletionJobs(
                photos.map((photo) => ({
                    sourceType: PRIVACY_FILE_DELETION_SOURCE,
                    sourceId: request._id,
                    ownerId: request.requesterId,
                    storageKey: photo.storageKey,
                })),
                { session },
            );

            await FacePhoto.updateMany(
                { userId: request.requesterId },
                { $set: { status: "deleted" } },
                { session },
            );
        }

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
            await deleteConsultationReportGraph(request, session);
        }

        return request;
    });
}

/**
 * Marca falha recuperável apenas se o chamador ainda possuir o lease.
 *
 * @async
 * @function markPrivacyRequestFailed
 * @param {string} requestId - Pedido em processamento.
 * @param {string} leaseToken - Token opaco do worker.
 * @returns {Promise<void>} Conclui depois do CAS.
 */
async function markPrivacyRequestFailed(requestId, leaseToken) {
    await BiometricDataRequest.updateOne(
        {
            _id: requestId,
            status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
            "lease.token": leaseToken,
        },
        {
            $set: {
                status: BIOMETRIC_REQUEST_STATUSES.FAILED,
                decisionError: RECOVERABLE_DECISION_ERROR,
                "lease.token": null,
                "lease.expiresAt": null,
            },
        },
    );
}

/**
 * Confirma recursos ausentes e conclui o pedido na mesma transação.
 *
 * @async
 * @function finalizePrivacyRequest
 * @param {object} request - Pedido reclamado.
 * @param {string} leaseToken - Token do worker.
 * @returns {Promise<object>} Pedido concluído.
 */
async function finalizePrivacyRequest(
    request,
    leaseToken,
    actor,
    auditReason,
) {
    return runPrivacyTransaction(async (session) => {
        const jobsCompleted = await areFileDeletionJobsCompleted(
            {
                sourceType: PRIVACY_FILE_DELETION_SOURCE,
                sourceId: request._id,
            },
            { session },
        );

        if (!jobsCompleted) {
            throw new AppError(
                503,
                "Eliminação física ainda não confirmada.",
            );
        }

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
            await FacePhoto.deleteMany(
                { userId: request.requesterId },
                { session },
            );
            const remainingPhotos = await FacePhoto.countDocuments({
                userId: request.requesterId,
            }).session(session);
            if (remainingPhotos !== 0) {
                throw new AppError(503, "Eliminação de fotografias incompleta.");
            }

            const remainingSimulations = await MakeupSimulation.countDocuments({
                userId: request.requesterId,
            }).session(session);
            const remainingQuotaLedger =
                await MakeupSimulationQuota.countDocuments({
                    userId: request.requesterId,
                }).session(session);
            if (remainingSimulations !== 0 || remainingQuotaLedger !== 0) {
                throw new AppError(
                    503,
                    "Eliminação de simulações derivadas e quota incompleta.",
                );
            }
        }

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
            for (const model of [
                ...REPORT_DERIVED_USER_MODELS,
                MakeupSimulation,
            ]) {
                const remaining = await model
                    .countDocuments({ userId: request.requesterId })
                    .session(session);
                if (remaining !== 0) {
                    throw new AppError(
                        503,
                        "Eliminação do grafo de relatórios incompleta.",
                    );
                }
            }
            const remainingGrants = await ReportPhotoGrant.countDocuments({
                clientUserId: request.requesterId,
            }).session(session);
            const remainingLegacyReviews =
                await RecommendationReview.countDocuments({
                    clientUserId: request.requesterId,
                }).session(session);
            if (remainingGrants !== 0 || remainingLegacyReviews !== 0) {
                throw new AppError(
                    503,
                    "Eliminação de revisões e consentimentos temporários incompleta.",
                );
            }
        }

        const erasureVerifiedAt = new Date();
        const completed = await BiometricDataRequest.findOneAndUpdate(
            {
                _id: request._id,
                status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
                "lease.token": leaseToken,
            },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.COMPLETED,
                    completedAt: erasureVerifiedAt,
                    erasureVerifiedAt,
                    decisionError: "",
                    "lease.token": null,
                    "lease.expiresAt": null,
                },
            },
            { new: true, session },
        );

        if (!completed) {
            throw new AppError(409, "Lease do pedido deixou de ser válido.");
        }

        if (affectsFaceProcessing(request.resources)) {
            await releaseResolvedPrivacyBarrier(request.requesterId, {
                session,
                excludeRequestId: request._id,
            });
        }

        await recordDecisionAudit(
            actor,
            completed,
            {
                resourceId: idToString(completed._id),
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: auditReason,
            },
            { session },
        );

        return completed;
    });
}

/**
 * Executa uma aprovação ou retry idempotente de ponta a ponta.
 *
 * @async
 * @function processApprovedPrivacyRequest
 * @param {string} requestId - Pedido a executar.
 * @param {{id: string}} actor - Revisor.
 * @param {{decisionReason?: string}} input - Metadados validados.
 * @param {{retry?: boolean, fileWorker?: object}} [options] - Controlo interno/testes.
 * @returns {Promise<object>} Pedido concluído.
 */
export async function processApprovedPrivacyRequest(
    requestId,
    actor,
    input,
    { retry = false, fileWorker = {} } = {},
) {
    const successAuditReason = retry
        ? "Pedido de privacidade reprocessado com sucesso."
        : "Pedido de privacidade aprovado e aplicado.";
    const now = new Date();
    const leaseToken = randomUUID();
    const request = await claimAndPreparePrivacyRequest(requestId, actor, input, {
        retry,
        leaseToken,
        now,
    });

    if (!request) {
        const existingRequest = await loadRequestOrThrow(requestId);

        // Um retry repetido depois da conclusão é um replay seguro: devolve o
        // resultado persistido sem recriar jobs, tocar nos bytes ou incrementar
        // tentativas. Estados incompatíveis continuam a ser conflito.
        if (
            retry &&
            existingRequest.status === BIOMETRIC_REQUEST_STATUSES.COMPLETED &&
            existingRequest.erasureVerifiedAt
        ) {
            await recordDecisionAudit(actor, existingRequest, {
                resourceId: idToString(existingRequest._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: successAuditReason,
            });
            return existingRequest;
        }

        throw new AppError(
            409,
            retry
                ? "Pedido não está disponível para reprocessamento."
                : "Pedido já foi decidido.",
        );
    }

    try {
        const fileResult = await processFileDeletionJobs({
            sourceType: PRIVACY_FILE_DELETION_SOURCE,
            sourceId: request._id,
            ...fileWorker,
        });

        if (fileResult.failed > 0 || fileResult.outstanding > 0) {
            throw new AppError(
                503,
                "Eliminação física ainda não confirmada.",
            );
        }

        return await finalizePrivacyRequest(
            request,
            leaseToken,
            actor,
            successAuditReason,
        );
    } catch (error) {
        await markPrivacyRequestFailed(requestId, leaseToken);
        throw error;
    }
}

/**
 * Decide um pedido pendente por PATCH.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - ID do pedido.
 * @param {{id: string, role: string}} actor - Revisor autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} DTO atualizado.
 */
export async function decideBiometricDataRequest(requestId, actor, input) {
    if (!mongoose.isValidObjectId(requestId)) {
        await recordDecisionAudit(actor, null, {
            resourceId: String(requestId ?? "").slice(0, 120),
            result: BIOMETRIC_AUDIT_RESULTS.DENIED,
            reason: "Tentativa de decidir pedido com ID inválido.",
        });
        throw new AppError(400, "ID de pedido inválido.");
    }

    try {
        const request =
            input.decision === "rejected"
                ? await rejectPrivacyRequest(requestId, actor, input)
                : await processApprovedPrivacyRequest(requestId, actor, input);

        return toPrivacyRequestResponse(request);
    } catch (error) {
        await recordDecisionAudit(actor, null, {
            resourceId: requestId,
            result: BIOMETRIC_AUDIT_RESULTS.DENIED,
            reason: "Decisão de privacidade não aplicada.",
        });
        throw error;
    }
}

/**
 * Reprocessa apenas pedidos falhados ou leases expirados.
 *
 * @async
 * @function retryBiometricDataRequest
 * @param {string} requestId - Pedido recuperável.
 * @param {{id: string, role: string}} actor - Revisor autenticado.
 * @param {{decisionReason?: string}} input - Nota opcional do retry.
 * @returns {Promise<object>} DTO concluído.
 */
export async function retryBiometricDataRequest(requestId, actor, input = {}) {
    if (!mongoose.isValidObjectId(requestId)) {
        throw new AppError(400, "ID de pedido inválido.");
    }

    try {
        const request = await processApprovedPrivacyRequest(
            requestId,
            actor,
            input,
            { retry: true },
        );

        return toPrivacyRequestResponse(request);
    } catch (error) {
        await recordDecisionAudit(actor, null, {
            resourceId: requestId,
            result: BIOMETRIC_AUDIT_RESULTS.DENIED,
            reason: "Retry de privacidade não concluído.",
        });
        throw error;
    }
}
