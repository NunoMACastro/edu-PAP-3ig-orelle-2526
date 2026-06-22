import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESULTS,
    BiometricAccessLog,
} from "../models/biometric-access-log.model.js";

const ALERT_WINDOW_MINUTES = 15;
const ALERT_EVENT_LIMIT = 10;

/**
 * Converte evento de auditoria para resposta segura.
 *
 * @function toAuditLogResponse
 * @param {object} log - Documento Mongoose ou mock equivalente.
 * @returns {object} Evento sem dados biométricos brutos.
 */
function toAuditLogResponse(log) {
    return {
        id: log._id.toString(),
        actorId: log.actorId.toString(),
        actorRole: log.actorRole,
        subjectUserId: log.subjectUserId?.toString() ?? null,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        result: log.result,
        // A resposta devolve só metadados; não devolve fotografia, relatório, cookie, token ou storageKey.
        reason: log.reason,
        alertRaised: log.alertRaised,
        createdAt: log.createdAt,
    };
}

/**
 * Regista acesso biométrico e assinala alerta por volume recente.
 *
 * @async
 * @function recordBiometricAccess
 * @param {{actorId: string, actorRole: string, subjectUserId?: string|null, action: string, resourceType: string, resourceId?: string, result?: string, reason?: string}} event - Evento validado pelo ponto de chamada.
 * @returns {Promise<object>} Evento registado.
 */
export async function recordBiometricAccess(event) {
    const since = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60 * 1000);
    // A janela curta torna o alerta previsível para alunos e evita depender de ferramentas externas.
    const recentCount = await BiometricAccessLog.countDocuments({
        actorId: event.actorId,
        createdAt: { $gte: since },
    });

    const log = await BiometricAccessLog.create({
        actorId: event.actorId,
        actorRole: event.actorRole,
        subjectUserId: event.subjectUserId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? "",
        result: event.result ?? BIOMETRIC_AUDIT_RESULTS.ALLOWED,
        reason: event.reason ?? "",
        // O alerta não bloqueia a ação; apenas sinaliza revisão administrativa.
        alertRaised: recentCount + 1 > ALERT_EVENT_LIMIT,
    });

    return toAuditLogResponse(log);
}

/**
 * Lista eventos recentes para revisão administrativa.
 *
 * @async
 * @function listBiometricAuditLogs
 * @returns {Promise<object[]>} Eventos minimizados.
 */
export async function listBiometricAuditLogs() {
    const logs = await BiometricAccessLog.find()
        .sort({ createdAt: -1 })
        // A listagem é limitada para evitar respostas administrativas gigantes com metadados sensíveis.
        .limit(200);

    return logs.map(toAuditLogResponse);
}

/**
 * Lista alertas gerados por volume de acessos.
 *
 * @async
 * @function listBiometricAuditAlerts
 * @returns {Promise<object[]>} Eventos com alerta.
 */
export async function listBiometricAuditAlerts() {
    const alerts = await BiometricAccessLog.find({ alertRaised: true })
        .sort({ createdAt: -1 })
        // O painel de alertas mostra apenas sinais recentes que precisam de revisão humana.
        .limit(50);

    return alerts.map(toAuditLogResponse);
}

export { BIOMETRIC_AUDIT_ACTIONS, BIOMETRIC_AUDIT_RESULTS };