/**
 * Controllers de consentimento e fotografias faciais.
 */
import {
    acceptFaceConsent,
    getFaceConsentForUser,
    getFaceProviderConsentRequirement,
    removeUploadedFiles,
    revokeFaceConsentForUser,
    saveFacePhotos,
} from "../services/face-photo.service.js";
import {
    validateFaceConsentInput,
    validateUploadedFaceFiles,
} from "../validators/face-photo.validator.js";

/**
 * Impede armazenamento de respostas que descrevem uma decisao de
 * consentimento sensivel.
 *
 * @function setConsentNoStoreHeaders
 * @param {import("express").Response} res - Resposta Express.
 * @returns {void}
 */
function setConsentNoStoreHeaders(res) {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
}

/**
 * Consulta o consentimento facial do utilizador autenticado.
 *
 * @async
 * @function getFaceConsentController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Estado atual ou null.
 */
export async function getFaceConsentController(req, res, next) {
    try {
        const consent = await getFaceConsentForUser(req.user.id);

        setConsentNoStoreHeaders(res);
        return res.status(200).json({
            consent,
            providerConsentRequirement: getFaceProviderConsentRequirement(),
        });
    } catch (err) {
        return next(err);
    }
}

/**
 * Aceita consentimento facial do utilizador autenticado.
 *
 * @async
 * @function acceptFaceConsentController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com consentimento.
 */
export async function acceptFaceConsentController(req, res, next) {
    try {
        const input = validateFaceConsentInput(req.body);
        const consent = await acceptFaceConsent(req.user.id, input);

        setConsentNoStoreHeaders(res);
        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

/**
 * Revoga idempotentemente o consentimento facial do utilizador autenticado.
 *
 * A revogacao impede novo processamento, mas nao elimina fotografias ou
 * resultados existentes; esses efeitos pertencem aos pedidos de privacidade.
 *
 * @async
 * @function revokeFaceConsentController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Estado revogado ou null.
 */
export async function revokeFaceConsentController(req, res, next) {
    try {
        const consent = await revokeFaceConsentForUser(req.user.id);

        setConsentNoStoreHeaders(res);
        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

/**
 * Normaliza ficheiros recebidos para limpeza em caso de erro.
 *
 * @function collectUploadedFilesForCleanup
 * @param {Record<string, object[]>|undefined} files - Temporarios do parser Busboy.
 * @returns {{file: object}[]} Ficheiros para cleanup.
 */
function collectUploadedFilesForCleanup(files) {
    return Object.values(files ?? {})
        .flat()
        .map((file) => ({ file }));
}

/**
 * Guarda fotografias faciais frontal e de perfil.
 *
 * @async
 * @function uploadFacePhotosController
 * @param {import("express").Request & {user: {id: string}, faceConsent?: object, files?: Record<string, object[]>}} req - Pedido multipart.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com metadados seguros.
 */
export async function uploadFacePhotosController(req, res, next) {
    try {
        const uploadedFiles = validateUploadedFaceFiles(req.files);
        const photos = await saveFacePhotos(
            req.user.id,
            uploadedFiles,
            req.faceConsent,
            { signal: req.orelleAbortSignal },
        );

        return res.status(201).json({ photos });
    } catch (err) {
        await removeUploadedFiles(collectUploadedFilesForCleanup(req.files));
        return next(err);
    }
}
