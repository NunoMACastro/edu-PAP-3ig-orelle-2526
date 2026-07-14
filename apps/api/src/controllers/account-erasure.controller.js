/**
 * Controller HTTP da eliminação terminal da própria conta.
 */
import { clearSessionCookie } from "../services/session.service.js";
import { eraseOwnAccount } from "../services/account-erasure.service.js";
import { validateAccountErasureInput } from "../validators/account-erasure.validator.js";

/**
 * Elimina a conta autenticada depois da confirmação reforçada.
 *
 * A resposta é `202` quando o outbox ainda tem bytes privados para remover e
 * `200` quando não existiam ficheiros ou a remoção física foi confirmada. Em
 * todos os casos a conta e os dados na base já atingiram o estado terminal.
 *
 * @async
 * @function eraseOwnAccountController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Continuação de erros.
 * @returns {Promise<import("express").Response|void>} Estado sanitizado.
 */
export async function eraseOwnAccountController(req, res, next) {
    try {
        const { password } = validateAccountErasureInput(req.body);
        const result = await eraseOwnAccount({
            userId: req.user.id,
            password,
        });

        clearSessionCookie(res);
        res.set("Cache-Control", "no-store");

        const pendingFileCleanup = result.fileCleanupStatus === "pending";

        return res.status(pendingFileCleanup ? 202 : 200).json({
            account: {
                status: result.status,
                deletedAt: result.deletedAt,
            },
            fileCleanup: { status: result.fileCleanupStatus },
            message: pendingFileCleanup
                ? "Conta eliminada. A remoção física dos ficheiros privados ficou agendada."
                : result.fileCleanupStatus === "completed"
                  ? "Conta e ficheiros privados eliminados."
                  : "Conta eliminada.",
        });
    } catch (error) {
        return next(error);
    }
}
