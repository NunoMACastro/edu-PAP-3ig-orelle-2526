/**
 * Controllers administrativos de utilizadores.
 */
import { updateUserRole } from "../services/admin-users.service.js";

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
