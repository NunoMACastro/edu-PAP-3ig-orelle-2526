import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "./error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";

const PRIVATE_UPLOAD_DIR = path.resolve("storage/private/facial-photos");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: PRIVATE_UPLOAD_DIR,
    filename(req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${crypto.randomUUID()}${extension}`;
        callback(null, safeName);
    },
});

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

function fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return callback(new AppError(400, "Formato de imagem não permitido"));
    }

    return callback(null, true);
}

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