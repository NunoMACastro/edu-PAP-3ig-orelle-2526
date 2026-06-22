import {
    BIOMETRIC_AUDIT_ACTIONS,
    recordBiometricAccess,
} from "./biometric-audit.service.js";

/**
 * Lista pedidos e regista auditoria do acesso administrativo.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @returns {Promise<object[]>} Pedidos minimizados.
 */
export async function listBiometricDataRequestsForReview(actor) {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    // A auditoria fica no service para ser executada mesmo que a UI mude no futuro.
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.LIST_REQUESTS,
        resourceType: "request",
        reason: "Listagem de pedidos biométricos para revisão.",
    });

    return requests.map(toBiometricDataRequestResponse);
}
// apps/api/src/services/biometric-data-request.service.js
/**
 * Decide pedido pendente e regista auditoria da decisão.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} Pedido atualizado e minimizado.
 */
export async function decideBiometricDataRequest(requestId, actor, input) {
    const request = await BiometricDataRequest.findById(requestId);

    if (!request) {
        // Tentativas falhadas também interessam: podem indicar enumeração de pedidos sensíveis.
        await recordBiometricAccess({
            actorId: actor.id,
            actorRole: actor.role,
            action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
            resourceType: "request",
            resourceId: requestId,
            result: "denied",
            reason: "Tentativa de decidir pedido inexistente.",
        });
        throw new AppError(404, "Pedido não encontrado");
    }

    if (request.status !== BIOMETRIC_REQUEST_STATUSES.PENDING) {
        // Decisões repetidas são registadas para detetar abuso ou erro operacional.
        await recordBiometricAccess({
            actorId: actor.id,
            actorRole: actor.role,
            subjectUserId: request.requesterId.toString(),
            action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
            resourceType: "request",
            resourceId: request._id.toString(),
            result: "denied",
            reason: "Tentativa de decidir pedido já tratado.",
        });
        throw new AppError(409, "Pedido já foi decidido");
    }

    request.status = input.decision;
    request.reviewerId = actor.id;
    request.decisionReason = input.decisionReason;
    request.reviewedAt = new Date();

    if (input.decision === BIOMETRIC_REQUEST_STATUSES.APPROVED) {
        await applyApprovedBiometricDataRequest(request);
        request.status = BIOMETRIC_REQUEST_STATUSES.COMPLETED;
        request.completedAt = new Date();
    }

    await request.save();

    // A auditoria fica depois da ação para registar o resultado real aplicado.
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        subjectUserId: request.requesterId.toString(),
        action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
        resourceType: "request",
        resourceId: request._id.toString(),
        result: "allowed",
        reason: `Decisão ${input.decision} aplicada a pedido biométrico.`,
    });

    return toBiometricDataRequestResponse(request);
}