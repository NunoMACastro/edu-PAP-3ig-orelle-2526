/**
 * Migração 001: converte exclusivamente estados financeiros legados para o
 * contrato académico de pagamento simulado, sem promover encomendas antigas.
 */

const LEGACY_PAID_STATUSES = ["paid"];
const LEGACY_UNPAID_STATUSES = [
    "pending",
    "manual",
    "failed",
    "unpaid",
    "cancelled",
];
const EXTERNAL_PAYMENT_FIELDS = [
    "payment.gateway",
    "payment.checkoutUrl",
    "payment.provider",
    "payment.redirectUrl",
    "payment.externalReference",
    "payment.url",
];

/**
 * Constrói a pesquisa de qualquer metadado financeiro externo persistido.
 *
 * @returns {object} Filtro MongoDB composto apenas por nomes de campos.
 */
function externalPaymentFieldsFilter() {
    return {
        $or: EXTERNAL_PAYMENT_FIELDS.map((field) => ({
            [field]: { $exists: true },
        })),
    };
}

/**
 * Recolhe contagens sanitizadas antes de executar a migração.
 *
 * @param {import("mongodb").Db} db - Base local selecionada pelo runner.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object>} Contagens sem dados de encomenda ou utilizador.
 */
async function analyze(db, session = undefined) {
    const orders = db.collection("orders");
    const options = session ? { session } : {};
    const [legacyPaid, legacyUnpaid, externalMetadata] = await Promise.all([
        orders.countDocuments(
            { "payment.status": { $in: LEGACY_PAID_STATUSES } },
            options,
        ),
        orders.countDocuments(
            { "payment.status": { $in: LEGACY_UNPAID_STATUSES } },
            options,
        ),
        orders.countDocuments(externalPaymentFieldsFilter(), options),
    ]);

    return { legacyPaid, legacyUnpaid, externalMetadata };
}

/**
 * Aplica a conversão dentro da transação controlada pelo runner.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession, now: Date}} context - Dependências transacionais.
 * @returns {Promise<object>} Contagens de documentos atingidos.
 */
async function up({ db, session, now }) {
    const orders = db.collection("orders");
    const paidResult = await orders.updateMany(
        { "payment.status": { $in: LEGACY_PAID_STATUSES } },
        [
            {
                $set: {
                    "payment.mode": "simulated_legacy",
                    "payment.status": "simulated_paid",
                    "payment.simulationReference": {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $eq: [
                                            { $type: "$payment.simulationReference" },
                                            "string",
                                        ],
                                    },
                                    {
                                        $gt: [
                                            {
                                                $strLenCP: {
                                                    $ifNull: [
                                                        "$payment.simulationReference",
                                                        "",
                                                    ],
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                ],
                            },
                            "$payment.simulationReference",
                            {
                                $concat: [
                                    "SIM-LEGACY-",
                                    { $toString: "$_id" },
                                ],
                            },
                        ],
                    },
                    "payment.simulatedAt": {
                        $ifNull: [
                            "$payment.simulatedAt",
                            {
                                $ifNull: [
                                    "$updatedAt",
                                    { $ifNull: ["$createdAt", now] },
                                ],
                            },
                        ],
                    },
                    "payment.message":
                        "Pagamento legado classificado como simulação académica; não representa uma cobrança.",
                },
            },
        ],
        { session },
    );
    const unpaidResult = await orders.updateMany(
        { "payment.status": { $in: LEGACY_UNPAID_STATUSES } },
        {
            $set: {
                status: "cancelled",
                "payment.mode": "simulated_legacy",
                "payment.status": "cancelled_legacy",
                "payment.simulationReference": null,
                "payment.simulatedAt": null,
                "payment.message":
                    "Encomenda legada cancelada sem a promover a pagamento simulado.",
                stockReserved: false,
            },
        },
        { session },
    );
    const unsetExternalFields = Object.fromEntries(
        EXTERNAL_PAYMENT_FIELDS.map((field) => [field, ""]),
    );
    const cleanupResult = await orders.updateMany(
        externalPaymentFieldsFilter(),
        { $unset: unsetExternalFields },
        { session },
    );

    return {
        legacyPaidMatched: paidResult.matchedCount,
        legacyUnpaidMatched: unpaidResult.matchedCount,
        externalMetadataCleaned: cleanupResult.modifiedCount,
    };
}

/**
 * Confirma que não restaram estados ou metadados financeiros substituídos.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession}} context - Base e sessão atuais.
 * @returns {Promise<object>} Contagens finais todas iguais a zero.
 * @throws {Error} Quando a transformação ficou incompleta.
 */
async function validate({ db, session }) {
    const remaining = await analyze(db, session);

    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 001 deixou estados financeiros legados");
    }

    return remaining;
}

/** Metadados e operações imutáveis da migração. */
export const migration001PaymentSimulationContract = Object.freeze({
    version: "001_payment_simulation_contract",
    description: "Converte pagamentos legados sem iniciar transações financeiras",
    analyze,
    up,
    validate,
});
