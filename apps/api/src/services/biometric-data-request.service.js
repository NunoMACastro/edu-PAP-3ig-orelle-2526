// apps/api/src/services/biometric-data-request.service.js
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
    BiometricDataRequest,
} from "../models/biometric-data-request.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";

/**
 * Converte pedido para DTO seguro.
 *
 * @function toBiometricDataRequestResponse
 * @param {object} request - Documento Mongoose ou objeto equivalente.
 * @returns {object} Pedido sem dados biométricos brutos.
 */
function toBiometricDataRequestResponse(request) {
    return {
        id: request._id.toString(),
        requesterId: request.requesterId.toString(),
        action: request.action,
        resources: request.resources,
        reason: request.reason,
        status: request.status,
        decisionReason: request.decisionReason,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        completedAt: request.completedAt,
    };
}

/**
 * Cria pedido de tratamento dos dados faciais do cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequest
 * @param {string} userId - Utilizador autenticado pela sessão.
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
 * Lista pedidos para o painel administrativo.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @returns {Promise<object[]>} Pedidos minimizados, ordenados do mais recente para o mais antigo.
 */
export async function listBiometricDataRequestsForReview() {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    return requests.map(toBiometricDataRequestResponse);
}
// apps/api/src/services/biometric-data-request.service.js
/**
 * Aplica eliminação lógica aos recursos selecionados.
 *
 * @async
 * @function applyDeleteAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @returns {Promise<void>} Conclui quando os recursos ficam removidos da operação normal.
 */
async function applyDeleteAction(requesterId, resources) {
    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        // A eliminação lógica tira as fotografias dos fluxos ativos sem expor paths privados.
        await FacePhoto.updateMany(
            { userId: requesterId, status: "active" },
            { $set: { status: "deleted" } },
        );
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        await FaceReport.updateMany(
            { userId: requesterId, privacyStatus: { $ne: "deleted" } },
            {
                $set: {
                    privacyStatus: "deleted",
                    cosmeticSummary: "Relatório removido por pedido de privacidade.",
                    routineSuggestions: [],
                    sources: ["privacy_request_delete"],
                    limitations: ["Conteúdo indisponível após eliminação lógica."],
                },
            },
        );
    }
}

/**
 * Aplica anonymização mínima aos recursos selecionados.
 *
 * @async
 * @function applyAnonymizeAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @returns {Promise<void>} Conclui quando os dados deixam de ter conteúdo identificável útil.
 */
async function applyAnonymizeAction(requesterId, resources) {
    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        await FacePhoto.updateMany(
            { userId: requesterId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonymizada",
                },
            },
        );
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        // O relatório mantém rasto técnico, mas perde resumo e sugestões pessoais.
        await FaceReport.updateMany(
            { userId: requesterId, privacyStatus: { $ne: "deleted" } },
            {
                $set: {
                    privacyStatus: "anonymized",
                    cosmeticSummary: "Relatório anonymizado a pedido do utilizador.",
                    routineSuggestions: [],
                    sources: ["privacy_request_anonymize"],
                    limitations: ["Conteúdo pessoal removido por pedido de privacidade."],
                },
            },
        );
    }
}

/**
 * Aplica a ação aprovada aos recursos pedidos.
 *
 * @async
 * @function applyApprovedBiometricDataRequest
 * @param {object} request - Pedido aprovado.
 * @returns {Promise<void>} Conclui quando os recursos foram tratados.
 * @throws {AppError} Quando a ação gravada no pedido não é suportada.
 */
async function applyApprovedBiometricDataRequest(request) {
    if (request.action === BIOMETRIC_REQUEST_ACTIONS.DELETE) {
        await applyDeleteAction(request.requesterId, request.resources);
        return;
    }

    if (request.action === BIOMETRIC_REQUEST_ACTIONS.ANONYMIZE) {
        await applyAnonymizeAction(request.requesterId, request.resources);
        return;
    }

    throw new AppError(400, "Ação do pedido inválida.");
}

/**
 * Decide um pedido pendente e aplica tratamento quando a decisão é aprovação.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {string} reviewerId - Consultor/admin autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} Pedido atualizado.
 */
export async function decideBiometricDataRequest(requestId, reviewerId, input) {
    const request = await BiometricDataRequest.findById(requestId);

    if (!request) {
        throw new AppError(404, "Pedido não encontrado.");
    }

    if (request.status !== BIOMETRIC_REQUEST_STATUSES.PENDING) {
        throw new AppError(409, "Pedido já foi decidido.");
    }

    request.reviewerId = reviewerId;
    request.decisionReason = input.decisionReason;
    request.reviewedAt = new Date();

    if (input.decision === "rejected") {
        request.status = BIOMETRIC_REQUEST_STATUSES.REJECTED;
        await request.save();
        return toBiometricDataRequestResponse(request);
    }

    await applyApprovedBiometricDataRequest(request);
    request.status = BIOMETRIC_REQUEST_STATUSES.COMPLETED;
    request.completedAt = new Date();
    await request.save();

    return toBiometricDataRequestResponse(request);
}