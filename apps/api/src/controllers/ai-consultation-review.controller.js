/**
 * Controllers das revisões humanas de sessões IA.
 */
import {
    decideAiConsultationReview,
    getAiConsultationReviewForConsultant,
    listAiConsultationReviewsForConsultant,
} from "../services/ai-consultation-review.service.js";
import {
    validateReviewDecisionInput,
    validateReviewId,
} from "../validators/ai-consultation-review.validator.js";
import { readReportPhotoForConsultant } from "../services/report-review.service.js";
import { AppError } from "../middlewares/error.middleware.js";

function setSensitiveNoStore(res) {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.set("Pragma", "no-cache");
}

/**
 * Lista revisões acessíveis ao consultor/admin.
 *
 * @async
 * @function listAiConsultationReviewsController
 * @param {import("express").Request} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com fila.
 */
export async function listAiConsultationReviewsController(req, res, next) {
    try {
        const reviews = await listAiConsultationReviewsForConsultant(req.user, {
            requestId: req.requestId,
        });

        setSensitiveNoStore(res);
        return res.json({ reviews });
    } catch (err) {
        return next(err);
    }
}

/**
 * Devolve detalhe minimizado de uma revisão.
 *
 * @async
 * @function getAiConsultationReviewController
 * @param {import("express").Request} req - Pedido com `reviewId`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com detalhe.
 */
export async function getAiConsultationReviewController(req, res, next) {
    try {
        const reviewId = validateReviewId(req.params);
        const review = await getAiConsultationReviewForConsultant(
            req.user,
            reviewId,
            { requestId: req.requestId },
        );

        setSensitiveNoStore(res);
        return res.json({ review });
    } catch (err) {
        return next(err);
    }
}

/**
 * Regista decisão humana de revisão IA.
 *
 * @async
 * @function decideAiConsultationReviewController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com revisão atualizada.
 */
export async function decideAiConsultationReviewController(req, res, next) {
    try {
        const input = validateReviewDecisionInput(req.params, req.body);
        const review = await decideAiConsultationReview(req.user, input, {
            requestId: req.requestId,
        });

        setSensitiveNoStore(res);
        return res.json({ review });
    } catch (err) {
        return next(err);
    }
}

/** Serve fotografia autorizada sem cache e sem revelar o path privado. */
export async function getAiConsultationReviewPhotoController(req, res, next) {
    try {
        const reviewId = validateReviewId(req.params);
        const kind = String(req.params.view ?? "");
        if (!new Set(["frontal", "perfil"]).has(kind)) {
            throw new AppError(400, "Vista da fotografia inválida");
        }
        const photo = await readReportPhotoForConsultant(
            req.user,
            reviewId,
            kind,
            { signal: req.orelleAbortSignal },
        );
        res.set("Cache-Control", "private, no-store, max-age=0");
        res.set("Pragma", "no-cache");
        res.type(photo.mimeType);
        return res.status(200).send(photo.buffer);
    } catch (error) {
        return next(error);
    }
}
