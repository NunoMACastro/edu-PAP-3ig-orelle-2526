/**
 * Controller de vouchers academicos do cliente.
 */
import { listVouchersForUser } from "../services/voucher.service.js";

/**
 * Lista vouchers do utilizador autenticado.
 *
 * @async
 * @function listMyVouchersController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listMyVouchersController(req, res, next) {
    try {
        const vouchers = await listVouchersForUser(req.user.id);
        return res.status(200).json({ vouchers });
    } catch (err) {
        return next(err);
    }
}
