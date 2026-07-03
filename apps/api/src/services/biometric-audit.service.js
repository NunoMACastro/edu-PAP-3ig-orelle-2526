/**
 * Service RF44 para auditoria de acessos a dados biometricos.
 */
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    BIOMETRIC_AUDIT_RESULTS,
    BiometricAccessLog,
} from "../models/biometric-access-log.model.js";

const ALERT_WINDOW_MINUTES = 15;
const ALERT_EVENT_LIMIT = 10;

/**
 * Converte um valor de ID para string sem depender de ObjectId real em testes.
 *
 * @function idToString
 * @param {unknown} value - ID de documento, string ou mock.
 * @returns {string|null} ID textual ou null.
 */
function idToString(value) {
    return value ? value.toString() : null;
}

/**
 * Limita texto de auditoria a uma razao curta e segura.
 *
 * @function sanitizeReason
 * @param {unknown} reason - Texto controlado gerado pelo backend.
 * @returns {string} Texto seguro para persistir no log.
 */
function sanitizeReason(reason) {
    return String(reason ?? "").trim().slice(0, 200);
}

/**
 * Converte evento de auditoria para DTO minimizado.
 *
 * @function toAuditLogResponse
 * @param {object} log - Documento Mongoose ou mock equivalente.
 * @returns {object} Evento sem dados biometricos brutos.
 */
function toAuditLogResponse(log) {
    return {
        id: idToString(log._id),
        actorId: idToString(log.actorId),
        actorRole: log.actorRole,
        subjectUserId: idToString(log.subjectUserId),
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId ?? "",
        result: log.result,
        reason: log.reason ?? "",
        alertRaised: Boolean(log.alertRaised),
        createdAt: log.createdAt,
    };
}

/**
 * Regista um evento RF44 e assinala alerta por volume recente do mesmo ator.
 *
 * @async
 * @function recordBiometricAccess
 * @param {{actorId: string, actorRole: string, subjectUserId?: string|null, action: string, resourceType: string, resourceId?: string, result?: string, reason?: string}} event - Evento gerado por backend autenticado.
 * @returns {Promise<object>} Evento persistido em DTO minimizado.
 */
export async function recordBiometricAccess(event) {
    const since = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60 * 1000);
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
        resourceId: String(event.resourceId ?? "").slice(0, 120),
        result: event.result ?? BIOMETRIC_AUDIT_RESULTS.ALLOWED,
        reason: sanitizeReason(event.reason),
        // O alerta nao bloqueia a acao; ele sinaliza revisao administrativa.
        alertRaised: recentCount + 1 > ALERT_EVENT_LIMIT,
    });

    return toAuditLogResponse(log);
}

/**
 * Lista eventos recentes para revisao administrativa.
 *
 * @async
 * @function listBiometricAuditLogs
 * @param {{id: string, role: string}} actor - Administrador autenticado.
 * @returns {Promise<object[]>} Eventos minimizados, mais recentes primeiro.
 */
export async function listBiometricAuditLogs(actor) {
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.VIEW_AUDIT,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.AUDIT,
        reason: "Consulta administrativa de logs biometricos.",
    });

    const logs = await BiometricAccessLog.find()
        .sort({ createdAt: -1 })
        .limit(200);

    return logs.map(toAuditLogResponse);
}

/**
 * Lista eventos que levantaram alerta de volume.
 *
 * @async
 * @function listBiometricAuditAlerts
 * @param {{id: string, role: string}} actor - Administrador autenticado.
 * @returns {Promise<object[]>} Alertas minimizados, mais recentes primeiro.
 */
export async function listBiometricAuditAlerts(actor) {
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.VIEW_AUDIT,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.AUDIT,
        reason: "Consulta administrativa de alertas biometricos.",
    });

    const alerts = await BiometricAccessLog.find({ alertRaised: true })
        .sort({ createdAt: -1 })
        .limit(50);

    return alerts.map(toAuditLogResponse);
}

export {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    BIOMETRIC_AUDIT_RESULTS,
};
