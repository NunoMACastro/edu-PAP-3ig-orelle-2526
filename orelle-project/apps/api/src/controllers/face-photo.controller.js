import {
    acceptFaceConsent,
    removeUploadedFiles,
    saveFacePhotos,
} from "../services/face-photo.service.js";
import {
    validateFaceConsentInput,
    validateUploadedFaceFiles,
} from "../validators/face-photo.validator.js";

export async function acceptFaceConsentController(req, res, next) {
    try {
        const input = validateFaceConsentInput(req.body);
        const consent = await acceptFaceConsent(req.user.id, input);

        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

function collectUploadedFilesForCleanup(files) {
    return Object.values(files ?? {})
        .flat()
        .map((file) => ({ file }));
}

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