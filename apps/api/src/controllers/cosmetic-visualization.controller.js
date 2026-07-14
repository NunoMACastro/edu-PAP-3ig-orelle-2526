/** Controllers públicos da pré-visualização cosmética genérica. */
import {
    createCosmeticVisualizationForReport,
    getCosmeticVisualizationForUser,
    readCosmeticVisualizationImageForUser,
    revokeCosmeticVisualizationConsent,
    submitCosmeticVisualizationFeedback,
} from "../services/cosmetic-visualization.service.js";
import {
    validateCosmeticVisualizationFeedback,
    validateCosmeticVisualizationId,
    validateCosmeticVisualizationInput,
} from "../validators/cosmetic-visualization.validator.js";

function noStore(res) {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.set("Pragma", "no-cache");
}

/**
 * Cria uma visualização própria depois de validar consentimento, intensidade
 * e confirmação exata das variantes exigidas pelo relatório.
 *
 * @function createCosmeticVisualizationController
 * @returns {Promise<import("express").Response|void>} Resposta 201 sem dados internos.
 */
export async function createCosmeticVisualizationController(req, res, next) {
    try {
        const input = validateCosmeticVisualizationInput(req.params, req.body);
        const visualization = await createCosmeticVisualizationForReport(
            req.user.id,
            input,
            req.faceConsent,
        );
        noStore(res);
        return res.status(201).json({ visualization });
    } catch (error) {
        return next(error);
    }
}

/**
 * Obtém apenas o estado público de uma visualização pertencente ao titular.
 *
 * @function getCosmeticVisualizationController
 * @returns {Promise<import("express").Response|void>} DTO sanitizado ou erro.
 */
export async function getCosmeticVisualizationController(req, res, next) {
    try {
        const id = validateCosmeticVisualizationId(req.params);
        const visualization = await getCosmeticVisualizationForUser(
            req.user.id,
            id,
        );
        noStore(res);
        return res.status(200).json({ visualization });
    } catch (error) {
        return next(error);
    }
}

/**
 * Serve o PNG cifrado apenas ao titular, com política privada `no-store`.
 *
 * @function getCosmeticVisualizationImageController
 * @returns {Promise<import("express").Response|void>} Bytes PNG autenticados.
 */
export async function getCosmeticVisualizationImageController(req, res, next) {
    try {
        const id = validateCosmeticVisualizationId(req.params);
        const image = await readCosmeticVisualizationImageForUser(
            req.user.id,
            id,
        );
        res.set({
            "Cache-Control": "private, no-store, max-age=0",
            Pragma: "no-cache",
            "Content-Type": image.mimeType,
            "Content-Length": String(image.buffer.length),
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin",
        });
        return res.status(200).send(image.buffer);
    } catch (error) {
        return next(error);
    }
}

/**
 * Revoga o consentimento pontual e cancela publicação futura do pedido.
 *
 * @function revokeCosmeticVisualizationConsentController
 * @returns {Promise<import("express").Response|void>} Instante de revogação.
 */
export async function revokeCosmeticVisualizationConsentController(
    req,
    res,
    next,
) {
    try {
        const id = validateCosmeticVisualizationId(req.params);
        const consent = await revokeCosmeticVisualizationConsent(
            req.user.id,
            id,
        );
        noStore(res);
        return res.status(200).json({ consent });
    } catch (error) {
        return next(error);
    }
}

/**
 * Substitui idempotentemente o feedback estruturado de uma imagem concluída.
 *
 * @function putCosmeticVisualizationFeedbackController
 * @returns {Promise<import("express").Response|void>} Visualização atualizada.
 */
export async function putCosmeticVisualizationFeedbackController(
    req,
    res,
    next,
) {
    try {
        const input = validateCosmeticVisualizationFeedback(
            req.params,
            req.body,
        );
        const visualization = await submitCosmeticVisualizationFeedback(
            req.user.id,
            input.visualizationId,
            input,
        );
        noStore(res);
        return res.status(200).json({ visualization });
    } catch (error) {
        return next(error);
    }
}
