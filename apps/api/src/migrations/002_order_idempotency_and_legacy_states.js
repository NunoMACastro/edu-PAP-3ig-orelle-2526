/**
 * Migração 002: completa a barreira de idempotência das encomendas legadas e
 * restaura voucher apenas quando `appliedOrderIds` prova o consumo anterior.
 */

const MISSING_CHECKOUT_KEY = {
    $or: [
        { checkoutKey: { $exists: false } },
        { checkoutKey: null },
        { checkoutKey: "" },
    ],
};
const MISSING_PAYMENT_ATTEMPTS = {
    $or: [
        { paymentAttempts: { $exists: false } },
        { paymentAttempts: null },
    ],
};
const CANCELLED_WITH_VOUCHER = {
    "payment.status": "cancelled_legacy",
    "voucher.voucherId": { $type: "objectId" },
    "voucher.amountCents": { $gt: 0 },
};

/**
 * Conta ligações de voucher cuja própria lista prova consumo pela encomenda.
 *
 * @param {import("mongodb").Db} db - Base local do runner.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<number>} Número de vouchers elegíveis para reposição.
 */
async function countRestorableVoucherLinks(db, session = undefined) {
    const orders = db.collection("orders");
    const vouchers = db.collection("vouchers");
    const cursor = orders.find(
        CANCELLED_WITH_VOUCHER,
        session ? { session } : {},
    ).project({ _id: 1, "voucher.voucherId": 1 });
    let count = 0;

    for await (const order of cursor) {
        count += await vouchers.countDocuments(
            {
                _id: order.voucher.voucherId,
                appliedOrderIds: order._id,
            },
            session ? { session, limit: 1 } : { limit: 1 },
        );
    }

    return count;
}

/**
 * Recolhe contagens para status/dry-run sem modificar a base.
 *
 * @param {import("mongodb").Db} db - Base local selecionada.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object>} Contagens sanitizadas.
 */
async function analyze(db, session = undefined) {
    const orders = db.collection("orders");
    const options = session ? { session } : {};
    const [missingCheckoutKey, missingPaymentAttempts, restorableVoucherLinks] =
        await Promise.all([
            orders.countDocuments(MISSING_CHECKOUT_KEY, options),
            orders.countDocuments(MISSING_PAYMENT_ATTEMPTS, options),
            countRestorableVoucherLinks(db, session),
        ]);

    return {
        missingCheckoutKey,
        missingPaymentAttempts,
        restorableVoucherLinks,
    };
}

/**
 * Repõe um voucher uma única vez, removendo simultaneamente a prova de consumo.
 *
 * @param {import("mongodb").Collection} vouchers - Coleção de vouchers.
 * @param {object} order - Encomenda cancelada com snapshot de voucher.
 * @param {import("mongodb").ClientSession} session - Sessão ativa.
 * @returns {Promise<boolean>} Verdadeiro quando existia prova e houve reposição.
 */
async function restoreProvenVoucher(vouchers, order, session) {
    const amountCents = Number(order.voucher?.amountCents ?? 0);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return false;

    const result = await vouchers.updateOne(
        {
            _id: order.voucher.voucherId,
            appliedOrderIds: order._id,
        },
        [
            {
                $set: {
                    remainingCents: {
                        $min: [
                            "$amountCents",
                            {
                                $add: [
                                    { $ifNull: ["$remainingCents", 0] },
                                    amountCents,
                                ],
                            },
                        ],
                    },
                    appliedOrderIds: {
                        $filter: {
                            input: { $ifNull: ["$appliedOrderIds", []] },
                            as: "appliedOrderId",
                            cond: { $ne: ["$$appliedOrderId", order._id] },
                        },
                    },
                },
            },
            {
                $set: {
                    status: {
                        $cond: [
                            { $gt: ["$remainingCents", 0] },
                            "active",
                            "used",
                        ],
                    },
                },
            },
        ],
        { session },
    );

    return result.modifiedCount === 1;
}

/**
 * Aplica idempotência estrutural e reposição comprovada de voucher.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession}} context - Dependências transacionais.
 * @returns {Promise<object>} Contagens de operações realizadas.
 */
async function up({ db, session }) {
    const orders = db.collection("orders");
    const vouchers = db.collection("vouchers");
    const checkoutResult = await orders.updateMany(
        MISSING_CHECKOUT_KEY,
        [
            {
                $set: {
                    checkoutKey: {
                        $concat: ["LEGACY-", { $toString: "$_id" }],
                    },
                },
            },
        ],
        { session },
    );
    const attemptsResult = await orders.updateMany(
        MISSING_PAYMENT_ATTEMPTS,
        { $set: { paymentAttempts: [] } },
        { session },
    );
    const cursor = orders.find(CANCELLED_WITH_VOUCHER, { session }).project({
        _id: 1,
        voucher: 1,
    });
    let vouchersRestored = 0;

    for await (const order of cursor) {
        if (await restoreProvenVoucher(vouchers, order, session)) {
            vouchersRestored += 1;
        }
    }

    return {
        checkoutKeysCreated: checkoutResult.modifiedCount,
        paymentAttemptsInitialized: attemptsResult.modifiedCount,
        vouchersRestored,
    };
}

/**
 * Exige idempotência estrutural completa e nenhuma reposição por executar.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession}} context - Base e sessão atuais.
 * @returns {Promise<object>} Contagens finais todas iguais a zero.
 * @throws {Error} Quando a migração ficou incompleta.
 */
async function validate({ db, session }) {
    const remaining = await analyze(db, session);

    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 002 deixou encomendas legadas incompletas");
    }

    return remaining;
}

/** Metadados e operações imutáveis da migração. */
export const migration002OrderIdempotencyAndLegacyStates = Object.freeze({
    version: "002_order_idempotency_and_legacy_states",
    description: "Completa idempotência e repõe apenas voucher comprovado",
    analyze,
    up,
    validate,
});
