/**
 * Service de revisão humana de sessões IA.
 *
 * Centraliza DTOs, decisões, criação de fila e audit trail para que controllers
 * e frontend não conheçam campos internos dos modelos.
 */
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { AiConsultationAuditLog } from "../models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Product } from "../models/product.model.js";
import { Profile } from "../models/profile.model.js";
import { buildPublicSourceLabels } from "./recommendation-reason.service.js";
import {
    resolveEffectiveRecommendationExplanation,
    resolveEffectiveRecommendationGuidance,
} from "../utils/recommendation-presentation.util.js";
import { assertSafeCosmeticPublicCopy } from "../utils/cosmetic-public-copy.util.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../models/face-report.model.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../models/ai-consultation-session.model.js";
import {
    ReportPhotoGrant,
    REPORT_PHOTO_GRANT_STATUSES,
} from "../models/report-photo-grant.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";
import { getProductRestrictionConflict } from "./recommendation-restrictions.service.js";
import {
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";
import {
    attachRecommendationIdsToRoutine,
    assertRoutineMatchesAllowedSlots,
    buildAllowedRoutineSlots,
} from "./report-routine-slots.service.js";
import {
    buildPublicReportSourceLabels,
    listReportRecommendationDtos,
} from "./report-recommendation-read.service.js";

const PRODUCT_SELECT = "name brandName imageUrl priceCents stock";
const LIST_STATUSES = ["pending", "needs_clarification"];
const FINAL_STATUSES = new Set(["approved", "adjusted"]);
const DETAIL_STATUSES = Object.freeze([...LIST_STATUSES]);
const CLIENT_INSIGHT_LIMIT = 20;
const MAX_SOURCE_LABELS = 8;
const MAX_LIMITATIONS = 6;

/**
 * Acrescenta um evento minimizado ao audit log sem o devolver nos DTOs.
 *
 * @async
 * @function recordConsultantReviewAudit
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {"list"|"detail"|"decision"} action - Operação auditada.
 * @param {{reviewId?: string|null, resultCount?: number|null, requestId?: string|null, session?: import("mongoose").ClientSession|null}} [context] - Correlação mínima.
 * @returns {Promise<void>}
 */
async function recordConsultantReviewAudit(actor, action, context = {}) {
    const documents = [
        {
            actorId: actor.id,
            actorRole: actor.role,
            action,
            reviewId: context.reviewId ?? null,
            resultCount: context.resultCount ?? null,
            requestId: context.requestId ?? null,
            occurredAt: new Date(),
        },
    ];

    await AiConsultationAuditLog.create(
        documents,
        context.session ? { session: context.session } : undefined,
    );
}

/**
 * Converte ObjectId ou valor simples para string segura.
 *
 * @function toId
 * @param {unknown} value - Valor persistido pelo Mongoose.
 * @returns {string|null} Identificador em string ou null.
 */
function toId(value) {
    if (!value) return null;

    return typeof value.toString === "function" ? value.toString() : String(value);
}

/**
 * Remove duplicados e valores vazios.
 *
 * @function uniqueCleanStrings
 * @param {unknown} values - Lista candidata.
 * @returns {string[]} Lista limpa.
 */
function uniqueCleanStrings(values) {
    return [
        ...new Set(
            (Array.isArray(values) ? values : []).map((value) =>
                String(value).trim(),
            ),
        ),
    ].filter(Boolean);
}

/**
 * Converte produto populado para DTO.
 *
 * @function toProductDto
 * @param {object|null} product - Produto populado na recomendação.
 * @returns {object|null} Produto minimizado.
 */
function toProductDto(product) {
    if (!product || !product._id) return null;

    return {
        id: toId(product._id),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

/**
 * Converte recomendação enriquecida para DTO de consultor.
 *
 * @function toRecommendationDto
 * @param {object} recommendation - Recomendação populada.
 * @returns {object} Recomendação minimizada.
 */
function toRecommendationDto(recommendation) {
    return {
        id: toId(recommendation._id),
        product: toProductDto(recommendation.productId),
        score: recommendation.score,
        status: recommendation.status,
        reasonCodes: recommendation.reasonCodes,
        explanation: resolveEffectiveRecommendationExplanation(recommendation),
        sourceLabels: buildPublicSourceLabels(recommendation.sourceSignals),
        limitations: recommendation.limitations,
    };
}

/**
 * Converte revisão para linha de fila.
 *
 * @function toReviewListDto
 * @param {object} review - Revisão persistida.
 * @returns {object} Linha segura de fila.
 */
function toReviewListDto(review) {
    return {
        id: toId(review._id),
        reportId: toId(review.reportId),
        reportVersion: review.reportVersion ?? null,
        status: review.status,
        summary: review.summary,
        sourceLabels: review.sourceLabels,
        limitations: review.limitations,
        recommendationCount: review.recommendationIds?.length ?? 0,
        hasPublicInsight: Boolean(review.publicInsight),
        requestedAt: review.requestedAt,
        reviewedAt: review.reviewedAt,
        updatedAt: review.updatedAt,
    };
}

/**
 * Converte revisão para detalhe de consultor.
 *
 * @function toReviewDetailDto
 * @param {object} review - Revisão persistida e populada.
 * @returns {object} Detalhe seguro para decisão humana.
 */
function toReviewDetailDto(review) {
    return {
        id: toId(review._id),
        reportId: toId(review.reportId),
        reportVersion: review.reportVersion ?? null,
        requestedAt: review.requestedAt,
        status: review.status,
        summary: review.summary,
        sourceLabels: review.sourceLabels,
        limitations: review.limitations,
        recommendations: (review.recommendationIds ?? []).map(toRecommendationDto),
        publicInsight: review.publicInsight,
        internalNote: review.internalNote,
        reviewedAt: review.reviewedAt,
        auditTrail: (review.auditTrail ?? []).map((event) => ({
            actorRole: event.actorRole,
            action: event.action,
            occurredAt: event.occurredAt,
        })),
    };
}

/**
 * Constrói resumo operacional da revisão pendente.
 *
 * @function buildReviewSummary
 * @param {object[]} recommendations - Recomendações criadas no BK-MF8-10.
 * @returns {string} Resumo seguro.
 */
function buildReviewSummary(recommendations) {
    const topRecommendation = recommendations[0];
    const productName = topRecommendation?.productId?.name ?? "produto recomendado";
    const count = recommendations.length;

    return `Sessão IA com ${count} recomendações enriquecidas para revisão humana. Principal sugestão: ${productName}.`;
}

/**
 * Extrai labels e limitações públicas das recomendações.
 *
 * @function buildReviewPublicContext
 * @param {object[]} recommendations - Recomendações geradas.
 * @returns {{sourceLabels: string[], limitations: string[]}} Contexto minimizado.
 */
function buildReviewPublicContext(recommendations) {
    const sourceSignals = recommendations.flatMap(
        (recommendation) => recommendation.sourceSignals ?? [],
    );
    const limitations = recommendations.flatMap(
        (recommendation) => recommendation.limitations ?? [],
    );

    return {
        sourceLabels: buildPublicSourceLabels(sourceSignals).slice(
            0,
            MAX_SOURCE_LABELS,
        ),
        limitations: uniqueCleanStrings(limitations).slice(0, MAX_LIMITATIONS),
    };
}

/**
 * Cria ou refresca uma revisão pendente para recomendações com sessão guiada.
 *
 * @async
 * @function createOrRefreshAiConsultationReviewForSession
 * @param {{userId: string, consultationSessionId: string, recommendations: object[], session?: import("mongoose").ClientSession|null}} input - Dados internos do BK-MF8-10.
 * @returns {Promise<void>}
 */
export async function createOrRefreshAiConsultationReviewForSession(input) {
    if (!input?.consultationSessionId || !Array.isArray(input.recommendations)) {
        return;
    }

    const recommendationIds = input.recommendations
        .map((recommendation) => recommendation?._id)
        .filter(Boolean);

    if (recommendationIds.length === 0) return;

    const publicContext = buildReviewPublicContext(input.recommendations);
    const summary = buildReviewSummary(input.recommendations);
    const generatedAt = new Date();

    await AiConsultationReview.findOneAndUpdate(
        {
            userId: input.userId,
            consultationSessionId: input.consultationSessionId,
        },
        {
            $set: {
                schemaVersion: 1,
                recommendationIds,
                summary,
                sourceLabels: publicContext.sourceLabels,
                limitations: publicContext.limitations,
                machineResult: {
                    recommendationIds,
                    summary,
                    sourceLabels: publicContext.sourceLabels,
                    limitations: publicContext.limitations,
                    generatedAt,
                },
            },
            $setOnInsert: {
                status: "pending",
                publicInsight: null,
                internalNote: null,
                reviewedBy: null,
                reviewedAt: null,
                auditTrail: [],
                humanOverride: null,
            },
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
            ...(input.session ? { session: input.session } : {}),
        },
    );
}

/**
 * Converte revisão publicada para DTO reutilizável pelo BK-MF8-12.
 *
 * @function toPublishedConsultantInsightDto
 * @param {object} review - Revisão humana persistida.
 * @returns {object|null} Insight público seguro ou null quando não existe publicação.
 */
export function toPublishedConsultantInsightDto(review) {
    if (!review?.publicInsight || !FINAL_STATUSES.has(review.status)) {
        return null;
    }

    const finalRecommendationIds = Array.isArray(
        review.humanOverride?.finalRecommendationIds,
    )
        ? new Set(review.humanOverride.finalRecommendationIds.map(toId))
        : null;
    const recommendations = (review.recommendationIds ?? [])
        .filter((recommendation) => {
            const recommendationId = toId(
                recommendation?._id ?? recommendation,
            );
            if (
                finalRecommendationIds &&
                !finalRecommendationIds.has(recommendationId)
            ) {
                return false;
            }
            return recommendation?.status !== "dismissed";
        })
        .map((recommendation) => {
            if (
                recommendation &&
                typeof recommendation === "object" &&
                recommendation._id
            ) {
                return toRecommendationDto(recommendation);
            }

            return { id: toId(recommendation) };
        })
        .filter((recommendation) => recommendation.id);

    return {
        id: toId(review._id),
        status: review.status,
        note: review.publicInsight.note,
        publishedAt: review.publicInsight.publishedAt,
        reviewedAt: review.reviewedAt,
        recommendations,
    };
}

/**
 * Lista insights públicos do consultor para o cliente autenticado.
 *
 * O ownership vem do `clientUserId` validado pela sessão. O filtro opcional
 * apenas restringe a sessão dentro dos dados desse cliente e nunca decide o
 * utilizador dono dos documentos.
 *
 * @async
 * @function listPublishedConsultantInsightsForClient
 * @param {string} clientUserId - ID do cliente autenticado.
 * @param {{consultationSessionId?: string|null}} [options={}] - Filtro opcional.
 * @returns {Promise<object[]>} Insights públicos publicados para o cliente.
 */
export async function listPublishedConsultantInsightsForClient(
    clientUserId,
    options = {},
) {
    const query = {
        userId: clientUserId,
        status: { $in: [...FINAL_STATUSES] },
        publicInsight: { $ne: null },
    };

    if (options.consultationSessionId) {
        query.consultationSessionId = options.consultationSessionId;
    }

    const reviews = await AiConsultationReview.find(query)
        .populate({
            path: "recommendationIds",
            select:
                "userId productId score status reasonCodes explanation sourceSignals limitations humanOverride",
            populate: { path: "productId", select: PRODUCT_SELECT },
        })
        .sort({ reviewedAt: -1, updatedAt: -1 })
        .limit(CLIENT_INSIGHT_LIMIT)
        .exec();

    const unlockedReports = await ReportUnlock.find({
        userId: clientUserId,
        reportId: { $in: reviews.map(({ reportId }) => reportId).filter(Boolean) },
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
    })
        .select("reportId")
        .lean();
    const unlockedReportIds = new Set(
        unlockedReports.map(({ reportId }) => toId(reportId)),
    );

    return reviews
        .filter((review) => unlockedReportIds.has(toId(review.reportId)))
        .map(toPublishedConsultantInsightDto)
        .filter(Boolean);
}

/**
 * Lista revisões pendentes para consultores/admins.
 *
 * @async
 * @function listAiConsultationReviewsForConsultant
 * @param {{id: string, role: string}} consultant - Ator autenticado.
 * @param {{requestId?: string|null}} [context] - Correlação minimizada.
 * @returns {Promise<object[]>} Fila minimizada de revisão humana.
 */
export async function listAiConsultationReviewsForConsultant(
    consultant,
    context = {},
) {
    const reviews = await AiConsultationReview.find({
        status: { $in: LIST_STATUSES },
    })
        .sort({ updatedAt: -1 })
        .limit(50)
        .exec();

    await recordConsultantReviewAudit(consultant, "list", {
        resultCount: reviews.length,
        requestId: context.requestId,
    });

    return reviews.map(toReviewListDto);
}

/**
 * Obtém detalhe de revisão para consultor/admin.
 *
 * @async
 * @function getAiConsultationReviewForConsultant
 * @param {{id: string, role: string}} consultant - Ator autenticado.
 * @param {string} reviewId - ID validado da revisão.
 * @param {{requestId?: string|null}} [context] - Correlação minimizada.
 * @returns {Promise<object>} Detalhe seguro da revisão.
 * @throws {AppError} Quando a revisão não existe.
 */
export async function getAiConsultationReviewForConsultant(
    consultant,
    reviewId,
    context = {},
) {
    const review = await AiConsultationReview.findOne({
        _id: reviewId,
        status: { $in: DETAIL_STATUSES },
    })
        .populate({
            path: "recommendationIds",
            select:
                "userId productId score status reasonCodes explanation sourceSignals limitations humanOverride",
            populate: { path: "productId", select: PRODUCT_SELECT },
        })
        .exec();

    if (!review) {
        throw new AppError(404, "Revisão não encontrada");
    }

    const [report, photoGrant] = review.reportId
        ? await Promise.all([
              FaceReport.findOne({
                  _id: review.reportId,
                  userId: review.userId,
                  privacyStatus: "active",
              }),
              ReportPhotoGrant.findOne({
                  reviewId: review._id,
                  status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                  revokedAt: null,
                  expiresAt: { $gt: new Date() },
              }),
          ])
        : [null, null];

    const recommendations = report
        ? await listReportRecommendationDtos(report, review.userId)
        : null;
    const effectiveContent = report?.machineResult ?? null;
    const effectiveRoutine = report
        ? attachRecommendationIdsToRoutine(
              effectiveContent?.routine ?? report.routineSuggestions ?? [],
              recommendations,
          )
        : null;

    await recordConsultantReviewAudit(consultant, "detail", {
        reviewId,
        resultCount: 1,
        requestId: context.requestId,
    });

    return {
        ...toReviewDetailDto(review),
        ...(recommendations ? { recommendations } : {}),
        report: report
            ? {
                  schemaVersion: report.schemaVersion,
                  version: report.version,
                  generatedAt:
                      report.providerMetadata?.generatedAt ?? report.createdAt,
                  requestedAt: review.requestedAt,
                  objectives: report.objectives,
                  content: {
                      observations: effectiveContent?.observations ?? [],
                      answerSummary:
                          report.answerSummary ??
                          effectiveContent?.answerSummary ??
                          null,
                      assessment:
                          effectiveContent?.objectivesAssessment ??
                          report.cosmeticSummary ??
                          null,
                      photoQuality:
                          report.photoQuality ??
                          effectiveContent?.photoQuality ??
                          null,
                      safetyFlags: effectiveContent?.safetyFlags ?? [],
                      routine: effectiveRoutine,
                  },
                  routine: effectiveRoutine,
                  limitations: report.limitations,
                  sourceLabels: buildPublicReportSourceLabels(report.sources),
                  provenance: {
                      provider: report.providerMetadata?.provider ?? null,
                      generatedAt:
                          report.providerMetadata?.generatedAt ?? null,
                      responseSchemaVersion:
                          report.providerMetadata?.responseSchemaVersion ?? null,
                  },
                  visualization: report.visualizationSpec
                      ? {
                            enabled: Boolean(report.visualizationSpec.enabled),
                            objectives:
                                report.visualizationSpec.objectives ?? [],
                            regions:
                                report.visualizationSpec.regions ??
                                report.visualizationSpec.makeup
                                    ?.effectiveRegions ??
                                [],
                            requiresVariantConfirmation: Boolean(
                                report.visualizationSpec.makeup
                                    ?.requiresVariantConfirmation,
                            ),
                        }
                      : null,
              }
            : null,
        photoAccess: {
            granted: Boolean(photoGrant),
            expiresAt: photoGrant?.expiresAt ?? null,
        },
    };
}

/**
 * Garante que recomendações ajustadas pertencem à revisão aberta.
 *
 * @function assertRecommendationsBelongToReview
 * @param {object} review - Revisão populada.
 * @param {string[]} recommendationIds - IDs validados.
 * @returns {void}
 * @throws {AppError} Quando alguma recomendação não pertence à revisão.
 */
function assertRecommendationsBelongToReview(review, recommendationIds) {
    if (recommendationIds.length === 0) return;

    const allowedIds = new Set(
        (review.recommendationIds ?? []).map((recommendation) =>
            toId(recommendation._id ?? recommendation),
        ),
    );
    const hasForeignRecommendation = recommendationIds.some(
        (recommendationId) => !allowedIds.has(recommendationId),
    );

    if (hasForeignRecommendation) {
        throw new AppError(400, "Recomendação ajustada fora da revisão");
    }
}

/**
 * Exige uma orientação por cada produto mantido, sem permitir produtos externos
 * ou diferenças silenciosas entre a seleção e o conteúdo publicado.
 */
function assertAdjustedRecommendationGuidance(review, input) {
    const guidance = input.adjustedContent?.recommendations;
    if (Number(review.schemaVersion ?? 1) < 2 || !review.reportId) return;
    if (!Array.isArray(guidance)) {
        throw new AppError(
            400,
            "A orientação ajustada é obrigatória para todos os produtos mantidos",
            { code: "ADJUSTED_RECOMMENDATIONS_REQUIRED" },
        );
    }

    const selectedIds = normalizeRecommendationSelection(
        input.adjustedRecommendationIds,
    );
    const guidanceIds = normalizeRecommendationSelection(
        guidance.map(({ recommendationId }) => recommendationId),
    );
    if (!isDeepStrictEqual(selectedIds, guidanceIds)) {
        throw new AppError(
            400,
            "A orientação deve conter exatamente os produtos mantidos",
            { code: "ADJUSTED_RECOMMENDATIONS_MISMATCH" },
        );
    }

    try {
        assertSafeCosmeticPublicCopy(input.adjustedContent);
    } catch (error) {
        throw new AppError(400, error.message, {
            code: "UNSAFE_ADJUSTED_COPY",
        });
    }
}

/** Constrói um mapa da orientação normalizada enviada pelo consultor. */
function buildAdjustedGuidanceById(input) {
    return new Map(
        (input.adjustedContent?.recommendations ?? []).map((guidance) => [
            String(guidance.recommendationId),
            guidance,
        ]),
    );
}

/** Normaliza uma seleção como conjunto ordenado para comparar subsets. */
function normalizeRecommendationSelection(values = []) {
    return [
        ...new Set(
            values
                .map((value) => toId(value?._id ?? value))
                .filter(Boolean),
        ),
    ].sort();
}

/** Mantém apenas os campos persistíveis da rotina para comparação semântica. */
function normalizeRoutineForComparison(routine) {
    if (!Array.isArray(routine)) return [];

    return routine.map((step) => ({
        routineSlotCode: String(step?.routineSlotCode ?? ""),
        period: String(step?.period ?? ""),
        priority: String(step?.priority ?? ""),
        title: String(step?.title ?? "").trim(),
        reason: String(step?.reason ?? "").trim(),
        instructions: String(step?.instructions ?? "").trim(),
        cautions: (Array.isArray(step?.cautions) ? step.cautions : []).map(
            (caution) => String(caution).trim(),
        ),
    }));
}

/**
 * Garante que um ajuste humano v6 não deixa passos associados a produtos que
 * já não pertencem à seleção final. Relatórios legacy continuam sem inferência.
 */
function assertAdjustedRoutineSlotCoverage(
    report,
    routine,
    recommendations,
    recommendationIds,
) {
    const originalRoutine = report?.machineResult?.routine ?? [];
    const isV6 =
        report?.providerMetadata?.responseSchemaVersion ===
            "cosmetic-report-schema-v6" ||
        originalRoutine.some(({ routineSlotCode }) => Boolean(routineSlotCode));
    if (!isV6) return;

    const selectedIds = new Set(recommendationIds.map(String));
    const selectedSnapshots = (recommendations ?? [])
        .filter(({ _id }) => selectedIds.has(toId(_id)))
        .map(({ productSnapshot }) => productSnapshot)
        .filter(Boolean);
    const allowedSlots = buildAllowedRoutineSlots(selectedSnapshots);
    try {
        assertRoutineMatchesAllowedSlots(routine, allowedSlots);
    } catch {
        throw new AppError(
            400,
            "A rotina ajustada contém passos sem produtos correspondentes ou omite passos da seleção final.",
            { code: "ROUTINE_SLOT_COVERAGE_INVALID" },
        );
    }
}

/**
 * Recusa o estado `adjusted` quando o payload não muda realmente o relatório.
 * A comparação é feita contra a versão OpenAI em revisão, não contra valores
 * fornecidos pelo browser. Uma seleção vazia é uma alteração válida quando o
 * relatório tinha produtos; num relatório sem produtos exige-se texto ou rotina.
 */
function assertMaterialReviewAdjustment(review, report, input) {
    const originalRecommendationIds = normalizeRecommendationSelection(
        review.recommendationIds,
    );
    const adjustedRecommendationIds = normalizeRecommendationSelection(
        input.adjustedRecommendationIds,
    );
    const productsChanged = report
        ? !isDeepStrictEqual(
              adjustedRecommendationIds,
              originalRecommendationIds,
          )
        : adjustedRecommendationIds.length > 0;

    const adjustedAssessment = input.adjustedContent?.assessment ?? null;
    const originalAssessment =
        report?.machineResult?.objectivesAssessment ?? null;
    const assessmentChanged = Boolean(
        report &&
            adjustedAssessment !== null &&
            String(adjustedAssessment).trim() !==
                String(originalAssessment ?? "").trim(),
    );

    const adjustedRoutine = input.adjustedContent?.routine ?? null;
    const routineChanged = Boolean(
        report &&
            adjustedRoutine !== null &&
            !isDeepStrictEqual(
                normalizeRoutineForComparison(adjustedRoutine),
                normalizeRoutineForComparison(report.machineResult?.routine),
            ),
    );

    const guidanceById = buildAdjustedGuidanceById(input);
    const guidanceChanged = (review.recommendationIds ?? []).some(
        (recommendation) => {
            const recommendationId = toId(recommendation._id);
            const adjusted = guidanceById.get(recommendationId);
            if (!adjusted) return false;
            const original = resolveEffectiveRecommendationGuidance(
                recommendation,
            );
            return !isDeepStrictEqual(
                {
                    explanation: String(adjusted.explanation).trim(),
                    usage: String(adjusted.usage).trim(),
                    cautions: adjusted.cautions,
                },
                {
                    explanation: String(original.explanation ?? "").trim(),
                    usage: String(original.usage ?? "").trim(),
                    cautions: original.cautions ?? [],
                },
            );
        },
    );

    if (
        !productsChanged &&
        !assessmentChanged &&
        !routineChanged &&
        !guidanceChanged
    ) {
        throw new AppError(
            400,
            "Indica pelo menos um ajuste material ao texto, à rotina ou aos produtos.",
            { code: "MATERIAL_ADJUSTMENT_REQUIRED" },
        );
    }
}

/**
 * Relê catálogo e perfil no boundary da decisão humana para impedir que uma
 * revisão antiga congele produtos, variantes, alergias, preços ou stock que já
 * mudaram.
 * @param {object} review - Revisão v2 ainda aberta.
 * @param {string[]} recommendationIds - Subset escolhido pelo consultor.
 * @param {{report: object|null, session?: import("mongoose").ClientSession|null}} context - Relatório autoritativo e transação da decisão.
 * @function revalidateReviewRecommendations
 * @returns {Promise<void>}
 * @throws {AppError} Quando o snapshot deixou de ser elegível.
 */
function reviewStale(message, reason) {
    return new AppError(409, message, {
        code: "REVIEW_STALE",
        reason,
    });
}

/**
 * Revalida a seleção final contra catálogo, perfil e objetivos autoritativos.
 *
 * @function revalidateReviewRecommendations
 */
export async function revalidateReviewRecommendations(
    review,
    recommendationIds,
    { report, session = null } = {},
) {
    if (Number(review.schemaVersion ?? 1) < 2) {
        return;
    }

    const reportMatchesReview = Boolean(
        report &&
            toId(report._id) === toId(review.reportId) &&
            toId(report.userId) === toId(review.userId) &&
            Number(report.version) === Number(review.reportVersion),
    );
    const goalCodes = [
        ...new Set(
            (report?.objectives ?? [])
                .map(({ code }) => String(code ?? "").trim())
                .filter(Boolean),
        ),
    ];
    if (!reportMatchesReview || goalCodes.length === 0) {
        throw reviewStale(
            "Objetivos congelados do relatório indisponíveis para revalidação",
            "report_objectives_unavailable",
        );
    }
    if (recommendationIds.length === 0) {
        return;
    }
    const allowedConcernTags = new Set(goalCodes);

    const uniqueIds = [...new Set(recommendationIds.map(String))];
    let recommendationsQuery = ProductRecommendation.find({
        _id: { $in: uniqueIds },
        userId: review.userId,
        reportId: review.reportId,
        schemaVersion: 2,
        reportVersion: review.reportVersion,
    }).select("_id userId productId variantId productSnapshot");
    let profileQuery = Profile.findOne({ userId: review.userId });
    if (session) {
        recommendationsQuery = recommendationsQuery.session(session);
        profileQuery = profileQuery.session(session);
    }
    // O driver MongoDB não suporta operações paralelas na mesma ClientSession.
    const recommendations = await recommendationsQuery;
    const profile = await profileQuery;
    if (recommendations.length !== uniqueIds.length || !profile) {
        throw reviewStale(
            "Recomendações ou perfil mudaram durante a revisão",
            "recommendations_or_profile_changed",
        );
    }

    let productsQuery = Product.find({
        _id: { $in: recommendations.map(({ productId }) => productId) },
    }).select(
        "aiEligible concernTags ingredientNames inciIngredients priceCents stock variants",
    );
    if (session) productsQuery = productsQuery.session(session);
    const products = await productsQuery;
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    for (const recommendation of recommendations) {
        const product = productsById.get(recommendation.productId.toString());
        if (!product?.aiEligible) {
            throw reviewStale(
                "Produto deixou de estar elegível para IA",
                "product_ineligible",
            );
        }
        const matchesFrozenObjective = (product.concernTags ?? []).some(
            (tag) => allowedConcernTags.has(String(tag)),
        );
        if (!matchesFrozenObjective) {
            throw reviewStale(
                "Produto deixou de ser compatível com os objetivos do relatório",
                "product_objective_mismatch",
            );
        }
        if (getProductRestrictionConflict(product, profile).blocked) {
            throw reviewStale(
                "O perfil passou a bloquear um produto da revisão",
                "profile_restriction_changed",
            );
        }

        let variant;
        try {
            variant = resolveProductVariant(product, recommendation.variantId);
        } catch {
            throw reviewStale(
                "Variante recomendada deixou de estar disponível",
                "variant_unavailable",
            );
        }
        const snapshot = recommendation.productSnapshot;
        const currentPriceCents = resolveVariantPriceCents(product, variant);
        const currentStock = resolveVariantStock(product, variant);
        if (
            !snapshot ||
            snapshot.priceCents !== currentPriceCents ||
            snapshot.stock !== currentStock
        ) {
            throw reviewStale(
                "Preço ou stock mudou; atualiza a revisão antes de decidir",
                "price_or_stock_changed",
            );
        }
    }
}

/** Alias de compatibilidade para consumidores e testes anteriores à v6. */
export const revalidateAdjustedRecommendations =
    revalidateReviewRecommendations;

/**
 * Persiste a decisão canónica em todas as recomendações da revisão.
 *
 * Produtos mantidos sem redação alterada ficam `accepted`, redação alterada
 * fica `adjusted` e produtos removidos ficam `dismissed`.
 */
async function applyRecommendationDecision(
    review,
    input,
    reviewedAt,
    session,
) {
    const finalIds = new Set(
        (input.decision === "adjusted"
            ? input.adjustedRecommendationIds
            : normalizeRecommendationSelection(review.recommendationIds)
        ).map(String),
    );
    const guidanceById = buildAdjustedGuidanceById(input);

    for (const recommendation of review.recommendationIds ?? []) {
        const recommendationId = toId(recommendation._id ?? recommendation);
        const retained = finalIds.has(recommendationId);
        const adjustedGuidance = guidanceById.get(recommendationId);
        const originalGuidance = resolveEffectiveRecommendationGuidance(
            recommendation,
        );
        const guidanceChanged = Boolean(
            retained &&
                input.decision === "adjusted" &&
                adjustedGuidance &&
                !isDeepStrictEqual(
                    {
                        explanation: adjustedGuidance.explanation,
                        usage: adjustedGuidance.usage,
                        cautions: adjustedGuidance.cautions,
                    },
                    {
                        explanation: originalGuidance.explanation,
                        usage: originalGuidance.usage,
                        cautions: originalGuidance.cautions,
                    },
                ),
        );
        const status = retained
            ? guidanceChanged
                ? "adjusted"
                : "accepted"
            : "dismissed";
        const humanOverride = guidanceChanged
            ? {
                  decision: "adjusted",
                  adjustedExplanation: adjustedGuidance.explanation,
                  adjustedUsage: adjustedGuidance.usage,
                  adjustedCautions: adjustedGuidance.cautions,
                  note: input.publicNote,
                  reviewId: review._id,
                  reviewedAt,
              }
            : {
                  decision: status,
                  note: input.publicNote,
                  reviewId: review._id,
                  reviewedAt,
              };
        const result = await ProductRecommendation.updateOne(
            {
                _id: recommendationId,
                userId: review.userId,
                ...(review.reportId ? { reportId: review.reportId } : {}),
                humanOverride: null,
            },
            {
                $set: {
                    status,
                    consultantNote: input.publicNote,
                    humanOverride,
                },
            },
            session ? { session } : undefined,
        );
        if (Number.isInteger(result?.matchedCount) && result.matchedCount !== 1) {
            throw new AppError(409, "Recomendação já tem decisão humana");
        }
    }
}

/**
 * Regista decisão humana de consultor/admin.
 *
 * @async
 * @function decideAiConsultationReview
 * @param {{id: string, role: string}} consultant - Utilizador autenticado.
 * @param {{reviewId: string, decision: string, publicNote: string|null, internalNote: string|null, adjustedRecommendationIds: string[]}} input - Decisão validada.
 * @param {{requestId?: string|null}} [context] - Correlação minimizada.
 * @returns {Promise<object>} Detalhe atualizado.
 * @throws {AppError} Quando a revisão não existe ou já está fechada.
 */
export async function decideAiConsultationReview(
    consultant,
    input,
    context = {},
) {
    const session =
        mongoose.connection.readyState === 1
            ? await mongoose.startSession()
            : null;
    let decidedReview;

    const executeDecision = async () => {
        let initialQuery = AiConsultationReview.findById(input.reviewId).populate({
            path: "recommendationIds",
            select:
                "userId productId variantId productSnapshot score status reasonCodes explanation sourceSignals limitations machineResult humanOverride",
            populate: { path: "productId", select: PRODUCT_SELECT },
        });
        if (session) initialQuery = initialQuery.session(session);
        const review = await initialQuery.exec();

        if (!review) {
            throw new AppError(404, "Revisão não encontrada");
        }

        if (FINAL_STATUSES.has(review.status) || review.humanOverride) {
            throw new AppError(409, "Revisão já fechada");
        }

        assertRecommendationsBelongToReview(
            review,
            input.adjustedRecommendationIds,
        );

        let currentReport = null;
        if (review.schemaVersion >= 2 && review.reportId) {
            let reportQuery = FaceReport.findOne({
                _id: review.reportId,
                userId: review.userId,
                reviewId: review._id,
                schemaVersion: 2,
                version: review.reportVersion,
                lifecycleStatus: FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
            });
            if (session) reportQuery = reportQuery.session(session);
            currentReport = await reportQuery;
            if (!currentReport) {
                throw reviewStale(
                    "Relatório de revisão mudou concorrentemente",
                    "report_changed",
                );
            }
        }

        if (input.decision === "adjusted") {
            assertAdjustedRecommendationGuidance(review, input);
            assertMaterialReviewAdjustment(review, currentReport, input);
            assertAdjustedRoutineSlotCoverage(
                currentReport,
                input.adjustedContent?.routine ??
                    currentReport?.machineResult?.routine ??
                    [],
                review.recommendationIds,
                input.adjustedRecommendationIds,
            );
        }

        const finalRecommendationIds =
            input.decision === "adjusted"
                ? input.adjustedRecommendationIds
                : normalizeRecommendationSelection(review.recommendationIds);
        if (FINAL_STATUSES.has(input.decision) && currentReport) {
            await revalidateReviewRecommendations(
                review,
                finalRecommendationIds,
                { report: currentReport, session },
            );
        }

        const now = new Date();
        const publicInsight = input.publicNote
            ? { note: input.publicNote, publishedAt: now }
            : null;
        const humanOverride = {
            decision: input.decision,
            publicNote: input.publicNote,
            internalNote: input.internalNote,
            reviewId: review._id,
            reviewedAt: now,
            ...(FINAL_STATUSES.has(input.decision)
                ? { finalRecommendationIds }
                : {}),
        };

        decidedReview = await AiConsultationReview.findOneAndUpdate(
            {
                _id: input.reviewId,
                userId: review.userId,
                status: { $in: LIST_STATUSES },
                humanOverride: null,
            },
            {
                $set: {
                    status: input.decision,
                    reviewedBy: consultant.id,
                    reviewedAt: now,
                    internalNote: input.internalNote,
                    publicInsight,
                    humanOverride,
                },
                $push: {
                    auditTrail: {
                        actorId: consultant.id,
                        actorRole: consultant.role,
                        action: input.decision,
                        occurredAt: now,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
                ...(session ? { session } : {}),
            },
        )
            .populate({
                path: "recommendationIds",
                select:
                    "userId productId variantId score status reasonCodes explanation sourceSignals limitations machineResult humanOverride",
                populate: { path: "productId", select: PRODUCT_SELECT },
            })
            .exec();

        if (!decidedReview) {
            throw new AppError(409, "Revisão já fechada");
        }

        if (FINAL_STATUSES.has(input.decision)) {
            await applyRecommendationDecision(review, input, now, session);
        }

        if (review.schemaVersion >= 2 && review.reportId) {
            const needsClarification =
                input.decision === "needs_clarification";
            const nextLifecycle = needsClarification
                ? FACE_REPORT_LIFECYCLE.NEEDS_CLARIFICATION
                : FACE_REPORT_LIFECYCLE.DRAFT_READY;
            const adjustedIds = new Set(
                input.adjustedRecommendationIds.map(String),
            );
            const adjustedGuidanceById = buildAdjustedGuidanceById(input);
            const adjustedRecommendations = (review.recommendationIds ?? [])
                .filter((recommendation) =>
                    adjustedIds.has(toId(recommendation._id)),
                )
                .map((recommendation) => {
                    const adjustedGuidance = adjustedGuidanceById.get(
                        toId(recommendation._id),
                    );
                    return {
                        productId: toId(
                            recommendation.productId?._id ??
                                recommendation.productId,
                        ),
                        variantId: recommendation.variantId ?? null,
                        reason: adjustedGuidance.explanation,
                        usage: adjustedGuidance.usage,
                        cautions: adjustedGuidance.cautions,
                        score: recommendation.score,
                    };
                });
            const adjustedSelectionSupportsSimulation =
                adjustedRecommendations.some(({ variantId }) =>
                    Boolean(variantId),
                );
            const currentVisualizationSpec =
                currentReport.visualizationSpec ?? currentReport.simulationSpec;
            const adjustedIdSet = new Set(
                (input.adjustedRecommendationIds ?? []).map(String),
            );
            const adjustedVisualizationSpec = currentVisualizationSpec?.objectives
                ? {
                      ...currentVisualizationSpec,
                      objectives: adjustedSelectionSupportsSimulation
                          ? currentVisualizationSpec.objectives
                          : currentVisualizationSpec.objectives.filter(
                                ({ code }) => code !== "makeup",
                            ),
                      variantRecommendationIds: (
                          currentVisualizationSpec.variantRecommendationIds ?? []
                      ).filter((id) => adjustedIdSet.has(String(id))),
                      makeup: adjustedSelectionSupportsSimulation
                          ? currentVisualizationSpec.makeup
                          : {
                                ...currentVisualizationSpec.makeup,
                                effectiveRegions: [],
                                requiresVariantConfirmation: false,
                            },
                  }
                : currentVisualizationSpec
                  ? adjustedSelectionSupportsSimulation
                      ? currentVisualizationSpec
                      : {
                            enabled: false,
                            regions: [],
                            lookDescription: null,
                            preserve: [],
                        }
                  : null;
            if (adjustedVisualizationSpec) {
                adjustedVisualizationSpec.enabled =
                    Array.isArray(adjustedVisualizationSpec.objectives) &&
                    adjustedVisualizationSpec.objectives.length > 0;
            }
            const reportHumanOverride =
                input.decision === "adjusted"
                    ? {
                          ...currentReport.machineResult,
                          objectivesAssessment:
                              input.adjustedContent?.assessment ??
                              currentReport.machineResult?.objectivesAssessment,
                          routine:
                              input.adjustedContent?.routine ??
                              currentReport.machineResult?.routine,
                          recommendations: adjustedRecommendations,
                          humanReview: {
                              decision: input.decision,
                              publicNote: input.publicNote,
                                  adjustedRecommendationIds:
                                      input.adjustedRecommendationIds,
                                  finalRecommendationIds,
                              reviewedAt: now,
                              reviewId: review._id,
                          },
                      }
                    : null;
            const report = await FaceReport.findOneAndUpdate(
                {
                    _id: review.reportId,
                    userId: review.userId,
                    reviewId: review._id,
                    schemaVersion: 2,
                    version: review.reportVersion,
                    lifecycleStatus: FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
                },
                {
                    $set: {
                        lifecycleStatus: nextLifecycle,
                        humanOverride: reportHumanOverride,
                        ...(input.decision === "adjusted"
                            ? {
                                  finalRecommendationIds:
                                      input.adjustedRecommendationIds,
                                  ...(input.adjustedContent?.routine
                                      ? {
                                            routineSuggestions:
                                                input.adjustedContent.routine,
                                        }
                                      : {}),
                                  ...(adjustedVisualizationSpec
                                      ? {
                                            visualizationSpec:
                                                adjustedVisualizationSpec,
                                            simulationSpec:
                                                adjustedVisualizationSpec,
                                        }
                                      : {}),
                              }
                            : input.decision === "approved"
                              ? { finalRecommendationIds }
                              : {}),
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    ...(session ? { session } : {}),
                },
            );
            if (!report) {
                throw reviewStale(
                    "Relatório de revisão mudou concorrentemente",
                    "report_changed",
                );
            }
            let consultationQuery = AiConsultationSession.findOne({
                _id: report.consultationSessionId,
                userId: review.userId,
            });
            if (session) consultationQuery = consultationQuery.session(session);
            const consultation = await consultationQuery;
            if (!consultation) {
                throw new AppError(409, "Sessão da revisão não encontrada");
            }
            consultation.flowState = needsClarification
                ? AI_CONSULTATION_FLOW_STATES.NEEDS_CLARIFICATION
                : AI_CONSULTATION_FLOW_STATES.DRAFT_READY;
            consultation.currentReviewId = needsClarification
                ? review._id
                : null;
            if (needsClarification) {
                consultation.conversation = {
                    ...(consultation.conversation ?? {}),
                    currentQuestion: {
                        id: `clarification:${review._id.toString()}`,
                        revision: consultation.revision,
                        slotCode: `human_clarification:${review._id.toString()}`,
                        type: "short_text",
                        label: input.publicNote,
                        options: [],
                        maxLength: 600,
                        source: "human_review",
                    },
                };
            }
            await consultation.save(session ? { session } : undefined);

            if (!needsClarification) {
                await ReportPhotoGrant.updateOne(
                    {
                        reviewId: review._id,
                        status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                    },
                    {
                        $set: {
                            status: REPORT_PHOTO_GRANT_STATUSES.REVOKED,
                            revokedAt: now,
                            revocationReason: "review_completed",
                        },
                    },
                    session ? { session } : undefined,
                );
            }
        }
        await recordConsultantReviewAudit(consultant, "decision", {
            reviewId: input.reviewId,
            resultCount: 1,
            requestId: context.requestId,
            session,
        });
    };

    try {
        if (session) {
            await session.withTransaction(executeDecision);
        } else {
            await executeDecision();
        }

        return {
            id: toId(decidedReview._id),
            status: decidedReview.status,
            publicInsight: decidedReview.publicInsight,
            reviewedAt: decidedReview.reviewedAt,
        };
    } finally {
        await session?.endSession();
    }
}
