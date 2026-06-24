/**
 * Controllers HTTP para auditoria biometrica RF44.
 */
import {
    listBiometricAuditAlerts,
    listBiometricAuditLogs,
} from "../services/biometric-audit.service.js";

/**
 * Lista eventos de auditoria biometricos para administrador.
 *
 * @async
 * @function listBiometricAuditLogsController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado de admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com logs minimizados.
 */
export async function listBiometricAuditLogsController(req, res, next) {
    try {
        const logs = await listBiometricAuditLogs(req.user);

        return res.status(200).json({ logs });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista alertas de auditoria biometricos para administrador.
 *
 * @async
 * @function listBiometricAuditAlertsController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado de admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com alertas minimizados.
 */
export async function listBiometricAuditAlertsController(req, res, next) {
    try {
        const alerts = await listBiometricAuditAlerts(req.user);

        return res.status(200).json({ alerts });
    } catch (err) {
        return next(err);
    }
}
