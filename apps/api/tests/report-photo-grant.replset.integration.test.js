/**
 * Prova que o grant fotográfico é subordinado ao consentimento facial base.
 * A revogação tem de fechar o acesso, preservar a revisão textual e auditar a
 * tentativa recusada sem precisar de abrir ou decifrar qualquer fotografia.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../src/models/ai-job.model.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ReportPhotoGrant } from "../src/models/report-photo-grant.model.js";
import { revokeFaceConsentForUser } from "../src/services/face-photo.service.js";
import { getAiConsultationReviewForConsultant } from "../src/services/ai-consultation-review.service.js";
import {
    cancelReportReviewForUser,
    readReportPhotoForConsultant,
} from "../src/services/report-review.service.js";

const DATABASE_NAME = "orelle_report_photo_grant_test";
const OPENAI_NOTICE_VERSION = "openai-cosmetic-consultation-v2";
let replicaSet;

describe("grant fotográfico temporário de revisão", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
            throw new Error("URI de teste não é loopback efémera");
        }
        await mongoose.connect(uri);
        await Promise.all([
            AiConsultationAuditLog.syncIndexes(),
            AiConsultationReview.syncIndexes(),
            AiConsultationSession.syncIndexes(),
            AiJob.syncIndexes(),
            FaceConsent.syncIndexes(),
            FaceReport.syncIndexes(),
            ReportPhotoGrant.syncIndexes(),
        ]);
    }, 120_000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("revogação base fecha o grant, mantém a revisão e audita GET recusado", async () => {
        const userId = new mongoose.Types.ObjectId();
        const consultantId = new mongoose.Types.ObjectId();
        const reportId = new mongoose.Types.ObjectId();
        const reviewId = new mongoose.Types.ObjectId();
        const now = new Date();
        const consent = await FaceConsent.create({
            userId,
            acceptedAt: now,
            version: "face-analysis-v2",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: OPENAI_NOTICE_VERSION,
                acceptedAt: now,
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        await AiConsultationReview.collection.insertOne({
            _id: reviewId,
            schemaVersion: 2,
            userId,
            reportId,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });
        await ReportPhotoGrant.create({
            clientUserId: userId,
            reportId,
            reviewId,
            consentId: consent._id,
            noticeVersion: "consultant-photo-access-v1",
            status: "active",
            grantedAt: now,
            expiresAt: new Date(now.getTime() + 60_000),
        });

        await revokeFaceConsentForUser(userId);

        await expect(
            readReportPhotoForConsultant(
                { id: consultantId.toString(), role: "consultor" },
                reviewId.toString(),
                "frontal",
            ),
        ).rejects.toMatchObject({ statusCode: 403 });

        const [grant, review, audit] = await Promise.all([
            ReportPhotoGrant.findOne({ reviewId }).lean(),
            AiConsultationReview.findById(reviewId).lean(),
            BiometricAccessLog.findOne({
                actorId: consultantId,
                subjectUserId: userId,
                action: "view_resource",
                resourceType: "photo",
                result: "denied",
            }).lean(),
        ]);
        expect(grant).toMatchObject({
            status: "revoked",
            revocationReason: "face_consent_revoked",
        });
        expect(grant.revokedAt).toBeInstanceOf(Date);
        expect(review.status).toBe("pending");
        expect(audit?.reason).toContain("Grant ou consentimento base");
    });

    it("revogação cancela jobs IA queued/processing e preserva terminais", async () => {
        const userId = new mongoose.Types.ObjectId();
        const acceptedAt = new Date();
        await FaceConsent.create({
            userId,
            acceptedAt,
            version: "face-analysis-v2",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: OPENAI_NOTICE_VERSION,
                acceptedAt,
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        const sessionId = new mongoose.Types.ObjectId();
        const [queued, processing, completed] = await AiJob.create([
            {
                type: AI_JOB_TYPES.ANALYZE_PHOTOS,
                userId,
                consultationSessionId: sessionId,
                deduplicationKey: `revoke-queued:${userId}`,
                status: AI_JOB_STATUSES.QUEUED,
            },
            {
                type: AI_JOB_TYPES.SELECT_NEXT_QUESTION,
                userId,
                consultationSessionId: sessionId,
                deduplicationKey: `revoke-processing:${userId}`,
                status: AI_JOB_STATUSES.PROCESSING,
                attempts: 1,
                lease: {
                    token: "worker-secret",
                    workerId: "worker-before-revocation",
                    expiresAt: new Date(Date.now() + 60_000),
                },
            },
            {
                type: AI_JOB_TYPES.GENERATE_REPORT,
                userId,
                consultationSessionId: sessionId,
                deduplicationKey: `revoke-completed:${userId}`,
                status: AI_JOB_STATUSES.COMPLETED,
                attempts: 1,
                completedAt: new Date(),
                terminalAt: new Date(),
            },
        ]);

        await revokeFaceConsentForUser(userId.toString());

        const [cancelledQueued, cancelledProcessing, preservedCompleted] =
            await Promise.all([
                AiJob.findById(queued._id).select(
                    "+lease.token +lease.workerId",
                ),
                AiJob.findById(processing._id).select(
                    "+lease.token +lease.workerId",
                ),
                AiJob.findById(completed._id),
            ]);
        for (const cancelled of [cancelledQueued, cancelledProcessing]) {
            expect(cancelled).toMatchObject({
                status: AI_JOB_STATUSES.CANCELLED,
                cancelledAt: expect.any(Date),
                terminalAt: expect.any(Date),
            });
            expect(cancelled.lease.token).toBeNull();
            expect(cancelled.lease.workerId).toBeNull();
            expect(cancelled.lease.expiresAt).toBeNull();
        }
        expect(preservedCompleted.status).toBe(AI_JOB_STATUSES.COMPLETED);
        expect(preservedCompleted.cancelledAt).toBeNull();
    });

    it("retirada do cliente torna a review pending imediatamente invisível ao consultor", async () => {
        const userId = new mongoose.Types.ObjectId();
        const analysisId = new mongoose.Types.ObjectId();
        const privateMarker = "report-content-must-not-leak-after-cancel";
        const session = await AiConsultationSession.create({
            userId,
            analysisId,
            goalSelection: {
                primaryGoal: "hydration_barrier",
                secondaryGoals: [],
            },
            conversation: { turns: [], currentQuestion: null },
            facts: {},
            answers: [],
            flowState: "review_pending",
            status: "active",
            isOpen: true,
        });
        const report = await FaceReport.create({
            schemaVersion: 2,
            version: 1,
            userId,
            analysisId,
            consultationSessionId: session._id,
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-test",
            lifecycleStatus: "review_pending",
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            cosmeticSummary: privateMarker,
            routineSuggestions: [],
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: [privateMarker],
            machineResult: { assessment: privateMarker },
            privacyStatus: "active",
        });
        const pendingReview = await AiConsultationReview.create({
            schemaVersion: 2,
            userId,
            consultationSessionId: session._id,
            reportId: report._id,
            reportVersion: 1,
            recommendationIds: [],
            status: "pending",
            summary: "Revisão pendente que o cliente irá retirar.",
            sourceLabels: ["Análise OpenAI"],
            limitations: ["Consulta cosmética não médica."],
            machineResult: { assessment: privateMarker },
            humanOverride: null,
        });
        report.reviewId = pendingReview._id;
        await report.save();
        session.reportId = report._id;
        session.currentReviewId = pendingReview._id;
        await session.save();

        const cancelled = await cancelReportReviewForUser(
            userId.toString(),
            report._id.toString(),
        );
        expect(cancelled).toMatchObject({
            id: pendingReview._id.toString(),
            reportId: report._id.toString(),
            status: "cancelled",
            photoAccess: { granted: false, expiresAt: null },
        });
        const reportReadSpy = vi.spyOn(FaceReport, "findOne");
        let rejectedError;
        try {
            await getAiConsultationReviewForConsultant(
                {
                    id: new mongoose.Types.ObjectId().toString(),
                    role: "consultor",
                },
                pendingReview._id.toString(),
                { requestId: "cancelled-review-detail" },
            );
        } catch (error) {
            rejectedError = error;
        }
        expect(rejectedError).toMatchObject({
            statusCode: 404,
            message: "Revisão não encontrada",
        });
        expect(JSON.stringify(rejectedError)).not.toContain(privateMarker);
        expect(reportReadSpy).not.toHaveBeenCalled();
        reportReadSpy.mockRestore();

        const [storedReview, storedReport, storedSession] = await Promise.all([
            AiConsultationReview.findById(pendingReview._id),
            FaceReport.findById(report._id),
            AiConsultationSession.findById(session._id),
        ]);
        expect(storedReview).toMatchObject({
            status: "cancelled",
            cancelledAt: expect.any(Date),
        });
        expect(storedReport).toMatchObject({
            lifecycleStatus: "draft_ready",
            reviewId: null,
        });
        expect(storedSession.flowState).toBe("draft_ready");

        const consultant = {
            id: new mongoose.Types.ObjectId().toString(),
            role: "consultor",
        };
        for (const status of ["approved", "adjusted"]) {
            const finalReview = await AiConsultationReview.create({
                schemaVersion: 2,
                userId: new mongoose.Types.ObjectId(),
                consultationSessionId: new mongoose.Types.ObjectId(),
                reportId: null,
                recommendationIds: [],
                status,
                summary: `Revisão final ${status} deixa de ser consultável.`,
                sourceLabels: ["Revisão humana"],
                limitations: ["Consulta cosmética não médica."],
                machineResult: { assessment: `final-${status}` },
                humanOverride: {
                    decision: status,
                    publicNote: `Decisão ${status}.`,
                    internalNote: null,
                    reviewId: new mongoose.Types.ObjectId(),
                    reviewedAt: new Date(),
                },
                reviewedBy: consultant.id,
                reviewedAt: new Date(),
            });
            await expect(
                getAiConsultationReviewForConsultant(
                    consultant,
                    finalReview._id.toString(),
                    { requestId: `final-review-${status}` },
                ),
            ).rejects.toMatchObject({ statusCode: 404 });
        }
    }, 30_000);
});
