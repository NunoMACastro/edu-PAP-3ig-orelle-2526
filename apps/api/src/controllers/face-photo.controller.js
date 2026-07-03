/**
 * Controllers de consentimento e fotografias faciais.
 */
import {
    acceptFaceConsent,
    removeUploadedFiles,
    saveFacePhotos,
} from "../services/face-photo.service.js";
import {
    validateFaceConsentInput,
    validateUploadedFaceFiles,
} from "../validators/face-photo.validator.js";

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

        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

/**
 * Normaliza ficheiros recebidos para limpeza em caso de erro.
 *
 * @function collectUploadedFilesForCleanup
 * @param {Record<string, Express.Multer.File[]>|undefined} files - Ficheiros Multer.
 * @returns {{file: Express.Multer.File}[]} Ficheiros para cleanup.
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
 * @param {import("express").Request & {user: {id: string}, faceConsent?: object, files?: Record<string, Express.Multer.File[]>}} req - Pedido multipart.
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
        );

        return res.status(201).json({ photos });
    } catch (err) {
        await removeUploadedFiles(collectUploadedFilesForCleanup(req.files));
        return next(err);
    }
}
