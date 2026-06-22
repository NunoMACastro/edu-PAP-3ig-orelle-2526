// apps/api/src/controllers/biometric-data-request.controller.js
import {
    validateBiometricDataRequestDecisionInput,
    validateCreateBiometricDataRequestInput,
} from "../validators/biometric-data-request.validator.js";
import {
    createMyBiometricDataRequest,
    decideBiometricDataRequest,
    listBiometricDataRequestsForReview,
} from "../services/biometric-data-request.service.js";

/**
 * Cria pedido de eliminação/anonymização para o cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com pedido minimizado.
 */
export async function createMyBiometricDataRequestController(req, res, next) {
    try {
        const input = validateCreateBiometricDataRequestInput(req.body);
        // O userId vem da sessão para impedir pedidos em nome de outro cliente.
        const request = await createMyBiometricDataRequest(req.user.id, input);

        return res.status(201).json({ request });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista pedidos para revisão por consultor ou administrador.
 *
 * @async
 * @function listBiometricDataRequestsController
 * @param {import("express").Request} req - Pedido protegido por role.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com pedidos minimizados.
 */
export async function listBiometricDataRequestsController(req, res, next) {
    try {
        const requests = await listBiometricDataRequestsForReview();

        return res.status(200).json({ requests });
    } catch (err) {
        return next(err);
    }
}

/**
 * Aprova ou rejeita pedido biométrico pendente.
 *
 * @async
 * @function decideBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado de consultor/admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com decisão aplicada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        const request = await decideBiometricDataRequest(
            req.params.requestId,
            req.user.id,
            input,
        );

        return res.status(200).json({ request });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista pedidos biométricos para consultor/admin.
 *
 * @async
 * @function listBiometricDataRequestsController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com pedidos minimizados.
 */
export async function listBiometricDataRequestsController(req, res, next) {
    try {
        // O ator vem de `requireAuth`; o frontend nunca envia actorId ou role para auditoria.
        const requests = await listBiometricDataRequestsForReview(req.user);
        return res.status(200).json({ requests });
    } catch (err) {
        return next(err);
    }
}

/**
 * Decide pedido biométrico e passa ator autenticado ao service.
 *
 * @async
 * @function decideBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com decisão minimizada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        // A validação do body acontece antes do service para impedir decisões ambíguas.
        const request = await decideBiometricDataRequest(
            req.params.requestId,
            req.user,
            input,
        );

        return res.status(200).json({ request });
    } catch (err) {
        return next(err);
    }
}