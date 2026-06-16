// real_dev/api/src/controllers/admin-users.controller.js
import {
    listAdminUsers,
    setUserAccountStatus,
    softDeleteUserAccount,
    updateUserRole,
} from "../services/admin-users.service.js";

/**
 * Lista utilizadores para o painel admin.
 *
 * @async
 * @function listAdminUsersController
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
 * Atualiza estado administrativo da conta (Ativar/Suspender).
 *
 * @async
 * @function updateUserStatusController
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
 * Executa eliminação lógica de uma conta (Soft Delete).
 *
 * @async
 * @function deleteUserAccountController
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

/**
 * Atualiza a role de um utilizador alvo (Herdado da MF0).
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