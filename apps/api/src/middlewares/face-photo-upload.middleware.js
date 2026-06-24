/**
 * Middleware de upload facial com Multer.
 *
 * A rota deve executar `requireAuth` e `ensureActiveFaceConsent` antes de
 * `uploadFacePhotos`, para evitar escrita em disco sem base de consentimento.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { FaceConsent } from "../models/face-consent.model.js";
import { AppError } from "./error.middleware.js";

const PRIVATE_UPLOAD_DIR = path.resolve("storage/private/facial-photos");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: PRIVATE_UPLOAD_DIR,
    filename(req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extension}`);
    },
});

/**
 * Garante consentimento ativo antes de permitir upload facial.
 *
 * @async
 * @function ensureActiveFaceConsent
 * @param {import("express").Request & {user?: {id: string}, faceConsent?: object}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<void>} Continua ou devolve erro.
 */
export async function ensureActiveFaceConsent(req, res, next) {
    try {
        const consent = await FaceConsent.findOne({
            userId: req.user.id,
            revokedAt: null,
        });

        if (!consent) {
            return next(new AppError(403, "Consentimento facial em falta"));
        }

        req.faceConsent = consent;
        return next();
    } catch (err) {
        return next(err);
    }
}

/**
 * Valida tipo MIME antes de aceitar o ficheiro.
 *
 * @function fileFilter
 * @param {import("express").Request} req - Pedido Express.
 * @param {Express.Multer.File} file - Ficheiro recebido.
 * @param {Function} callback - Callback Multer.
 * @returns {void}
 */
function fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return callback(new AppError(400, "Formato de imagem não permitido"));
    }

    return callback(null, true);
}

/**
 * Middleware Multer que aceita uma fotografia frontal e uma de perfil.
 *
 * @type {import("express").RequestHandler}
 */
export const uploadFacePhotos = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
    },
}).fields([
    { name: "frontal", maxCount: 1 },
    { name: "perfil", maxCount: 1 },
]);
