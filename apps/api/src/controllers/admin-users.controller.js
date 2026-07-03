/**
 * Controllers administrativos de utilizadores.
 */
import {
    listAdminUsers,
    setUserAccountStatus,
    softDeleteUserAccount,
    updateUserRole,
} from "../services/admin-users.service.js";

/**
 * Lista utilizadores para administracao.
 *
 * @async
 * @function listAdminUsersController
 * @param {import("express").Request} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com lista segura.
 */
export async function listAdminUsersController(req, res, next) {
    try {
        const users = await listAdminUsers();
        return res.status(200).json({ users });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza a role de um utilizador alvo.
 *
 * @async
 * @function updateUserRoleController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com utilizador atualizado.
 */
export async function updateUserRoleController(req, res, next) {
    try {
        const user = await updateUserRole({
            targetUserId: req.params.id,
            role: String(req.body.role ?? "").trim(),
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza estado administrativo da conta.
 *
 * @async
 * @function updateUserStatusController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com utilizador atualizado.
 */
export async function updateUserStatusController(req, res, next) {
    try {
        const user = await setUserAccountStatus({
            targetUserId: req.params.id,
            status: String(req.body.status ?? "").trim(),
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

/**
 * Executa eliminacao logica de uma conta.
 *
 * @async
 * @function deleteUserAccountController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido admin autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com conta eliminada logicamente.
 */
export async function deleteUserAccountController(req, res, next) {
    try {
        const user = await softDeleteUserAccount({
            targetUserId: req.params.id,
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}
