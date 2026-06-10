import {
    generateDailyRoutineForUser,
    getMyDailyRoutine,
} from "../services/daily-routine.service.js";

export async function generateDailyRoutineController(req, res, next) {
    try {
        const result = await generateDailyRoutineForUser(req.user.id);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function getMyDailyRoutineController(req, res, next) {
    try {
        const result = await getMyDailyRoutine(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}