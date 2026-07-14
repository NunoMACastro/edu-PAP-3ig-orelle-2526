/**
 * Barreira transacional para criação de novos dados faciais.
 *
 * Upload, revogação, pedidos de privacidade e eliminação de conta escrevem no
 * mesmo documento `User`. Essa escrita comum torna a ordem linearizável: ou o
 * upload confirma primeiro e o workflow destrutivo captura o novo par, ou o
 * tombstone confirma primeiro e o upload deixa de poder fazer commit.
 */
import {
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
} from "../constants/domain.constants.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { BiometricDataRequest } from "../models/biometric-data-request.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import {
    ACCOUNT_STATUSES,
    FACE_PROCESSING_BLOCK_REASONS,
    User,
} from "../models/user.model.js";

const BLOCKING_PRIVACY_STATUSES = Object.freeze([
    BIOMETRIC_REQUEST_STATUSES.PENDING,
    BIOMETRIC_REQUEST_STATUSES.PROCESSING,
    BIOMETRIC_REQUEST_STATUSES.FAILED,
]);

/**
 * Procura outro pedido facial/relatório que ainda pode produzir eliminação.
 *
 * @param {unknown} userId - Titular.
 * @param {{session: import("mongoose").ClientSession, excludeRequestId?: unknown}} options - Contexto transacional.
 * @returns {Promise<boolean>} Verdadeiro quando existe workflow bloqueante.
 */
async function hasBlockingFacePrivacyRequest(
    userId,
    { session, excludeRequestId = null },
) {
    const filter = {
        requesterId: userId,
        resources: {
            $in: [
                BIOMETRIC_REQUEST_RESOURCES.PHOTOS,
                BIOMETRIC_REQUEST_RESOURCES.REPORTS,
            ],
        },
        status: { $in: BLOCKING_PRIVACY_STATUSES },
        ...(excludeRequestId ? { _id: { $ne: excludeRequestId } } : {}),
    };
    const request = await BiometricDataRequest.exists(filter).session(session);
    return Boolean(request);
}

/**
 * Reclama o direito de confirmar um novo par facial.
 *
 * @param {unknown} userId - Titular autenticado.
 * @param {import("mongoose").ClientSession} session - Sessão obrigatória.
 * @returns {Promise<object>} Conta ativa reclamada.
 * @throws {AppError} Quando conta, consentimento ou privacidade bloqueiam escrita.
 */
export async function claimFaceDataWrite(userId, session) {
    const account = await User.findOneAndUpdate(
        {
            _id: userId,
            isActive: true,
            accountStatus: ACCOUNT_STATUSES.ACTIVE,
            faceProcessingBlockedAt: null,
        },
        { $inc: { faceDataGeneration: 1 } },
        { new: true, session },
    );

    if (!account) {
        throw new AppError(
            409,
            "Novo processamento facial está bloqueado para esta conta.",
        );
    }

    if (await hasBlockingFacePrivacyRequest(userId, { session })) {
        throw new AppError(
            409,
            "Existe um pedido de privacidade pendente para dados faciais.",
        );
    }

    return account;
}

/**
 * Coloca a barreira de um pedido de privacidade no mesmo documento do upload.
 *
 * @param {unknown} userId - Titular.
 * @param {{session: import("mongoose").ClientSession, at: Date, requireActive?: boolean}} options - Contexto.
 * @returns {Promise<object|null>} Conta bloqueada ou null para órfão sem writers.
 * @throws {AppError} Quando criação autenticada perde a conta ativa.
 */
export async function blockFaceDataWritesForPrivacy(
    userId,
    { session, at, requireActive = false },
) {
    const account = await User.findOneAndUpdate(
        {
            _id: userId,
            ...(requireActive
                ? { isActive: true, accountStatus: ACCOUNT_STATUSES.ACTIVE }
                : { accountStatus: { $ne: ACCOUNT_STATUSES.DELETED } }),
        },
        {
            $set: {
                faceProcessingBlockedAt: at,
                faceProcessingBlockReason:
                    FACE_PROCESSING_BLOCK_REASONS.PRIVACY_REQUEST,
            },
            $inc: { faceDataGeneration: 1 },
        },
        { new: true, session },
    );

    if (!account && requireActive) {
        throw new AppError(409, "A conta já não aceita pedidos de privacidade.");
    }

    return account;
}

/**
 * Marca uma revogação no mesmo boundary usado pelos uploads.
 *
 * @param {unknown} userId - Titular.
 * @param {{session: import("mongoose").ClientSession, at: Date}} options - Contexto.
 * @returns {Promise<object|null>} Conta bloqueada ou null se já não existir.
 */
export async function blockFaceDataWritesForConsentRevocation(
    userId,
    { session, at },
) {
    return User.findOneAndUpdate(
        { _id: userId, accountStatus: { $ne: ACCOUNT_STATUSES.DELETED } },
        {
            $set: {
                faceProcessingBlockedAt: at,
                faceProcessingBlockReason:
                    FACE_PROCESSING_BLOCK_REASONS.CONSENT_REVOKED,
            },
            $inc: { faceDataGeneration: 1 },
        },
        { new: true, session },
    );
}

/**
 * Liberta a barreira depois de uma aceitação explícita válida.
 *
 * @param {unknown} userId - Titular.
 * @param {import("mongoose").ClientSession} session - Sessão da aceitação.
 * @returns {Promise<object>} Conta novamente elegível.
 * @throws {AppError} Quando outro pedido destrutivo continua ativo.
 */
export async function allowFaceDataWritesAfterConsent(userId, session) {
    if (await hasBlockingFacePrivacyRequest(userId, { session })) {
        throw new AppError(
            409,
            "O consentimento não pode ser reativado durante um pedido de privacidade.",
        );
    }

    const account = await User.findOneAndUpdate(
        {
            _id: userId,
            isActive: true,
            accountStatus: ACCOUNT_STATUSES.ACTIVE,
            faceProcessingBlockReason: {
                $in: [
                    null,
                    FACE_PROCESSING_BLOCK_REASONS.CONSENT_REVOKED,
                    FACE_PROCESSING_BLOCK_REASONS.PRIVACY_REQUEST,
                ],
            },
        },
        {
            $set: {
                faceProcessingBlockedAt: null,
                faceProcessingBlockReason: null,
            },
            $inc: { faceDataGeneration: 1 },
        },
        { new: true, session },
    );

    if (!account) {
        throw new AppError(409, "A conta não permite reativar processamento facial.");
    }
    return account;
}

/**
 * Liberta apenas a barreira criada por privacy quando o workflow terminou.
 * Consentimento revogado e outros pedidos ativos mantêm o bloqueio.
 *
 * @param {unknown} userId - Titular.
 * @param {{session: import("mongoose").ClientSession, excludeRequestId?: unknown}} options - Contexto.
 * @returns {Promise<boolean>} Verdadeiro quando a barreira foi removida.
 */
export async function releaseResolvedPrivacyBarrier(
    userId,
    { session, excludeRequestId = null },
) {
    if (
        await hasBlockingFacePrivacyRequest(userId, {
            session,
            excludeRequestId,
        })
    ) {
        return false;
    }

    const activeConsent = await FaceConsent.exists({
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        revokedAt: null,
    }).session(session);
    if (!activeConsent) return false;

    const result = await User.updateOne(
        {
            _id: userId,
            isActive: true,
            accountStatus: ACCOUNT_STATUSES.ACTIVE,
            faceProcessingBlockReason:
                FACE_PROCESSING_BLOCK_REASONS.PRIVACY_REQUEST,
        },
        {
            $set: {
                faceProcessingBlockedAt: null,
                faceProcessingBlockReason: null,
            },
            $inc: { faceDataGeneration: 1 },
        },
        { session },
    );

    return result.modifiedCount === 1;
}
