import {
    getMyPreferences,
    updateMyPreferences,
} from "../services/preferences.service.js";
import { validatePreferencesInput } from "../validators/preferences.validator.js";

export async function getMyPreferencesController(req, res, next) {
    try {
        const preferences = await getMyPreferences(req.user.id);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyPreferencesController(req, res, next) {
    try {
        const input = validatePreferencesInput(req.body);
        const preferences = await updateMyPreferences(req.user.id, input);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}