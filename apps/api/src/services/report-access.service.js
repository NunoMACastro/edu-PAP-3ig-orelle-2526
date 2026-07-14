/**
 * Acesso, teaser e congelamento de relatórios v2.
 * Conteúdo sensível nunca é incluído no DTO enquanto o gate estiver fechado.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
    AI_CONSULTATION_STATUS,
} from "../models/ai-consultation-session.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { ReportPhotoGrant } from "../models/report-photo-grant.model.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import {
    REPORT_UNLOCK_STATUS,
    ReportUnlock,
} from "../models/report-unlock.model.js";
import { Voucher } from "../models/voucher.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../models/makeup-simulation.model.js";
import {
    calculateAcademicDepositCents,
    freezeReportUnlockSnapshot,
    toReportAccessDto,
} from "./report-unlock.service.js";
import { toVoucherDto } from "./voucher.service.js";
import { hashCanonicalSnapshot } from "./consultation-report.service.js";
import {
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";
import {
    CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION,
    GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
    GENERATIVE_MAKEUP_NOTICE_VERSION,
} from "../constants/purpose-grants.js";
import { attachRecommendationIdsToRoutine } from "./report-routine-slots.service.js";
import { listReportRecommendationDtos } from "./report-recommendation-read.service.js";

const FINAL_REVIEW_STATUSES = new Set(["approved", "adjusted"]);

function id(value) {
    return value?.toString?.() ?? String(value);
}

function toTeaser(
    report,
    unlock = null,
    review = null,
    photoGrant = null,
    draftAccess = null,
) {
    const access = unlock
        ? toReportAccessDto(unlock)
        : draftAccess ?? {
              status: "draft",
              recommendedTotalCents: null,
              depositCents: null,
              recommendationCount: report.finalRecommendationIds?.length ?? 0,
              availableRecommendationCount: null,
              requiresPayment: null,
              payment: null,
          };
    return {
        id: id(report._id),
        schemaVersion: report.schemaVersion,
        version: report.version,
        lifecycleStatus: report.lifecycleStatus,
        objectives: report.objectives,
        createdAt: report.createdAt,
        frozenAt: report.frozenAt,
        review: review
            ? {
                  id: id(review._id),
                  status: review.status,
                  clarificationQuestion:
                      review.status === "needs_clarification"
                          ? review.publicInsight?.note ?? null
                          : null,
                  photoAccess: {
                      granted: Boolean(photoGrant),
                      expiresAt: photoGrant?.expiresAt ?? null,
                  },
              }
            : report.reviewId
              ? { id: id(report.reviewId), status: "unknown" }
              : null,
        access,
        consentNotices: {
            consultantPhotoAccess:
                CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION,
            generativeMakeup: GENERATIVE_MAKEUP_NOTICE_VERSION,
            generativeCosmeticVisualization:
                GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
        },
        locked: unlock?.status !== REPORT_UNLOCK_STATUS.UNLOCKED,
    };
}

async function calculateDraftReportAccess(report, userId) {
    const recommendationIds = report.finalRecommendationIds ?? [];
    const recommendations = await ProductRecommendation.find({
        _id: { $in: recommendationIds },
        reportId: report._id,
        userId,
        schemaVersion: 2,
    }).select("userId productId variantId productSnapshot");
    const products = await Product.find({
        _id: { $in: recommendations.map(({ productId }) => productId) },
    }).select("priceCents stock variants");
    const productsById = new Map(
        products.map((product) => [id(product._id), product]),
    );
    let recommendedTotalCents = 0;
    let availableRecommendationCount = 0;
    for (const recommendation of recommendations) {
        const product = productsById.get(id(recommendation.productId));
        if (!product) continue;
        try {
            const variant = resolveProductVariant(
                product,
                recommendation.variantId,
            );
            if (resolveVariantStock(product, variant) <= 0) continue;
            availableRecommendationCount += 1;
            recommendedTotalCents += resolveVariantPriceCents(product, variant);
        } catch {
            // Produto removido/variante inválida não entra no teaser elegível.
        }
    }
    const depositCents = calculateAcademicDepositCents(
        recommendedTotalCents,
    );
    return {
        status: "draft",
        recommendedTotalCents,
        depositCents,
        recommendationCount: recommendationIds.length,
        availableRecommendationCount,
        requiresPayment: depositCents > 0,
        unlockedAt: null,
        payment: {
            mode: "simulated",
            status: depositCents > 0 ? "awaiting_simulation" : "not_required",
            simulationReference: null,
            simulatedAt: null,
            message:
                "Demonstração académica — não será efetuada qualquer cobrança.",
        },
    };
}

function toLatestMakeupSimulationDto(simulation, { legacy = false } = {}) {
    if (!simulation) return null;
    const imageAvailable =
        simulation.status === MAKEUP_SIMULATION_STATUSES.COMPLETED &&
        simulation.expiresAt > new Date();
    return {
        id: id(simulation._id),
        reportId: id(simulation.reportId),
        status: imageAvailable
            ? simulation.status
            : simulation.status === MAKEUP_SIMULATION_STATUSES.COMPLETED
              ? MAKEUP_SIMULATION_STATUSES.EXPIRED
              : simulation.status,
        imageUrl: imageAvailable
            ? legacy
                ? `/api/makeup-simulations/${id(simulation._id)}/image`
                : `/api/cosmetic-visualizations/${id(simulation._id)}/image`
            : null,
        intensity: simulation.intensity ?? "balanced",
        effectCodes: simulation.effectCodes ?? [],
        omittedEffects: simulation.omittedEffects ?? [],
        feedback: simulation.feedback ?? null,
        expiresAt: simulation.expiresAt,
        provider: simulation.requestedModel
            ? {
                  name: "openai",
                  requestedModel: simulation.requestedModel,
                  effectiveModel: simulation.effectiveModel ?? null,
              }
            : null,
        warning:
            "Pré-visualização gerada por IA — o resultado real poderá variar.",
        createdAt: simulation.createdAt,
        updatedAt: simulation.updatedAt,
    };
}

/** Devolve teaser ou conteúdo completo segundo o gate do próprio titular. */
export async function getFaceReportV2ForUser(userId, reportId) {
    const report = await FaceReport.findOne({
        _id: reportId,
        userId,
        schemaVersion: 2,
        privacyStatus: "active",
    });
    if (!report) throw new AppError(404, "Relatório não encontrado");

    const [unlock, review, latestMakeupSimulation] = await Promise.all([
        ReportUnlock.findOne({ userId, reportId }),
        report.reviewId
            ? AiConsultationReview.findOne({
                  _id: report.reviewId,
                  userId,
                  reportId,
              })
            : null,
        MakeupSimulation.findOne({
            userId,
            reportId,
            schemaVersion: { $gte: 2 },
        })
            .select("+omittedEffects +feedback")
            .sort({
                createdAt: -1,
            }),
    ]);
    const [draftAccess, voucher] = await Promise.all([
        unlock ? null : calculateDraftReportAccess(report, userId),
        unlock?.status === REPORT_UNLOCK_STATUS.UNLOCKED
            ? Voucher.findOne({
                  userId,
                  sourceReportUnlockId: unlock._id,
              })
            : null,
    ]);
    const photoGrant = review
        ? await ReportPhotoGrant.findOne({
              reviewId: review._id,
              clientUserId: userId,
              status: "active",
              revokedAt: null,
              expiresAt: { $gt: new Date() },
          })
        : null;
    const teaser = {
        ...toTeaser(report, unlock, review, photoGrant, draftAccess),
        voucher: toVoucherDto(voucher),
        makeupSimulation:
            unlock?.status === REPORT_UNLOCK_STATUS.UNLOCKED
                ? toLatestMakeupSimulationDto(latestMakeupSimulation, {
                      legacy: true,
                  })
                : null,
        visualization:
            unlock?.status === REPORT_UNLOCK_STATUS.UNLOCKED
                ? toLatestMakeupSimulationDto(latestMakeupSimulation)
                : null,
    };
    if (unlock?.status !== REPORT_UNLOCK_STATUS.UNLOCKED) return teaser;

    const effectiveContent = report.humanOverride ?? report.machineResult ?? {};
    const recommendations = await listReportRecommendationDtos(report, userId, {
        includeClientOnlyFields: true,
    });
    const effectiveRoutine =
        effectiveContent?.routine ?? report.routineSuggestions ?? [];
    const routine = attachRecommendationIdsToRoutine(
        effectiveRoutine,
        recommendations,
    );

    return {
        ...teaser,
        locked: false,
        content: {
            ...effectiveContent,
            routine,
        },
        routine,
        limitations: report.limitations,
        sources: report.sources,
        simulationSpec: report.simulationSpec,
        visualizationSpec:
            report.visualizationSpec ?? report.simulationSpec,
        sourceImageUrl: `/api/me/skin-analyses/${id(report.analysisId)}/image`,
        provenance: report.providerMetadata,
        recommendations,
    };
}

/**
 * Congela a versão IA aceite ou a versão aprovada pelo consultor e cria o gate
 * comercial atómico. Replays devolvem a mesma versão.
 */
export async function finalizeFaceReportForUser(userId, reportId) {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const report = await FaceReport.findOne({
                _id: reportId,
                userId,
                schemaVersion: 2,
                privacyStatus: "active",
            })
                .select("+contentHash")
                .session(session);
            if (!report) throw new AppError(404, "Relatório não encontrado");
            if (report.lifecycleStatus === FACE_REPORT_LIFECYCLE.UNLOCKED) {
                const repaired = await AiConsultationSession.updateOne(
                    { _id: report.consultationSessionId, userId },
                    {
                        $set: {
                            flowState: AI_CONSULTATION_FLOW_STATES.UNLOCKED,
                            status: AI_CONSULTATION_STATUS.COMPLETED,
                            isOpen: false,
                            completedAt: report.frozenAt ?? new Date(),
                        },
                    },
                    { session },
                );
                if (repaired.matchedCount !== 1) {
                    throw new AppError(409, "Sessão da consulta indisponível");
                }
                return;
            }
            if (report.lifecycleStatus === FACE_REPORT_LIFECYCLE.FROZEN_LOCKED) {
                return;
            }
            if (report.lifecycleStatus === FACE_REPORT_LIFECYCLE.REVIEW_PENDING) {
                throw new AppError(409, "Revisão humana ainda pendente");
            }
            if (
                report.lifecycleStatus ===
                FACE_REPORT_LIFECYCLE.NEEDS_CLARIFICATION
            ) {
                throw new AppError(409, "A revisão requer esclarecimento");
            }

            let review = null;
            if (report.reviewId) {
                review = await AiConsultationReview.findOne({
                    _id: report.reviewId,
                    userId,
                    reportId: report._id,
                }).session(session);
                if (!review || !FINAL_REVIEW_STATUSES.has(review.status)) {
                    throw new AppError(409, "Revisão humana não concluída");
                }
            }

            const effectiveContent = report.humanOverride ?? report.machineResult;
            if (!effectiveContent) {
                throw new AppError(409, "Relatório sem conteúdo final");
            }
            const contentHash = hashCanonicalSnapshot({
                schemaVersion: report.schemaVersion,
                version: report.version,
                content: effectiveContent,
                recommendationIds: (report.finalRecommendationIds ?? []).map(id),
            });
            const unlock = await freezeReportUnlockSnapshot(
                {
                    userId,
                    analysisId: report.analysisId,
                    reportId: report._id,
                    reportVersion: report.version,
                    contentHash,
                },
                { session },
            );
            const lifecycleStatus =
                unlock.status === REPORT_UNLOCK_STATUS.UNLOCKED
                    ? FACE_REPORT_LIFECYCLE.UNLOCKED
                    : FACE_REPORT_LIFECYCLE.FROZEN_LOCKED;
            const updated = await FaceReport.updateOne(
                {
                    _id: report._id,
                    lifecycleStatus: report.lifecycleStatus,
                    contentHash: null,
                },
                {
                    $set: {
                        lifecycleStatus,
                        contentHash,
                        frozenAt: unlock.frozenAt,
                    },
                },
                { session },
            );
            if (updated.modifiedCount !== 1) {
                throw new AppError(409, "Relatório alterado concorrentemente");
            }
            const autoUnlocked =
                lifecycleStatus === FACE_REPORT_LIFECYCLE.UNLOCKED;
            const sessionUpdate = await AiConsultationSession.updateOne(
                { _id: report.consultationSessionId, userId },
                {
                    $set: {
                        flowState: autoUnlocked
                            ? AI_CONSULTATION_FLOW_STATES.UNLOCKED
                            : AI_CONSULTATION_FLOW_STATES.FROZEN_LOCKED,
                        ...(autoUnlocked
                            ? {
                                  status: AI_CONSULTATION_STATUS.COMPLETED,
                                  isOpen: false,
                                  completedAt: unlock.unlockedAt ?? new Date(),
                              }
                            : {}),
                    },
                },
                { session },
            );
            if (sessionUpdate.matchedCount !== 1) {
                throw new AppError(409, "Sessão da consulta alterada concorrentemente");
            }
        });
    } finally {
        await session.endSession();
    }

    return getFaceReportV2ForUser(userId, reportId);
}
