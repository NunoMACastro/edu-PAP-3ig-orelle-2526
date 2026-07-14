/**
 * Controller de relatorios faciais personalizados.
 */
import mongoose from "mongoose";
import { unlockReportWithAcademicPayment } from "../services/face-report.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import { validatePaymentIdempotencyKey } from "../validators/checkout.validator.js";
import {
    finalizeFaceReportForUser,
    getFaceReportV2ForUser,
} from "../services/report-access.service.js";
import {
    cancelReportReviewForUser,
    requestReportReviewForUser,
    revokeReportPhotoGrantForUser,
} from "../services/report-review.service.js";
import { CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION } from "../constants/purpose-grants.js";

function validateReportId(value) {
    const reportId = String(value ?? "").trim();
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new AppError(400, "Relatório inválido");
    }
    return reportId;
}

function setSensitiveNoStore(res) {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.set("Pragma", "no-cache");
}

/** Devolve teaser ou relatório completo conforme o gate do titular. */
export async function getFaceReportController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);
        const report = await getFaceReportV2ForUser(req.user.id, reportId);
        setSensitiveNoStore(res);
        return res.status(200).json({ report });
    } catch (error) {
        return next(error);
    }
}

/** Congela a versão final e calcula o pagamento académico simulado. */
export async function finalizeFaceReportController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);
        const report = await finalizeFaceReportForUser(req.user.id, reportId);
        setSensitiveNoStore(res);
        return res.status(200).json({ report });
    } catch (error) {
        return next(error);
    }
}

/** Pede revisão humana opcional, com grant visual separado. */
export async function requestFaceReportReviewController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);
        if (
            req.body?.grantPhotoAccess !== undefined &&
            typeof req.body.grantPhotoAccess !== "boolean"
        ) {
            throw new AppError(400, "Opção de acesso às fotografias inválida");
        }
        const photoAccessNoticeVersion = String(
            req.body?.photoAccessNoticeVersion ?? "",
        ).trim();
        if (
            req.body?.grantPhotoAccess === true &&
            photoAccessNoticeVersion !==
                CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION
        ) {
            throw new AppError(400, "Aviso de acesso fotográfico inválido");
        }
        const review = await requestReportReviewForUser(req.user.id, reportId, {
            grantPhotoAccess: req.body?.grantPhotoAccess === true,
            photoAccessNoticeVersion:
                req.body?.grantPhotoAccess === true
                    ? photoAccessNoticeVersion
                    : null,
        });
        setSensitiveNoStore(res);
        return res.status(201).json({ review });
    } catch (error) {
        return next(error);
    }
}

/** Revoga apenas o acesso visual, mantendo a revisão de texto. */
export async function revokeFaceReportPhotoAccessController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);
        const photoAccess = await revokeReportPhotoGrantForUser(
            req.user.id,
            reportId,
        );
        setSensitiveNoStore(res);
        return res.status(200).json({ photoAccess });
    } catch (error) {
        return next(error);
    }
}

/** Retira uma revisão pendente sem apagar o respetivo audit trail. */
export async function cancelFaceReportReviewController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);
        const review = await cancelReportReviewForUser(req.user.id, reportId);
        setSensitiveNoStore(res);
        return res.status(200).json({ review });
    } catch (error) {
        return next(error);
    }
}

/**
 * Confirma pagamento academico simulado e desbloqueia um relatorio.
 *
 * @async
 * @function unlockFaceReportController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function unlockFaceReportController(req, res, next) {
    try {
        const reportId = validateReportId(req.params.reportId);

        const idempotencyKey = validatePaymentIdempotencyKey(req.headers);
        const result = await unlockReportWithAcademicPayment(
            req.user.id,
            reportId,
            idempotencyKey,
            { signal: req.orelleAbortSignal },
        );

        setSensitiveNoStore(res);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
