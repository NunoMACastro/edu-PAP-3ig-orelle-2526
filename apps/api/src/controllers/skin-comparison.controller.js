/**
 * Controllers de comparacao temporal de pele.
 */
import {
    createSkinComparison,
    listSkinComparisonOptions,
} from "../services/skin-comparison.service.js";
import { getOwnedSkinAnalysisImage } from "../services/skin-analysis-image.service.js";
import {
    validateSkinAnalysisImageParams,
    validateSkinComparisonPayload,
} from "../validators/skin-comparison.validator.js";

/**
 * Lista análises próprias que podem ser escolhidas pela respetiva data.
 *
 * @async
 * @function listSkinComparisonOptionsController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listSkinComparisonOptionsController(req, res, next) {
    try {
        const analyses = await listSkinComparisonOptions(req.user.id);
        res.set("Cache-Control", "private, no-store, max-age=0");
        return res.status(200).json({ analyses });
    } catch (err) {
        return next(err);
    }
}

/**
 * Entrega uma fotografia de uma análise apenas ao respetivo titular.
 *
 * @async
 * @function getOwnedSkinAnalysisImageController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Bytes da imagem sem cache.
 */
export async function getOwnedSkinAnalysisImageController(req, res, next) {
    try {
        const { analysisId, kind } = validateSkinAnalysisImageParams(req.params);
        const image = await getOwnedSkinAnalysisImage(
            req.user.id,
            analysisId,
            kind,
            { signal: req.orelleAbortSignal },
        );

        res.set({
            "Cache-Control": "private, no-store, max-age=0",
            Pragma: "no-cache",
            "Content-Type": image.mimeType,
            "Content-Length": String(image.bytes.length),
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin",
        });
        return res.status(200).send(image.bytes);
    } catch (err) {
        return next(err);
    }
}

/**
 * Cria comparacao temporal para o utilizador autenticado.
 *
 * @async
 * @function createSkinComparisonController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function createSkinComparisonController(req, res, next) {
    try {
        const input = validateSkinComparisonPayload(req.body);
        const comparison = await createSkinComparison(req.user.id, input);

        res.set("Cache-Control", "private, no-store, max-age=0");
        res.set("Pragma", "no-cache");
        return res.status(201).json({ comparison });
    } catch (err) {
        return next(err);
    }
}
