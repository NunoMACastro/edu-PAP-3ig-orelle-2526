import { createMyProfile, getMyProfile } from "../services/profile.service.js";
import { validateCreateProfileInput } from "../validators/profile.validator.js";

export async function createMyProfileController(req, res, next) {
    try {
        const input = validateCreateProfileInput(req.body);
        const profile = await createMyProfile(req.user.id, input);

        return res.status(201).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function getMyProfileController(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.id);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}