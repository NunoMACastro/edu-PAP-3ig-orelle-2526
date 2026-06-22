import {
    listBiometricAuditAlerts,
    listBiometricAuditLogs,
} from "../services/biometric-audit.service.js";

/**
 * Lista eventos de auditoria biométrica para administrador.
 *
 * @async
 * @function listBiometricAuditLogsController
 * @param {import("express").Request} req - Pedido autenticado de administrador.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com logs minimizados.
 */
export async function listBiometricAuditLogsController(req, res, next) {
    try {
        // O controller não monta DTOs manuais; confia no service minimizado para não expor dados biométricos.
        const logs = await listBiometricAuditLogs();

        return res.status(200).json({ logs });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista alertas de auditoria biométrica para administrador.
 *
 * @async
 * @function listBiometricAuditAlertsController
 * @param {import("express").Request} req - Pedido autenticado de administrador.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com alertas minimizados.
 */
export async function listBiometricAuditAlertsController(req, res, next) {
    try {
        // Alertas são uma vista filtrada dos logs e não uma segunda fonte de verdade.
        const alerts = await listBiometricAuditAlerts();

        return res.status(200).json({ alerts });
    } catch (err) {
        return next(err);
    }
}