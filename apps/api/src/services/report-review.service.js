/**
 * Pedido opcional de revisão humana e acesso temporário a fotografias.
 * O acesso visual é purpose-limited, auditado e independente da revisão textual.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../models/ai-consultation-session.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../models/face-report.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import {
    ReportPhotoGrant,
    REPORT_PHOTO_GRANT_STATUSES,
} from "../models/report-photo-grant.model.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    recordBiometricAccess,
} from "./biometric-audit.service.js";
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";
import { CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION } from "../constants/purpose-grants.js";
import { assertFaceConsentAllowsConfiguredProvider } from "./face-photo.service.js";

export const REPORT_PHOTO_GRANT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toReviewRequestDto(review, grant = null) {
    return {
        id: review._id.toString(),
        reportId: review.reportId?.toString?.() ?? null,
        status: review.status,
        requestedAt: review.requestedAt,
        photoAccess: grant
            ? {
                  granted: grant.status === REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                  expiresAt: grant.expiresAt,
              }
            : { granted: false, expiresAt: null },
    };
}

async function upsertPhotoGrantForReview({
    userId,
    report,
    review,
    noticeVersion,
    now,
    session,
}) {
    const analysis = await FaceAnalysis.findOne({
        _id: report.analysisId,
        userId,
    })
        .select("consentId")
        .session(session);
    const activeConsent = analysis
        ? await FaceConsent.findOne({
              _id: analysis.consentId,
              userId,
              revokedAt: null,
          }).session(session)
        : null;
    if (!activeConsent) {
        throw new AppError(403, "Consentimento facial ativo obrigatório");
    }
    assertFaceConsentAllowsConfiguredProvider(activeConsent);
    const grant = await ReportPhotoGrant.findOneAndUpdate(
        { reviewId: review._id },
        {
            $set: {
                clientUserId: userId,
                reportId: report._id,
                consentId: activeConsent._id,
                noticeVersion,
                status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                grantedAt: now,
                expiresAt: new Date(now.getTime() + REPORT_PHOTO_GRANT_TTL_MS),
                revokedAt: null,
                revocationReason: null,
            },
        },
        { upsert: true, new: true, runValidators: true, session },
    );
    review.photoGrantId = grant._id;
    await review.save({ session });
    return grant;
}

/** Pede revisão apenas para um rascunho próprio ainda não congelado. */
export async function requestReportReviewForUser(
    userId,
    reportId,
    {
        grantPhotoAccess = false,
        photoAccessNoticeVersion = null,
        now = new Date(),
    } = {},
) {
    if (
        grantPhotoAccess &&
        photoAccessNoticeVersion !== CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION
    ) {
        throw new AppError(400, "Aviso de acesso fotográfico desatualizado");
    }
    const session = await mongoose.startSession();
    let review;
    let grant = null;
    try {
        await session.withTransaction(async () => {
            const report = await FaceReport.findOne({
                _id: reportId,
                userId,
                schemaVersion: 2,
                lifecycleStatus: {
                    $in: [
                        FACE_REPORT_LIFECYCLE.DRAFT_READY,
                        FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
                    ],
                },
                privacyStatus: "active",
            }).session(session);
            if (!report) {
                throw new AppError(409, "Relatório não está disponível para revisão");
            }
            if (report.lifecycleStatus === FACE_REPORT_LIFECYCLE.REVIEW_PENDING) {
                review = await AiConsultationReview.findOne({
                    _id: report.reviewId,
                    userId,
                    reportId: report._id,
                    schemaVersion: 2,
                    status: "pending",
                }).session(session);
                if (!review) {
                    throw new AppError(409, "Revisão pendente indisponível");
                }
                grant = await ReportPhotoGrant.findOne({
                    reviewId: review._id,
                    clientUserId: userId,
                    status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                    revokedAt: null,
                    expiresAt: { $gt: now },
                }).session(session);
                if (grantPhotoAccess && !grant) {
                    grant = await upsertPhotoGrantForReview({
                        userId,
                        report,
                        review,
                        noticeVersion: photoAccessNoticeVersion,
                        now,
                        session,
                    });
                }
                return;
            }
            const recommendationIds = await ProductRecommendation.find({
                userId,
                reportId,
                schemaVersion: 2,
            })
                .select("_id")
                .sort({ selectionRank: 1 })
                .session(session);

            review = await AiConsultationReview.findOneAndUpdate(
                { userId, reportId: report._id, schemaVersion: 2 },
                {
                    $set: {
                        consultationSessionId: report.consultationSessionId,
                        reportVersion: report.version,
                        recommendationIds: recommendationIds.map(({ _id }) => _id),
                        status: "pending",
                        summary: `Relatório cosmético v${report.version} submetido voluntariamente a revisão humana.`,
                        sourceLabels: ["Análise OpenAI", "Consulta guiada", "Catálogo validado"],
                        limitations: report.limitations,
                        machineResult: report.machineResult,
                        humanOverride: null,
                        requestedAt: now,
                        cancelledAt: null,
                        reviewedBy: null,
                        reviewedAt: null,
                        publicInsight: null,
                        internalNote: null,
                    },
                    $setOnInsert: {
                        userId,
                        reportId: report._id,
                        schemaVersion: 2,
                        auditTrail: [],
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                    session,
                },
            );

            if (grantPhotoAccess) {
                grant = await upsertPhotoGrantForReview({
                    userId,
                    report,
                    review,
                    noticeVersion: photoAccessNoticeVersion,
                    now,
                    session,
                });
            }

            const updatedReport = await FaceReport.updateOne(
                {
                    _id: report._id,
                    lifecycleStatus: FACE_REPORT_LIFECYCLE.DRAFT_READY,
                },
                {
                    $set: {
                        lifecycleStatus: FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
                        reviewId: review._id,
                    },
                },
                { session },
            );
            if (updatedReport.modifiedCount !== 1) {
                throw new AppError(409, "Relatório alterado concorrentemente");
            }
            await AiConsultationSession.updateOne(
                { _id: report.consultationSessionId, userId },
                {
                    $set: {
                        flowState: AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING,
                    },
                },
                { session },
            );
        });
        return toReviewRequestDto(review, grant);
    } finally {
        await session.endSession();
    }
}

/** Revoga só o grant visual; a revisão textual permanece pendente. */
export async function revokeReportPhotoGrantForUser(
    userId,
    reportId,
    now = new Date(),
) {
    const review = await AiConsultationReview.findOne({
        userId,
        reportId,
        schemaVersion: 2,
        status: { $in: ["pending", "needs_clarification"] },
    });
    if (!review) throw new AppError(404, "Revisão não encontrada");
    const grant = await ReportPhotoGrant.findOneAndUpdate(
        {
            reviewId: review._id,
            clientUserId: userId,
            status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
        },
        {
            $set: {
                status: REPORT_PHOTO_GRANT_STATUSES.REVOKED,
                revokedAt: now,
                revocationReason: "client_revoked_photo_access",
            },
        },
        { new: true },
    );
    if (!grant) throw new AppError(409, "Acesso fotográfico já não está ativo");
    return { reviewId: review._id.toString(), granted: false, revokedAt: now };
}

/** Retira apenas uma revisão ainda pendente e revoga logo o acesso visual. */
export async function cancelReportReviewForUser(userId, reportId, now = new Date()) {
    const session = await mongoose.startSession();
    let review;
    try {
        await session.withTransaction(async () => {
            review = await AiConsultationReview.findOneAndUpdate(
                { userId, reportId, schemaVersion: 2, status: "pending" },
                { $set: { status: "cancelled", cancelledAt: now } },
                { new: true, session },
            );
            if (!review) throw new AppError(409, "Revisão já não pode ser retirada");
            await ReportPhotoGrant.updateOne(
                { reviewId: review._id, status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE },
                {
                    $set: {
                        status: REPORT_PHOTO_GRANT_STATUSES.REVOKED,
                        revokedAt: now,
                        revocationReason: "review_cancelled",
                    },
                },
                { session },
            );
            const report = await FaceReport.findOneAndUpdate(
                {
                    _id: reportId,
                    userId,
                    reviewId: review._id,
                    lifecycleStatus: FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
                },
                {
                    $set: {
                        lifecycleStatus: FACE_REPORT_LIFECYCLE.DRAFT_READY,
                        reviewId: null,
                    },
                },
                { new: true, session },
            );
            if (!report) throw new AppError(409, "Relatório alterado concorrentemente");
            await AiConsultationSession.updateOne(
                { _id: report.consultationSessionId, userId },
                { $set: { flowState: AI_CONSULTATION_FLOW_STATES.DRAFT_READY } },
                { session },
            );
        });
        return toReviewRequestDto(review, null);
    } finally {
        await session.endSession();
    }
}

/** Abre uma foto apenas com grant explícito, ainda válido, e cria audit log. */
export async function readReportPhotoForConsultant(
    consultant,
    reviewId,
    kind,
    { now = new Date(), signal } = {},
) {
    const review = await AiConsultationReview.findOne({
        _id: reviewId,
        schemaVersion: 2,
        status: { $in: ["pending", "needs_clarification"] },
    });
    const grant = review
        ? await ReportPhotoGrant.findOne({
              reviewId: review._id,
              clientUserId: review.userId,
              status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
              revokedAt: null,
              expiresAt: { $gt: now },
          })
        : null;
    const activeBaseConsent = grant
        ? await FaceConsent.findOne({
              _id: grant.consentId,
              userId: review.userId,
              version: "face-analysis-v2",
              revokedAt: null,
              "externalProviderConsent.provider": "openai",
              "externalProviderConsent.revokedAt": null,
          })
        : null;
    if (activeBaseConsent) {
        try {
            assertFaceConsentAllowsConfiguredProvider(activeBaseConsent);
        } catch {
            activeBaseConsent.revokedAt = now;
        }
    }
    if (!review || !grant || !activeBaseConsent || activeBaseConsent.revokedAt) {
        if (review) {
            await ReportPhotoGrant.updateOne(
                {
                    reviewId: review._id,
                    status: REPORT_PHOTO_GRANT_STATUSES.ACTIVE,
                    expiresAt: { $lte: now },
                },
                {
                    $set: {
                        status: REPORT_PHOTO_GRANT_STATUSES.EXPIRED,
                        revokedAt: now,
                        revocationReason: "expired",
                    },
                },
            );
        }
        if (review) {
            await recordBiometricAccess({
                actorId: consultant.id,
                actorRole: consultant.role,
                subjectUserId: review.userId,
                action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
                resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.PHOTO,
                resourceId: review._id.toString(),
                result: "denied",
                reason: "Grant ou consentimento base deixou de estar ativo.",
            });
        }
        throw new AppError(403, "Acesso temporário à fotografia indisponível");
    }
    const report = await FaceReport.findOne({
        _id: review.reportId,
        userId: review.userId,
        privacyStatus: "active",
    });
    const analysis = report
        ? await FaceAnalysis.findOne({
              _id: report.analysisId,
              userId: review.userId,
          })
        : null;
    const photo = analysis
        ? await FacePhoto.findOne({
              _id: { $in: analysis.photoIds },
              userId: review.userId,
              kind,
              status: "active",
          }).select(
              "+storageKey +encryption +encryption.iv +encryption.authTag",
          )
        : null;
    if (!photo) throw new AppError(404, "Fotografia autorizada não encontrada");

    const buffer = await readEncryptedFacePhotoFile(photo, { signal });
    await recordBiometricAccess({
        actorId: consultant.id,
        actorRole: consultant.role,
        subjectUserId: review.userId,
        action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.PHOTO,
        resourceId: photo._id.toString(),
        reason: "Leitura de fotografia com grant temporário de revisão.",
    });
    return { buffer, mimeType: photo.mimeType };
}
