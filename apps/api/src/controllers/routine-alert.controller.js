/**
 * Controllers de alertas personalizados de rotina.
 */
import {
    createDueRoutineAlerts,
    getMyRoutineAlertPreference,
    updateMyRoutineAlertPreference,
} from "../services/routine-alert.service.js";
import {
    validateRoutineAlertPreferenceInput,
    validateRoutineAlertRunInput,
} from "../validators/routine-alert.validator.js";

export async function getMyRoutineAlertPreferenceController(req, res, next) {
    try {
        const preference = await getMyRoutineAlertPreference(req.user.id);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyRoutineAlertPreferenceController(req, res, next) {
    try {
        const input = validateRoutineAlertPreferenceInput(req.body);
        const preference = await updateMyRoutineAlertPreference(req.user.id, input);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

export async function runRoutineAlertsController(req, res, next) {
    try {
        const input = validateRoutineAlertRunInput(req.body);
        const result = await createDueRoutineAlerts(input.now);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
