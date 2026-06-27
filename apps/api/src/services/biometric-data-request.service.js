/**
 * Service do fluxo RF41 para pedidos de eliminacao/anonymizacao biometrica.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
    BiometricDataRequest,
} from "../models/biometric-data-request.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    BIOMETRIC_AUDIT_RESULTS,
    recordBiometricAccess,
} from "./biometric-audit.service.js";

const RECOVERABLE_DECISION_ERROR =
    "Falha operacional ao aplicar pedido de privacidade. Pode ser reprocessado.";

/**
 * Converte um valor de ID para string sem assumir ObjectId real em testes.
 *
 * @function idToString
 * @param {unknown} value - ID vindo de documento real ou mock.
 * @returns {string|null} ID textual ou null.
 */
function idToString(value) {
    return value ? value.toString() : null;
}

/**
 * Converte pedido para DTO seguro para cliente e painel.
 *
 * @function toBiometricDataRequestResponse
 * @param {object} request - Documento Mongoose ou objeto equivalente.
 * @returns {object} Pedido sem dados biometricos brutos.
 */
function toBiometricDataRequestResponse(request) {
    return {
        id: idToString(request._id),
        requesterId: idToString(request.requesterId),
        action: request.action,
        resources: request.resources,
        reason: request.reason ?? "",
        status: request.status,
        reviewerId: idToString(request.reviewerId),
        decisionReason: request.decisionReason ?? "",
        decisionError: request.decisionError ?? "",
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt ?? null,
        completedAt: request.completedAt ?? null,
    };
}

/**
 * Devolve options de Mongoose apenas quando uma transacao real esta ativa.
 *
 * @function sessionOptions
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {{session: import("mongoose").ClientSession}|undefined} Options para queries/saves.
 */
function sessionOptions(session) {
    return session ? { session } : undefined;
}

/**
 * Indica se a ligacao atual parece suportar transacoes MongoDB.
 *
 * MongoDB standalone nao suporta transacoes. Nesses ambientes, o service usa um
 * estado duravel `processing`/`failed` para evitar pedidos "pending" apos
 * mutacoes parciais e permitir recuperacao operacional.
 *
 * @function canUseMongoTransactions
 * @returns {boolean} True quando a ligacao esta pronta e nao parece standalone.
 */
function canUseMongoTransactions() {
    const topologyType =
        mongoose.connection?.client?.topology?.description?.type ?? "";

    return mongoose.connection.readyState === 1 && topologyType !== "Single";
}

/**
 * Inicia sessao transacional apenas quando o runtime MongoDB a suporta.
 *
 * @async
 * @function createOptionalSession
 * @returns {Promise<import("mongoose").ClientSession|null>} Sessao ou null para fallback duravel.
 */
async function createOptionalSession() {
    if (!canUseMongoTransactions()) return null;

    return mongoose.startSession();
}

/**
 * Executa uma decisao com transacao quando disponivel.
 *
 * @async
 * @function runWithOptionalTransaction
 * @param {(session: import("mongoose").ClientSession|null) => Promise<object>} handler - Mutacao a executar.
 * @returns {Promise<object>} Resultado do handler.
 */
async function runWithOptionalTransaction(handler) {
    const session = await createOptionalSession();

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
 * Carrega pedido com a sessao transacional quando existir.
 *
 * @async
 * @function findBiometricDataRequestById
 * @param {string} requestId - ID validado do pedido.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<object|null>} Documento de pedido ou null.
 */
async function findBiometricDataRequestById(requestId, session) {
    const options = sessionOptions(session);

    return options
        ? BiometricDataRequest.findById(requestId, null, options)
        : BiometricDataRequest.findById(requestId);
}

/**
 * Grava pedido preservando a transacao quando aplicavel.
 *
 * @async
 * @function saveBiometricDataRequest
 * @param {object} request - Documento Mongoose ou mock equivalente.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<void>} Conclui apos persistencia.
 */
async function saveBiometricDataRequest(request, session) {
    const options = sessionOptions(session);

    if (options) {
        await request.save(options);
        return;
    }

    await request.save();
}

/**
 * Cria pedido de tratamento dos dados faciais do cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequest
 * @param {string} userId - Utilizador autenticado pela sessao.
 * @param {{action: string, resources: string[], reason: string}} input - Dados validados.
 * @returns {Promise<object>} Pedido criado em formato seguro.
 */
export async function createMyBiometricDataRequest(userId, input) {
    const request = await BiometricDataRequest.create({
        requesterId: userId,
        action: input.action,
        resources: input.resources,
        reason: input.reason,
    });

    return toBiometricDataRequestResponse(request);
}

/**
 * Lista pedidos para o painel de revisao e regista auditoria RF44.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @returns {Promise<object[]>} Pedidos minimizados, mais recentes primeiro.
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
        reason: "Listagem de pedidos biometricos para revisao.",
    });

    return requests.map(toBiometricDataRequestResponse);
}

/**
 * Regista uma tentativa de decisao sobre pedido biometrico.
 *
 * @async
 * @function recordDecisionAudit
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {object|null} request - Pedido encontrado, quando existir.
 * @param {{resourceId: string, result: string, reason: string}} event - Metadados do resultado.
 * @returns {Promise<void>} Conclui apos gravar auditoria.
 */
async function recordDecisionAudit(actor, request, event) {
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        subjectUserId: idToString(request?.requesterId),
        action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
        resourceId: event.resourceId,
        result: event.result,
        reason: event.reason,
    });
}

/**
 * Aplica eliminacao logica aos recursos selecionados.
 *
 * @async
 * @function applyDeleteAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<void>} Conclui quando os recursos ficam fora da operacao normal.
 */
async function applyDeleteAction(requesterId, resources, session) {
    const options = sessionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        const update = { $set: { status: "deleted" } };

        if (options) await FacePhoto.updateMany(filter, update, options);
        else await FacePhoto.updateMany(filter, update);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        const filter = { userId: requesterId, privacyStatus: { $ne: "deleted" } };
        const update = {
            $set: {
                privacyStatus: "deleted",
                cosmeticSummary: "Relatório removido por pedido de privacidade.",
                routineSuggestions: [],
                sources: ["privacy_request_delete"],
                limitations: ["Conteúdo indisponível após eliminação lógica."],
            },
        };

        if (options) await FaceReport.updateMany(filter, update, options);
        else await FaceReport.updateMany(filter, update);
    }
}

/**
 * Aplica anonymizacao minima aos recursos selecionados.
 *
 * @async
 * @function applyAnonymizeAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<void>} Conclui quando os dados deixam de ser uteis para identificacao.
 */
async function applyAnonymizeAction(requesterId, resources, session) {
    const options = sessionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        const update = {
            $set: {
                status: "anonymized",
                originalName: "fotografia-anonymizada",
            },
        };

        if (options) await FacePhoto.updateMany(filter, update, options);
        else await FacePhoto.updateMany(filter, update);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        const filter = { userId: requesterId, privacyStatus: { $ne: "deleted" } };
        const update = {
            $set: {
                privacyStatus: "anonymized",
                cosmeticSummary: "Relatório anonymizado a pedido do utilizador.",
                routineSuggestions: [],
                sources: ["privacy_request_anonymize"],
                limitations: ["Conteúdo pessoal removido por pedido de privacidade."],
            },
        };

        if (options) await FaceReport.updateMany(filter, update, options);
        else await FaceReport.updateMany(filter, update);
    }
}

/**
 * Aplica a acao aprovada aos recursos pedidos.
 *
 * @async
 * @function applyApprovedBiometricDataRequest
 * @param {object} request - Pedido aprovado.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<void>} Conclui quando os recursos foram tratados.
 * @throws {AppError} Quando a acao gravada no pedido nao e suportada.
 */
async function applyApprovedBiometricDataRequest(request, session) {
    if (request.action === BIOMETRIC_REQUEST_ACTIONS.DELETE) {
        await applyDeleteAction(request.requesterId, request.resources, session);
        return;
    }

    if (request.action === BIOMETRIC_REQUEST_ACTIONS.ANONYMIZE) {
        await applyAnonymizeAction(request.requesterId, request.resources, session);
        return;
    }

    throw new AppError(400, "Ação do pedido inválida.");
}

/**
 * Garante que o pedido pode ser decidido ou reprocessado de forma segura.
 *
 * @function assertRequestCanBeDecided
 * @param {object} request - Pedido carregado.
 * @param {{decision: "approved"|"rejected"}} input - Decisao validada.
 * @returns {void}
 * @throws {AppError} Quando o estado atual nao aceita a decisao.
 */
function assertRequestCanBeDecided(request, input) {
    if (request.status === BIOMETRIC_REQUEST_STATUSES.PENDING) return;

    if (
        request.status === BIOMETRIC_REQUEST_STATUSES.FAILED &&
        input.decision === "approved"
    ) {
        return;
    }

    if (request.status === BIOMETRIC_REQUEST_STATUSES.PROCESSING) {
        throw new AppError(409, "Pedido ainda está em processamento.");
    }

    throw new AppError(409, "Pedido já foi decidido.");
}

/**
 * Guarda estado falhado recuperavel sem expor detalhes internos ao frontend.
 *
 * @async
 * @function markDecisionAsFailed
 * @param {object} request - Pedido cuja aprovacao falhou.
 * @returns {Promise<void>} Conclui quando o estado recuperavel fica gravado.
 */
async function markDecisionAsFailed(request) {
    request.status = BIOMETRIC_REQUEST_STATUSES.FAILED;
    request.decisionError = RECOVERABLE_DECISION_ERROR;
    await saveBiometricDataRequest(request, null);
}

/**
 * Aplica aprovacao com transacao quando possivel e fallback duravel quando nao.
 *
 * @async
 * @function approveBiometricDataRequest
 * @param {object} request - Pedido a aprovar.
 * @param {string} reviewerId - Revisor autenticado.
 * @param {{decisionReason: string}} input - Input validado.
 * @param {import("mongoose").ClientSession|null} session - Sessao transacional opcional.
 * @returns {Promise<object>} Pedido atualizado em DTO seguro.
 */
async function approveBiometricDataRequest(request, reviewerId, input, session) {
    request.reviewerId = reviewerId;
    request.decisionReason = input.decisionReason;
    request.reviewedAt = new Date();
    request.status = BIOMETRIC_REQUEST_STATUSES.PROCESSING;
    request.decisionError = "";
    await saveBiometricDataRequest(request, session);

    try {
        await applyApprovedBiometricDataRequest(request, session);
        request.status = BIOMETRIC_REQUEST_STATUSES.COMPLETED;
        request.completedAt = new Date();
        request.decisionError = "";
        await saveBiometricDataRequest(request, session);
    } catch (err) {
        if (!session) await markDecisionAsFailed(request);
        throw err;
    }

    return toBiometricDataRequestResponse(request);
}

/**
 * Decide um pedido pendente e aplica tratamento quando ha aprovacao.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisao validada.
 * @returns {Promise<object>} Pedido atualizado.
 * @throws {AppError} Quando o pedido nao existe, ja foi decidido ou tem ID invalido.
 */
export async function decideBiometricDataRequest(requestId, actor, input) {
    if (!mongoose.isValidObjectId(requestId)) {
        await recordDecisionAudit(actor, null, {
            resourceId: requestId,
            result: BIOMETRIC_AUDIT_RESULTS.DENIED,
            reason: "Tentativa de decidir pedido com ID invalido.",
        });
        throw new AppError(400, "ID de pedido inválido.");
    }

    return runWithOptionalTransaction(async (session) => {
        const request = await findBiometricDataRequestById(requestId, session);

        if (!request) {
            await recordDecisionAudit(actor, null, {
                resourceId: requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Tentativa de decidir pedido inexistente.",
            });
            throw new AppError(404, "Pedido não encontrado.");
        }

        try {
            assertRequestCanBeDecided(request, input);
        } catch (err) {
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Tentativa de decidir pedido em estado fechado.",
            });
            throw err;
        }

        request.reviewerId = actor.id;
        request.decisionReason = input.decisionReason;
        request.reviewedAt = new Date();
        request.decisionError = "";

        if (input.decision === "rejected") {
            request.status = BIOMETRIC_REQUEST_STATUSES.REJECTED;
            await saveBiometricDataRequest(request, session);
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: "Pedido biometrico rejeitado por revisor autorizado.",
            });
            return toBiometricDataRequestResponse(request);
        }

        try {
            const approvedRequest = await approveBiometricDataRequest(
                request,
                actor.id,
                input,
                session,
            );

            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: "Pedido biometrico aprovado por revisor autorizado.",
            });

            return approvedRequest;
        } catch (err) {
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Falha operacional ao aplicar decisao biometrica.",
            });
            throw err;
        }
    });
}
