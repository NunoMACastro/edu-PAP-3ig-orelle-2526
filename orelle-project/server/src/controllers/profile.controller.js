import {
    createMyProfile,
    getMyProfile,
    updateMyProfile,
    updateMyProfilePhoto,
} from "../services/profile.service.js";
import {
    validateCreateProfileInput,
    validateUpdateProfileInput,
} from "../validators/profile.validator.js";
import { validateProfilePhotoInput } from "../validators/profile-photo.validator.js";

export async function updateMyProfileController(req, res, next) {
    try {
        const input = validateUpdateProfileInput(req.body);
        const profile = await updateMyProfile(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyProfilePhotoController(req, res, next) {
    try {
        const input = validateProfilePhotoInput(req.body);
        const profile = await updateMyProfilePhoto(req.user.id, input);
export async function getMyProfileController(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.id);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}