/**
 * Eliminação terminal e transacional da própria conta.
 *
 * A conta é convertida num tombstone não autenticável; dados pessoais são
 * removidos, encomendas com pagamento simulado confirmado são preservadas sem
 * ligação ao titular e todas as sessões persistidas são revogadas. Como o
 * MongoDB não pode incluir filesystem numa transação, os paths privados das
 * fotografias são colocados num outbox antes de os metadados serem apagados.
 */
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { AiConsultationAuditLog } from "../models/ai-consultation-audit-log.model.js";
import { AiConsultationSession } from "../models/ai-consultation-session.model.js";
import { AiJob } from "../models/ai-job.model.js";
import { AiInteractionHistory } from "../models/ai-interaction-history.model.js";
import { AuthSession } from "../models/auth-session.model.js";
import { BeforeAfterVisualization } from "../models/before-after-visualization.model.js";
import { BiometricAccessLog } from "../models/biometric-access-log.model.js";
import { BiometricDataRequest } from "../models/biometric-data-request.model.js";
import { Cart } from "../models/cart.model.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { MakeupSimulationQuota } from "../models/makeup-simulation-quota.model.js";
import { Notification } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { Preference } from "../models/preference.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Product } from "../models/product.model.js";
import { Profile } from "../models/profile.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";
import { ReportUnlock } from "../models/report-unlock.model.js";
import { Review } from "../models/review.model.js";
import { RoutineAlertPreference } from "../models/routine-alert-preference.model.js";
import { ReportPhotoGrant } from "../models/report-photo-grant.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import {
    ACCOUNT_STATUSES,
    FACE_PROCESSING_BLOCK_REASONS,
    User,
} from "../models/user.model.js";
import { Voucher } from "../models/voucher.model.js";
import {
    enqueueFileDeletionJobs,
    processFileDeletionJobs,
    reclaimFileDeletionJobsForOwner,
} from "./file-deletion-job.service.js";
import { ensurePasswordFitsBcrypt } from "./auth.service.js";
import {
    decryptJsonWithContext,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../utils/encryption.util.js";
import { stripLegacyReviewerId } from "../utils/human-override-privacy.util.js";
import { listMakeupSimulationFilesForOwner } from "./makeup-simulation.service.js";

/** Origem estável usada para deduplicar e processar os ficheiros no outbox. */
export const ACCOUNT_ERASURE_FILE_SOURCE = "account_erasure";

/**
 * Documentos integralmente pertencentes ao titular e seguros de remover.
 *
 * Fotografias entram nesta lista apenas depois de os respetivos paths terem
 * sido copiados para o outbox dentro da mesma transação.
 */
const OWNED_USER_MODELS = Object.freeze([
    AiConsultationReview,
    AiJob,
    AiConsultationSession,
    AiInteractionHistory,
    BeforeAfterVisualization,
    Cart,
    DailyRoutine,
    FaceAnalysis,
    FaceConsent,
    FacePhoto,
    FaceReport,
    MakeupSimulation,
    MakeupSimulationQuota,
    Notification,
    Preference,
    ProductRecommendation,
    Profile,
    ReportUnlock,
    Review,
    RoutineAlertPreference,
    SkinComparison,
    Voucher,
]);

/**
 * Constrói uma password tombstone aleatória que não conserva o hash anterior.
 * A conta eliminada é recusada antes de qualquer comparação bcrypt, mas a
 * substituição também elimina o último derivado reutilizável da credencial.
 *
 * @function buildErasedPasswordValue
 * @returns {string} Valor aleatório sem relação com a password original.
 */
function buildErasedPasswordValue() {
    return `erased:${randomBytes(48).toString("base64url")}`;
}

/**
 * Remove sequencialmente os documentos pessoais numa transação MongoDB.
 * Operações paralelas na mesma `ClientSession` não são suportadas pelo driver.
 *
 * @async
 * @function deleteOwnedDocuments
 * @param {mongoose.Types.ObjectId} userId - Titular a eliminar.
 * @param {import("mongoose").ClientSession} session - Sessão transacional.
 * @returns {Promise<number>} Total de documentos removidos.
 */
async function deleteOwnedDocuments(userId, session) {
    let deletedCount = 0;

    // Os eventos append-only não guardam `userId` do cliente: a ligação ao
    // titular existe apenas através da revisão. Capturamos os IDs antes de
    // apagar as reviews para não deixar audit logs órfãos que ainda permitam
    // correlacionar uma consulta eliminada.
    const ownedReviewIds = await AiConsultationReview.find({ userId })
        .select("_id")
        .session(session)
        .lean();
    if (ownedReviewIds.length > 0) {
        const auditLogs = await AiConsultationAuditLog.deleteMany(
            { reviewId: { $in: ownedReviewIds.map(({ _id }) => _id) } },
            { session },
        );
        deletedCount += auditLogs.deletedCount ?? 0;
    }

    for (const model of OWNED_USER_MODELS) {
        const result = await model.deleteMany({ userId }, { session });
        deletedCount += result.deletedCount ?? 0;
    }

    const biometricRequests = await BiometricDataRequest.deleteMany(
        { requesterId: userId },
        { session },
    );
    const recommendationReviews = await RecommendationReview.deleteMany(
        { clientUserId: userId },
        { session },
    );
    const reportPhotoGrants = await ReportPhotoGrant.deleteMany(
        { clientUserId: userId },
        { session },
    );

    return (
        deletedCount +
        (biometricRequests.deletedCount ?? 0) +
        (recommendationReviews.deletedCount ?? 0) +
        (reportPhotoGrants.deletedCount ?? 0)
    );
}

/**
 * Remove de overrides cifrados a referência histórica à conta eliminada.
 *
 * Como o identificador está dentro de ciphertext, a coleção é percorrida sob
 * a mesma transação. AAD inválido ou perda do CAS faz rollback de toda a
 * eliminação, em vez de deixar um tombstone parcialmente anonimizado.
 */
async function anonymizeEncryptedReviewerReferences(
    model,
    collection,
    reviewerId,
    session,
) {
    const documents = await model.collection
        .find(
            { humanOverride: { $ne: null } },
            { session, projection: { userId: 1, humanOverride: 1 } },
        )
        .toArray();

    for (const document of documents) {
        if (
            !mongoose.isValidObjectId(document.userId) ||
            !isContextualEncryptedPayload(document.humanOverride)
        ) {
            throw new Error("Override humano fora do contrato contextual v2");
        }
        const context = {
            collection,
            owner: document.userId,
            field: "humanOverride",
        };
        const logicalValue = decryptJsonWithContext(
            document.humanOverride,
            context,
        );
        const { value, removed } = stripLegacyReviewerId(logicalValue, {
            expectedReviewerId: reviewerId,
        });
        if (!removed) continue;

        const result = await model.collection.updateOne(
            {
                _id: document._id,
                userId: document.userId,
                humanOverride: document.humanOverride,
            },
            {
                $set: {
                    humanOverride: encryptJsonWithContext(value, context),
                },
            },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error("Perda de CAS ao anonimizar override humano");
        }
    }
}

/**
 * Preserva apenas registos partilhados/auditáveis, removendo a identidade do
 * titular. Estes documentos pertencem a terceiros ou à integridade do catálogo
 * e não podem ser apagados em cascata sem destruir dados alheios.
 *
 * @async
 * @function anonymizeSharedReferences
 * @param {mongoose.Types.ObjectId} userId - Identidade a desassociar.
 * @param {Date} erasedAt - Instante comum da operação.
 * @param {import("mongoose").ClientSession} session - Sessão transacional.
 * @returns {Promise<void>}
 */
async function anonymizeSharedReferences(userId, erasedAt, session) {
    await anonymizeEncryptedReviewerReferences(
        ProductRecommendation,
        "productrecommendations",
        userId,
        session,
    );
    await anonymizeEncryptedReviewerReferences(
        AiConsultationReview,
        "aiconsultationreviews",
        userId,
        session,
    );
    await AiConsultationAuditLog.updateMany(
        { actorId: userId },
        { $set: { actorId: null, actorErasedAt: erasedAt } },
        { session },
    );
    await Product.updateMany(
        { createdBy: userId },
        { $set: { createdBy: null, creatorErasedAt: erasedAt } },
        { session },
    );
    await Review.updateMany(
        { moderatedBy: userId },
        { $set: { moderatedBy: null, moderatorErasedAt: erasedAt } },
        { session },
    );
    await RecommendationReview.updateMany(
        { consultantId: userId },
        { $set: { consultantId: null, consultantErasedAt: erasedAt } },
        { session },
    );
    await BiometricDataRequest.updateMany(
        { reviewerId: userId },
        { $set: { reviewerId: null } },
        { session },
    );
    await AiConsultationReview.updateMany(
        { reviewedBy: userId },
        { $set: { reviewedBy: null, reviewerErasedAt: erasedAt } },
        { session },
    );
    await AiConsultationReview.updateMany(
        { "auditTrail.actorId": userId },
        {
            $set: {
                "auditTrail.$[event].actorId": null,
                "auditTrail.$[event].actorErasedAt": erasedAt,
            },
        },
        {
            session,
            arrayFilters: [{ "event.actorId": userId }],
        },
    );
    await BiometricAccessLog.updateMany(
        { actorId: userId },
        {
            $set: {
                actorId: null,
                actorErasedAt: erasedAt,
                actorRole: "conta_eliminada",
            },
        },
        { session },
    );
    await BiometricAccessLog.updateMany(
        { subjectUserId: userId },
        {
            $set: {
                subjectUserId: null,
                subjectErasedAt: erasedAt,
            },
        },
        { session },
    );
}

/**
 * Preserva a prova académica das encomendas pagas sem conservar ownership,
 * voucher, checkout key ou hashes de idempotência. Encomendas não pagas são
 * eliminadas porque não existe obrigação de integridade logística.
 *
 * @async
 * @function eraseOrders
 * @param {mongoose.Types.ObjectId} userId - Titular a remover.
 * @param {Date} erasedAt - Instante comum da operação.
 * @param {import("mongoose").ClientSession} session - Sessão transacional.
 * @returns {Promise<{deleted: number, anonymized: number}>} Contagens internas.
 */
async function eraseOrders(userId, erasedAt, session) {
    const deleted = await Order.deleteMany(
        {
            userId,
            "payment.status": { $ne: PAYMENT_STATUS.SIMULATED_PAID },
        },
        { session },
    );
    const anonymized = await Order.updateMany(
        {
            userId,
            "payment.status": PAYMENT_STATUS.SIMULATED_PAID,
        },
        [
            {
                $set: {
                    userId: null,
                    ownerErasedAt: erasedAt,
                    checkoutKey: {
                        $concat: ["account-erased:", { $toString: "$_id" }],
                    },
                    "voucher.voucherId": null,
                    "voucher.code": null,
                    "payment.idempotencyKeyHash": null,
                    paymentAttempts: [],
                },
            },
        ],
        { session },
    );

    return {
        deleted: deleted.deletedCount ?? 0,
        anonymized: anonymized.modifiedCount ?? 0,
    };
}

/**
 * Elimina a própria conta numa transação replica-set e processa o outbox.
 *
 * O compare-and-set serializa concorrência. Uma falha antes do commit reverte
 * tombstone, sessões e dados; uma falha posterior conserva o job para retry.
 *
 * @async
 * @function eraseOwnAccount
 * @param {{userId: string, password: string}} input - Titular e password atual.
 * @param {object} [options] - Relógio, sessão e processador injetáveis.
 * @returns {Promise<object>} Tombstone e estado sanitizado da limpeza física.
 * @throws {AppError} Se a conta for terminal ou a password não coincidir.
 */
export async function eraseOwnAccount(
    { userId, password },
    {
        now = new Date(),
        sessionFactory = () => mongoose.startSession(),
        fileDeletionProcessor = processFileDeletionJobs,
    } = {},
) {
    ensurePasswordFitsBcrypt(password);

    if (!mongoose.isValidObjectId(userId)) {
        throw new AppError(401, "Sessão inválida");
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const tombstoneEmail = `deleted-${randomUUID()}@deleted.invalid`;
    const tombstonePassword = buildErasedPasswordValue();
    const session = await sessionFactory();
    let fileCleanupStatus = "not_required";

    try {
        await session.withTransaction(async () => {
            const account = await User.findOne({
                _id: objectUserId,
                accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
            })
                .select("+passwordHash accountStatus")
                .session(session);

            if (!account) {
                throw new AppError(409, "A conta já não pode ser eliminada");
            }

            const passwordMatches = await bcrypt.compare(
                password,
                account.passwordHash,
            );

            if (!passwordMatches) {
                throw new AppError(403, "Password atual incorreta");
            }

            const tombstone = await User.findOneAndUpdate(
                {
                    _id: objectUserId,
                    accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
                },
                {
                    $set: {
                        email: tombstoneEmail,
                        passwordHash: tombstonePassword,
                        role: ROLES.CLIENTE,
                        isActive: false,
                        accountStatus: ACCOUNT_STATUSES.DELETED,
                        suspendedAt: now,
                        deletedAt: now,
                        faceProcessingBlockedAt: now,
                        faceProcessingBlockReason:
                            FACE_PROCESSING_BLOCK_REASONS.ACCOUNT_DELETED,
                    },
                    $inc: { faceDataGeneration: 1 },
                },
                { new: true, runValidators: true, session },
            );

            if (!tombstone) {
                throw new AppError(409, "A conta já não pode ser eliminada");
            }

            const photos = await FacePhoto.find({ userId: objectUserId })
                .select("+storageKey")
                .session(session)
                .lean();
            const makeupOutputs = await listMakeupSimulationFilesForOwner(
                objectUserId,
                { session },
            );

            const reclaimedJobs = await reclaimFileDeletionJobsForOwner(
                {
                    ownerId: objectUserId,
                    sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
                    sourceId: objectUserId,
                },
                { session },
            );
            if (reclaimedJobs.reclaimed > 0) fileCleanupStatus = "pending";

            if (photos.length > 0 || makeupOutputs.length > 0) {
                if (
                    photos.some((photo) => !photo.storageKey) ||
                    makeupOutputs.some((simulation) => !simulation.outputStorageKey)
                ) {
                    throw new Error(
                        "Não foi possível preservar o trabalho de eliminação física",
                    );
                }

                await enqueueFileDeletionJobs(
                    [
                        ...photos.map((photo) => ({
                            sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
                            sourceId: objectUserId,
                            ownerId: objectUserId,
                            storageKey: photo.storageKey,
                        })),
                        ...makeupOutputs.map((simulation) => ({
                            sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
                            sourceId: objectUserId,
                            ownerId: objectUserId,
                            storageKey: simulation.outputStorageKey,
                        })),
                    ],
                    { session },
                );
                fileCleanupStatus = "pending";
            }

            await deleteOwnedDocuments(objectUserId, session);
            await eraseOrders(objectUserId, now, session);
            await anonymizeSharedReferences(objectUserId, now, session);
            await AuthSession.updateMany(
                { userId: objectUserId, revokedAt: null },
                { $set: { revokedAt: now, csrfHash: null } },
                { session },
            );
        });

        if (fileCleanupStatus === "pending") {
            try {
                const cleanupResult = await fileDeletionProcessor({
                    sourceType: ACCOUNT_ERASURE_FILE_SOURCE,
                    sourceId: objectUserId,
                });

                if (cleanupResult?.outstanding === 0) {
                    fileCleanupStatus = "completed";
                }
            } catch {
                // A eliminação lógica já fez commit. O job permanece no outbox
                // e pode ser retomado sem reapresentar a password do titular.
                fileCleanupStatus = "pending";
            }
        }

        return {
            status: "deleted",
            deletedAt: now,
            fileCleanupStatus,
        };
    } finally {
        await session.endSession();
    }
}
