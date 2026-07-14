/**
 * Service de vouchers academicos da paywall IA.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Voucher, VOUCHER_STATUS } from "../models/voucher.model.js";

/**
 * Converte voucher para DTO publico.
 *
 * @function toVoucherDto
 * @param {object|null} voucher - Documento de voucher ou null.
 * @returns {object|null} Voucher sem campos internos.
 */
export function toVoucherDto(voucher) {
    if (!voucher) return null;

    return {
        id: voucher._id.toString(),
        code: voucher.code,
        amountCents: voucher.amountCents,
        remainingCents: voucher.remainingCents,
        status: voucher.status,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
    };
}

/**
 * Cria codigo estavel para o voucher de um desbloqueio.
 *
 * @function buildVoucherCode
 * @param {object} unlock - Desbloqueio que originou o voucher.
 * @returns {string} Codigo legivel e deterministico.
 */
function buildVoucherCode(unlock) {
    const suffix = unlock._id.toString().slice(-8).toUpperCase();
    return `ORELLE-${suffix}`;
}

/**
 * Cria ou reutiliza o voucher associado a um desbloqueio de report.
 *
 * @async
 * @function createVoucherForReportUnlock
 * @param {string} userId - Utilizador autenticado.
 * @param {object} unlock - Documento ReportUnlock desbloqueado.
 * @param {{session?: import("mongoose").ClientSession}} [options] - Sessão transacional.
 * @returns {Promise<object>} Voucher publico.
 */
export async function createVoucherForReportUnlock(
    userId,
    unlock,
    { session } = {},
) {
    if (unlock.depositCents === 0) return null;

    const voucher = await Voucher.findOneAndUpdate(
        {
            userId,
            sourceReportUnlockId: unlock._id,
        },
        {
            $setOnInsert: {
                userId,
                code: buildVoucherCode(unlock),
                amountCents: unlock.depositCents,
                remainingCents: unlock.depositCents,
                sourceReportUnlockId: unlock._id,
                status: VOUCHER_STATUS.ACTIVE,
            },
        },
        {
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            upsert: true,
            session,
        },
    );

    return toVoucherDto(voucher);
}

/**
 * Lista vouchers do proprio utilizador.
 *
 * @async
 * @function listVouchersForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Vouchers publicos.
 */
export async function listVouchersForUser(userId) {
    const vouchers = await Voucher.find({ userId }).sort({ createdAt: -1 });
    return vouchers.map(toVoucherDto);
}

/**
 * Calcula o desconto do melhor voucher ativo sem o consumir ainda.
 *
 * @async
 * @function previewBestVoucherDiscount
 * @param {string} userId - Utilizador autenticado.
 * @param {number} subtotalCents - Subtotal seguro calculado pelo backend.
 * @param {{session?: import("mongoose").ClientSession, voucherCode?: string|null}} [options] - Sessão e seleção opcional.
 * @returns {Promise<{voucher: object|null, discountCents: number, finalTotalCents: number}>} Preview do desconto.
 */
export async function previewBestVoucherDiscount(
    userId,
    subtotalCents,
    { session, voucherCode = null } = {},
) {
    const normalizedVoucherCode = String(voucherCode ?? "").trim().toUpperCase();
    const query = Voucher.findOne({
        userId,
        status: VOUCHER_STATUS.ACTIVE,
        remainingCents: { $gt: 0 },
        ...(normalizedVoucherCode ? { code: normalizedVoucherCode } : {}),
    }).sort({ createdAt: 1 });
    const voucher = await (session ? query.session(session) : query);
    if (normalizedVoucherCode && !voucher) {
        throw new AppError(400, "O voucher indicado não existe ou já não está disponível.");
    }
    const safeSubtotalCents = Math.max(0, Number(subtotalCents) || 0);
    const discountCents = voucher
        ? Math.min(voucher.remainingCents, safeSubtotalCents)
        : 0;

    return {
        voucher,
        discountCents,
        finalTotalCents: Math.max(0, safeSubtotalCents - discountCents),
    };
}

/**
 * Recarrega o voucher guardado no snapshot de uma encomenda.
 *
 * @async
 * @function findVoucherFromOrderSnapshot
 * @param {string} userId - Utilizador autenticado.
 * @param {object} order - Encomenda com snapshot de voucher.
 * @returns {Promise<object|null>} Voucher encontrado ou null.
 */
export async function findVoucherFromOrderSnapshot(userId, order) {
    if (!order?.voucher?.voucherId || (order.discountCents ?? 0) <= 0) {
        return null;
    }

    return Voucher.findOne({
        _id: order.voucher.voucherId,
        userId,
    });
}

/**
 * Consome o desconto de voucher depois de o checkout ficar persistido.
 *
 * @async
 * @function consumeVoucherDiscount
 * @param {object|null} voucher - Voucher previamente selecionado.
 * @param {number} discountCents - Valor aplicado no checkout.
 * @param {object} orderId - ID da encomenda criada/reutilizada.
 * @param {{session?: import("mongoose").ClientSession, requireSuccess?: boolean}} [options] - Opções atómicas.
 * @returns {Promise<object|null>} Voucher atualizado ou null sem desconto.
 */
export async function consumeVoucherDiscount(
    voucher,
    discountCents,
    orderId,
    { session, requireSuccess = false } = {},
) {
    if (!voucher || discountCents <= 0) return null;

    const updatedVoucher = await Voucher.findOneAndUpdate(
        {
            _id: voucher._id,
            userId: voucher.userId,
            appliedOrderIds: { $ne: orderId },
            remainingCents: { $gte: discountCents },
        },
        [
            {
                $set: {
                    remainingCents: {
                        $subtract: ["$remainingCents", discountCents],
                    },
                    appliedOrderIds: {
                        $concatArrays: [
                            { $ifNull: ["$appliedOrderIds", []] },
                            [orderId],
                        ],
                    },
                },
            },
            {
                $set: {
                    status: {
                        $cond: [
                            { $eq: ["$remainingCents", 0] },
                            VOUCHER_STATUS.USED,
                            VOUCHER_STATUS.ACTIVE,
                        ],
                    },
                },
            },
        ],
        { new: true, session },
    );

    if (!updatedVoucher && requireSuccess) {
        throw new AppError(
            409,
            "O voucher já não está disponível. Revê o checkout antes de simular.",
        );
    }

    if (!updatedVoucher) return null;

    voucher.remainingCents = updatedVoucher.remainingCents;
    voucher.status = updatedVoucher.status;
    voucher.appliedOrderIds = updatedVoucher.appliedOrderIds;
    return updatedVoucher;
}
