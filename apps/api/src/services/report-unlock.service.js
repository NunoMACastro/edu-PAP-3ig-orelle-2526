/**
 * Service do gate academico para relatorios e recomendacoes IA.
 */
import { createHash } from "node:crypto";
import { AppError } from "../middlewares/error.middleware.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { assertAbortSignalActive } from "../utils/abort-signal.util.js";
import {
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";

const ACADEMIC_DEPOSIT_NUMERATOR = 1_000;
const ACADEMIC_DEPOSIT_DENOMINATOR = 10_000;

/**
 * Calcula os 10% apenas com aritmética inteira e arredondamento por excesso.
 * @param {number} totalCents - Total elegível em cêntimos.
 * @returns {number} Depósito académico simulado em cêntimos.
 */
export function calculateAcademicDepositCents(totalCents) {
    if (
        !Number.isSafeInteger(totalCents) ||
        totalCents < 0 ||
        !Number.isSafeInteger(totalCents * ACADEMIC_DEPOSIT_NUMERATOR)
    ) {
        throw new AppError(500, "Total recomendado inválido");
    }
    return Math.floor(
        (totalCents * ACADEMIC_DEPOSIT_NUMERATOR +
            ACADEMIC_DEPOSIT_DENOMINATOR -
            1) /
            ACADEMIC_DEPOSIT_DENOMINATOR,
    );
}

/**
 * Converte desbloqueio para DTO publico de acesso.
 *
 * @function toReportAccessDto
 * @param {object} unlock - Documento ReportUnlock.
 * @returns {object} Estado de acesso seguro.
 */
export function toReportAccessDto(unlock) {
    const simulatedPaid = unlock.status === REPORT_UNLOCK_STATUS.UNLOCKED;
    const paymentNotRequired =
        unlock.simulatedPayment?.status === "not_required" ||
        unlock.depositCents === 0;

    return {
        status: unlock.status,
        recommendedTotalCents: unlock.recommendedTotalCents,
        depositCents: unlock.depositCents,
        recommendationCount: unlock.recommendationIds?.length ?? 0,
        availableRecommendationCount:
            unlock.availableRecommendationCount ??
            unlock.recommendationIds?.length ??
            0,
        requiresPayment: !paymentNotRequired,
        unlockedAt: unlock.unlockedAt,
        payment: {
            mode: "simulated",
            status: paymentNotRequired
                ? "not_required"
                : simulatedPaid
                  ? "simulated_paid"
                  : "awaiting_simulation",
            simulationReference:
                unlock.simulatedPayment?.reference ?? null,
            simulatedAt:
                unlock.simulatedPayment?.confirmedAt ?? null,
            message:
                "Demonstração académica — não será efetuada qualquer cobrança.",
        },
    };
}

/**
 * Calcula soma dos produtos recomendados, assumindo 1 unidade por produto.
 *
 * @function calculateRecommendedTotalCents
 * @param {object[]} recommendations - Recomendações internas ou DTOs.
 * @returns {number} Total em centimos.
 */
export function calculateRecommendedTotalCents(recommendations) {
    return recommendations.reduce(
        (sum, recommendation) => {
            const product = recommendation.product ?? recommendation.productId;
            const stock = Number(
                recommendation.variant?.stock ??
                    recommendation.productSnapshot?.stock ??
                    product?.stock,
            );
            const available =
                recommendation.availableAtFreeze ??
                recommendation.productSnapshot?.available ??
                (!Number.isFinite(stock) || stock > 0);
            if (!available) return sum;
            return (
                sum +
                Number(
                    recommendation.unitPriceCents ??
                        recommendation.variant?.priceCents ??
                        recommendation.productSnapshot?.priceCents ??
                        product?.priceCents ??
                        0,
                )
            );
        },
        0,
    );
}

/**
 * Extrai IDs de recomendacao.
 *
 * @function collectRecommendationIds
 * @param {object[]} recommendations - Recomendações internas ou DTOs.
 * @returns {object[]} IDs em formato compatível com Mongoose.
 */
function collectRecommendationIds(recommendations) {
    return recommendations
        .map((recommendation) => recommendation._id ?? recommendation.id)
        .filter(Boolean);
}

/**
 * Garante que existe gate bloqueado para o relatorio e recomendações geradas.
 *
 * @async
 * @function ensureReportUnlockForRecommendations
 * @param {{userId: string, analysisId: object, reportId: object, recommendations: object[]}} input - Dados base.
 * @returns {Promise<object>} Documento de desbloqueio.
 */
export async function ensureReportUnlockForRecommendations(
    input,
    { session, signal } = {},
) {
    assertAbortSignalActive(signal, "Geração do relatório cancelada.");
    const recommendedTotalCents = calculateRecommendedTotalCents(input.recommendations);
    const depositCents = calculateAcademicDepositCents(recommendedTotalCents);
    const recommendationIds = collectRecommendationIds(input.recommendations);
    const autoUnlocked = depositCents === 0;
    const now = new Date();
    const unlock = await ReportUnlock.findOneAndUpdate(
        {
            userId: input.userId,
            reportId: input.reportId,
        },
        {
            $setOnInsert: {
                userId: input.userId,
                analysisId: input.analysisId,
                reportId: input.reportId,
                recommendationIds,
                recommendedTotalCents,
                depositCents,
                availableRecommendationCount: input.recommendations.filter(
                    (recommendation) =>
                        recommendation.productSnapshot?.available ??
                        ((recommendation.product?.stock ??
                            recommendation.productId?.stock ??
                            1) > 0),
                ).length,
                status: autoUnlocked
                    ? REPORT_UNLOCK_STATUS.UNLOCKED
                    : REPORT_UNLOCK_STATUS.LOCKED,
                simulatedPayment: {
                    status: autoUnlocked ? "not_required" : "not_started",
                    amountCents: 0,
                    confirmedAt: null,
                    reference: null,
                    idempotencyKeyHash: null,
                },
                unlockedAt: autoUnlocked ? now : null,
                zeroFeeReason: autoUnlocked
                    ? "no_available_recommendations"
                    : null,
            },
        },
        {
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            upsert: true,
            ...(session ? { session } : {}),
        },
    );
    assertAbortSignalActive(signal, "Geração do relatório cancelada.");

    if (unlock.status === REPORT_UNLOCK_STATUS.UNLOCKED) return unlock;

    const refreshed =
        (await ReportUnlock.findOneAndUpdate(
            {
                _id: unlock._id,
                userId: input.userId,
                status: REPORT_UNLOCK_STATUS.LOCKED,
            },
            {
                $set: {
                    recommendationIds,
                    recommendedTotalCents,
                    depositCents,
                },
            },
            {
                new: true,
                runValidators: true,
                ...(session ? { session } : {}),
            },
        )) ?? unlock;
    assertAbortSignalActive(signal, "Geração do relatório cancelada.");
    return refreshed;
}

/**
 * Congela preços e disponibilidade da versão final do relatório.
 * O snapshot é write-once: qualquer hash diferente para o mesmo report falha.
 */
export async function freezeReportUnlockSnapshot(
    {
        userId,
        analysisId,
        reportId,
        reportVersion,
        contentHash,
    },
    { session, now = new Date() } = {},
) {
    let recommendationQuery = ProductRecommendation.find({
        userId,
        reportId,
        schemaVersion: 2,
        status: { $in: ["active", "accepted", "adjusted"] },
    }).sort({ selectionRank: 1, createdAt: 1 });
    if (session) recommendationQuery = recommendationQuery.session(session);
    const recommendations = await recommendationQuery;
    const productIds = recommendations.map(({ productId }) => productId);
    let productQuery = Product.find({ _id: { $in: productIds } }).select(
        "priceCents stock variants",
    );
    if (session) productQuery = productQuery.session(session);
    const products = await productQuery;
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );
    const recommendationSnapshots = recommendations.map((recommendation) => {
        const product = productsById.get(recommendation.productId.toString());
        let variant = null;
        let unitPriceCents = recommendation.productSnapshot?.priceCents ?? 0;
        let stockAtFreeze = 0;

        if (product) {
            try {
                variant = resolveProductVariant(product, recommendation.variantId);
                unitPriceCents = resolveVariantPriceCents(product, variant);
                stockAtFreeze = resolveVariantStock(product, variant);
            } catch {
                // Variante retirada: mantém-se no relatório histórico, mas não
                // entra no valor elegível nem pode ser adicionada ao carrinho.
                stockAtFreeze = 0;
            }
        }

        return {
            recommendationId: recommendation._id,
            productId: recommendation.productId,
            variantId: recommendation.variantId ?? null,
            unitPriceCents,
            stockAtFreeze,
            availableAtFreeze: stockAtFreeze > 0,
        };
    });
    const availableSnapshots = recommendationSnapshots.filter(
        ({ availableAtFreeze }) => availableAtFreeze,
    );
    const recommendedTotalCents = calculateRecommendedTotalCents(
        availableSnapshots,
    );
    const depositCents = calculateAcademicDepositCents(recommendedTotalCents);
    const autoUnlocked = depositCents === 0;

    const existingQuery = ReportUnlock.findOne({ userId, reportId }).select(
        "+simulatedPayment.idempotencyKeyHash",
    );
    const existing = await (session
        ? existingQuery.session(session)
        : existingQuery);
    if (existing) {
        if (existing.contentHash && existing.contentHash !== contentHash) {
            throw new AppError(409, "Relatório já foi congelado com outro conteúdo");
        }
        return existing;
    }

    let unlock;
    try {
        unlock = await ReportUnlock.findOneAndUpdate(
            { userId, reportId },
            {
                $setOnInsert: {
                schemaVersion: 2,
                reportVersion,
                contentHash,
                userId,
                analysisId,
                reportId,
                recommendationIds: recommendations.map(({ _id }) => _id),
                recommendationSnapshots,
                recommendedTotalCents,
                depositCents,
                availableRecommendationCount: availableSnapshots.length,
                status: autoUnlocked
                    ? REPORT_UNLOCK_STATUS.UNLOCKED
                    : REPORT_UNLOCK_STATUS.LOCKED,
                simulatedPayment: {
                    status: autoUnlocked ? "not_required" : "not_started",
                    amountCents: 0,
                    confirmedAt: null,
                    reference: null,
                    idempotencyKeyHash: null,
                },
                frozenAt: now,
                unlockedAt: autoUnlocked ? now : null,
                zeroFeeReason: autoUnlocked
                    ? "no_available_recommendations"
                    : null,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
                ...(session ? { session } : {}),
            },
        ).select("+simulatedPayment.idempotencyKeyHash");
    } catch (error) {
        if (error?.code !== 11000) throw error;
        if (session?.inTransaction?.()) {
            error.addErrorLabel?.("TransientTransactionError");
            throw error;
        }
        unlock = await ReportUnlock.findOne({ userId, reportId }).select(
            "+simulatedPayment.idempotencyKeyHash",
        );
    }
    if (!unlock) throw new AppError(409, "Conflito ao congelar o relatório");
    if (unlock.contentHash !== contentHash) {
        throw new AppError(409, "Relatório já foi congelado com outro conteúdo");
    }
    return unlock;
}

/**
 * Devolve gate de um relatorio do proprio utilizador.
 *
 * @async
 * @function findReportUnlockForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {object|string} reportId - Relatorio pretendido.
 * @returns {Promise<object|null>} Desbloqueio encontrado.
 */
export async function findReportUnlockForUser(userId, reportId) {
    return ReportUnlock.findOne({ userId, reportId });
}

/**
 * Confirma se o relatorio pode expor dados completos.
 *
 * @async
 * @function isReportUnlockedForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {object|string} reportId - Relatorio pretendido.
 * @returns {Promise<{unlocked: boolean, unlock: object|null}>} Estado de acesso.
 */
export async function isReportUnlockedForUser(userId, reportId) {
    const unlock = await findReportUnlockForUser(userId, reportId);

    return {
        unlocked: unlock?.status === REPORT_UNLOCK_STATUS.UNLOCKED,
        unlock,
    };
}

/**
 * Bloqueia acesso público a recomendações enquanto o report estiver fechado.
 *
 * @async
 * @function assertLatestReportUnlockedForRecommendations
 * @param {string} userId - Utilizador autenticado.
 * @param {object} report - Relatorio associado as recomendações.
 * @returns {Promise<object>} Gate desbloqueado.
 */
export async function assertLatestReportUnlockedForRecommendations(userId, report) {
    const { unlocked, unlock } = await isReportUnlockedForUser(userId, report._id);

    if (!unlocked) {
        if (unlock) {
            return {
                locked: true,
                access: toReportAccessDto(unlock),
                recommendations: [],
            };
        }

        throw new AppError(423, "Relatório bloqueado por pagamento académico simulado");
    }

    return { locked: false, access: toReportAccessDto(unlock) };
}

/**
 * Bloqueia endpoints derivados que tentam usar recomendações de reports fechados.
 *
 * @async
 * @function assertRecommendationsUnlockedForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {object[]} recommendations - Recomendações com `reportId`.
 * @returns {Promise<void>}
 * @throws {AppError} Quando alguma recomendação pertence a report bloqueado.
 */
export async function assertRecommendationsUnlockedForUser(userId, recommendations) {
    const hasMissingReport = recommendations.some(
        (recommendation) => !recommendation.reportId,
    );

    if (hasMissingReport) {
        throw new AppError(
            423,
            "Relatório bloqueado por pagamento académico simulado",
        );
    }

    const reportIds = [
        ...new Set(
            recommendations
                .map((recommendation) => recommendation.reportId?.toString?.())
                .filter(Boolean),
        ),
    ];

    for (const reportId of reportIds) {
        const { unlocked } = await isReportUnlockedForUser(userId, reportId);

        if (!unlocked) {
            throw new AppError(
                423,
                "Relatório bloqueado por pagamento académico simulado",
            );
        }
    }
}

/**
 * Desbloqueia report por pagamento académico simulado.
 *
 * @async
 * @function unlockReportWithSimulatedPayment
 * @param {string} userId - Utilizador autenticado.
 * @param {string} reportId - Relatorio a desbloquear.
 * @param {string} idempotencyKey - Chave HTTP validada.
 * @param {{session?: import("mongoose").ClientSession, now?: Date, signal?: AbortSignal}} [options] - Contexto transacional.
 * @returns {Promise<object>} Gate desbloqueado.
 */
export async function unlockReportWithSimulatedPayment(
    userId,
    reportId,
    idempotencyKey,
    { session, now = new Date(), signal } = {},
) {
    assertAbortSignalActive(signal, "Pagamento simulado do relatório cancelado.");
    if (typeof idempotencyKey !== "string" || idempotencyKey.length < 16) {
        throw new AppError(400, "Idempotency-Key obrigatório para a simulação");
    }

    const idempotencyKeyHash = createHash("sha256")
        .update(idempotencyKey)
        .digest("hex");
    let query = ReportUnlock.findOne({ userId, reportId }).select(
        "+simulatedPayment.idempotencyKeyHash",
    );
    if (session) query = query.session(session);
    const unlock = await query;
    assertAbortSignalActive(signal, "Pagamento simulado do relatório cancelado.");

    if (!unlock) {
        throw new AppError(404, "Relatório bloqueado não encontrado");
    }

    if (unlock.status === REPORT_UNLOCK_STATUS.UNLOCKED) {
        const previousHash = unlock.simulatedPayment?.idempotencyKeyHash;
        if (!previousHash || previousHash === idempotencyKeyHash) return unlock;
        throw new AppError(
            409,
            "O relatório já tem um pagamento simulado concluído",
        );
    }

    const updated = await ReportUnlock.findOneAndUpdate(
        {
            _id: unlock._id,
            userId,
            status: REPORT_UNLOCK_STATUS.LOCKED,
        },
        {
            $set: {
                status: REPORT_UNLOCK_STATUS.UNLOCKED,
                unlockedAt: now,
                simulatedPayment: {
                    status: "simulated_paid",
                    amountCents: unlock.depositCents,
                    confirmedAt: now,
                    reference: `simulated-report-${unlock._id.toString()}`,
                    idempotencyKeyHash,
                },
            },
        },
        { new: true, runValidators: true, session },
    ).select("+simulatedPayment.idempotencyKeyHash");
    assertAbortSignalActive(signal, "Pagamento simulado do relatório cancelado.");

    if (updated) return updated;

    query = ReportUnlock.findOne({ userId, reportId }).select(
        "+simulatedPayment.idempotencyKeyHash",
    );
    if (session) query = query.session(session);
    const winner = await query;
    assertAbortSignalActive(signal, "Pagamento simulado do relatório cancelado.");
    if (
        winner?.status === REPORT_UNLOCK_STATUS.UNLOCKED &&
        winner.simulatedPayment?.idempotencyKeyHash === idempotencyKeyHash
    ) {
        return winner;
    }

    throw new AppError(409, "O pagamento simulado do relatório entrou em conflito");
}
