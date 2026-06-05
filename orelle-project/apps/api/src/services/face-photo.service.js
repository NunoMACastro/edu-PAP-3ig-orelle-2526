import { unlink } from "node:fs/promises";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";

function toFacePhotoResponse(photo) {
    return {
        id: photo._id.toString(),
        kind: photo.kind,
        originalName: photo.originalName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        status: photo.status,
        createdAt: photo.createdAt,
    };
}

export async function removeUploadedFiles(uploadedFiles = []) {
    await Promise.all(
        uploadedFiles.map(({ file }) => {
            if (!file?.path) return undefined;
            return unlink(file.path).catch(() => undefined);
        }),
    );
}

export async function acceptFaceConsent(userId, input) {
    const consent = await FaceConsent.findOneAndUpdate(
        { userId },
        {
            $set: {
                version: input.version,
                purpose: "analise_facial_cosmetica",
                acceptedAt: new Date(),
                revokedAt: null,
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return {
        id: consent._id.toString(),
        version: consent.version,
        acceptedAt: consent.acceptedAt,
        purpose: consent.purpose,
    };
}

export async function saveFacePhotos(userId, uploadedFiles, activeConsent) {
    try {
        const consent =
            activeConsent ??
            (await FaceConsent.findOne({ userId, revokedAt: null }));

        if (!consent) {
            throw new AppError(403, "Consentimento facial em falta");
        }

        const photos = await FacePhoto.insertMany(
            uploadedFiles.map(({ kind, file }) => ({
                userId,
                kind,
                storageKey: file.path,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                consentId: consent._id,
            })),
        );

        return photos.map(toFacePhotoResponse);
    } catch (err) {
        await removeUploadedFiles(uploadedFiles);
        throw err;
    }
}